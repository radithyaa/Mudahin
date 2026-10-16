import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TRPC_URL } from "./env";
import {
  SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE,
  type UseSpeechRecognitionResult,
  useSpeechRecognition as useWebSpeechRecognition,
} from "./speech-recognition";
import { isLikelyTtsUnsupported } from "./speech-support";

/**
 * Speech-to-Text dengan **fallback server-side**.
 *
 * Lapisan ini membungkus `useSpeechRecognition` (Web Speech API) dengan mesin
 * rekam yang selalu bekerja: `MediaRecorder` + `speech.transcribe` di server.
 *
 * Alasan: WebView Android — dasar APK Tauri — tidak mengekspos
 * `SpeechRecognition`, sehingga tombol mic tampak mati di aplikasi mobile.
 * Padahal `MediaRecorder` **selalu** tersedia di WebView modern. Karena itu:
 * - Web Speech API dipakai bila ada (transkrip langsung/streaming, gratis);
 * - kalau tidak, rekaman ditampung dari `MediaRecorder`, dikirim ke server, lalu
 *   ditampilkan sebagai transkrip final.
 */

/** Batas panjang rekaman server (ms) — menjaga payload tetap wajar. */
const MAX_SERVER_RECORDING_MS = 30_000;

/** Batas waktu menunggu jawaban server saat transkripsi. */
const TRANSCRIBE_TIMEOUT_MS = 25_000;

/** Interval pengumpulan data rekaman (ms). */
const RECORDER_TIMESLICE_MS = 250;

/**
 * Deteksi keheningan pada jalur perekam server.
 *
 * `MediaRecorder` tidak memberi tahu kapan pengguna berhenti bicara. Untuk
 * memenuhi alur "tidak ada suara lagi → otomatis dikirim", kita mengamati volume
 * mikrofon lewat Web Audio API: setelah pengguna bicara dan level suara bertahan
 * di bawah ambang selama `SILENCE_MS`, rekaman dihentikan otomatis.
 */
const SILENCE_THRESHOLD = 0.02;
const SILENCE_MS = 1800;
const VOLUME_POLL_MS = 200;
/** Pengguna harus sempat bicara sebelum keheningan dianggap akhir jawaban. */
const MIN_SPEECH_MS = 700;

interface RecorderLike {
  mimeType?: string;
  ondataavailable: ((event: BlobEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onstop: (() => void) | null;
  start: (timeslice?: number) => void;
  state: string;
  stop: () => void;
}

interface MediaRecorderCtor {
  isTypeSupported?: (type: string) => boolean;
  new (stream: MediaStream, options?: { mimeType?: string }): RecorderLike;
}

/** Format rekaman yang didukung secara luas oleh WebView/Chromium. */
const RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
] as const;

function getRecorderCtor(): MediaRecorderCtor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const candidate = (window as unknown as { MediaRecorder?: MediaRecorderCtor })
    .MediaRecorder;
  return candidate ?? null;
}

/** Pilih format rekaman pertama yang didukung perangkat. */
function pickRecorderMimeType(Ctor: MediaRecorderCtor): string | undefined {
  if (typeof Ctor.isTypeSupported !== "function") {
    return undefined;
  }
  return RECORDER_MIME_CANDIDATES.find((type) => Ctor.isTypeSupported?.(type));
}

/** Mengubah blob audio menjadi base64 murni (tanpa awalan data URL). */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca rekaman suara."));
    reader.onload = () => {
      const { result } = reader;
      if (typeof result !== "string") {
        reject(new Error("Gagal membaca rekaman suara."));
        return;
      }
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

/** Mengirim rekaman ke server dan mengembalikan transkripnya. */
async function transcribeOnServer(
  blob: Blob,
  mimeType: string
): Promise<string> {
  const base64 = await blobToBase64(blob);
  const controller = new AbortController();
  const watchdog = globalThis.setTimeout(
    () => controller.abort(),
    TRANSCRIBE_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${TRPC_URL}/speech.transcribe`, {
      body: JSON.stringify({
        json: { audioDataUrl: `data:${mimeType};base64,${base64}` },
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        response.status === 412
          ? "Fitur suara belum aktif di server ini."
          : "Server tidak bisa mengenali suaramu. Coba lagi."
      );
    }

    const envelope = (await response.json()) as {
      result?: { data?: { text?: string } };
    };
    return (envelope.result?.data?.text ?? "").trim();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Pengenalan suara terlalu lama. Coba rekam lebih singkat.",
        { cause: error }
      );
    }
    throw error;
  } finally {
    globalThis.clearTimeout(watchdog);
  }
}

/**
 * Membuat pengamat keheningan memakai Web Audio API.
 *
 * Mengukur volume mikrofon secara berkala; begitu pengguna sudah sempat bicara
 * (`MIN_SPEECH_MS`) lalu level suara bertahan di bawah `SILENCE_THRESHOLD` selama
 * `SILENCE_MS`, `onSilence` dipanggil sekali. Bila Web Audio tidak tersedia,
 * pengamat ini tidak melakukan apa-apa — rekaman tetap berhenti pada batas waktu
 * maksimum.
 *
 * @returns penghenti yang membersihkan interval, audio context, dan node analisis.
 */
function createSilenceWatcher(
  stream: MediaStream,
  onSilence: () => void
): { stop: () => void } {
  const AudioCtxCtor =
    typeof window === "undefined"
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext);

  if (!AudioCtxCtor) {
    return { stop: () => undefined };
  }

  let context: AudioContext | null = null;
  let interval: ReturnType<typeof globalThis.setInterval> | null = null;
  let stopped = false;
  const startedAt = Date.now();
  let silenceSince: number | null = null;

  try {
    context = new AudioCtxCtor();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);

    interval = globalThis.setInterval(() => {
      if (stopped || !analyser) {
        return;
      }
      analyser.getByteTimeDomainData(samples);
      // Deviasi dari nilai tengah 128 menandakan adanya suara.
      let peak = 0;
      for (const sample of samples) {
        peak = Math.max(peak, Math.abs(sample - 128) / 128);
      }

      const hasSpoken = Date.now() - startedAt >= MIN_SPEECH_MS;
      if (peak >= SILENCE_THRESHOLD || !hasSpoken) {
        silenceSince = null;
        return;
      }

      const now = Date.now();
      silenceSince ??= now;
      if (now - silenceSince >= SILENCE_MS) {
        stopped = true;
        onSilence();
      }
    }, VOLUME_POLL_MS);
  } catch {
    return { stop: () => undefined };
  }

  const contextToClose = context;
  return {
    stop: () => {
      stopped = true;
      if (interval !== null) {
        globalThis.clearInterval(interval);
        interval = null;
      }
      contextToClose?.close().catch(() => undefined);
    },
  };
}

/**
 * Mesin rekam berbasis `MediaRecorder` untuk perangkat tanpa Web Speech API.
 *
 * Mengembalikan API yang **sama** dengan `useSpeechRecognition` sehingga
 * pemanggil tidak perlu tahu jalur mana yang sedang dipakai.
 */
function useRecorderSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<RecorderLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const autoStopRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null
  );
  /** Pengamat keheningan (Web Audio) yang dijalankan selama merekam. */
  const silenceRef = useRef<{ stop: () => void } | null>(null);

  const cleanup = useCallback(() => {
    if (autoStopRef.current !== null) {
      globalThis.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    silenceRef.current?.stop();
    silenceRef.current = null;
    for (const track of streamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    setIsListening(false);
    cleanup();
  }, [cleanup]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    setIsListening(false);
    setTranscript("");
    cleanup();
  }, [cleanup]);

  const start = useCallback(async () => {
    const Ctor = getRecorderCtor();
    if (!Ctor) {
      setError(SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE);
      return;
    }

    setError(null);
    setTranscript("");
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "Izin mikrofon ditolak. Aktifkan izin mikrofon untuk aplikasi ini di pengaturan perangkat."
      );
      return;
    }

    streamRef.current = stream;
    const mimeType = pickRecorderMimeType(Ctor);
    mimeTypeRef.current = mimeType ?? "audio/webm";

    let recorder: RecorderLike;
    try {
      recorder = mimeType ? new Ctor(stream, { mimeType }) : new Ctor(stream);
    } catch {
      cleanup();
      setError("Mikrofon tidak bisa dinyalakan di perangkat ini.");
      return;
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onerror = () => {
      setIsListening(false);
      setError("Perekaman suara gagal. Coba lagi sebentar lagi.");
      cleanup();
    };

    recorder.onstop = () => {
      setIsListening(false);
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      cleanup();

      if (blob.size === 0) {
        setError("Belum ada suara yang terekam. Coba bicara lebih dekat.");
        return;
      }

      transcribeOnServer(blob, mimeTypeRef.current)
        .then((text) => {
          if (text.length === 0) {
            setError(
              "Belum ada suara yang terdengar. Coba bicara lebih dekat."
            );
            return;
          }
          setTranscript(text);
        })
        .catch((transcribeError: unknown) => {
          setError(
            transcribeError instanceof Error
              ? transcribeError.message
              : "Gagal mengenali suara. Coba lagi."
          );
        });
    };

    recorderRef.current = recorder;
    setIsListening(true);
    recorder.start(RECORDER_TIMESLICE_MS);

    // Deteksi keheningan: hentikan otomatis begitu pengguna berhenti bicara,
    // sehingga alur "tidak ada suara lagi → kirim ke AI" bekerja di mobile juga.
    silenceRef.current = createSilenceWatcher(stream, () => stop());

    autoStopRef.current = globalThis.setTimeout(
      () => stop(),
      MAX_SERVER_RECORDING_MS
    );
  }, [cleanup, stop]);

  const startSafe = useCallback(() => {
    start().catch(() => undefined);
  }, [start]);

  useEffect(() => () => cancel(), [cancel]);

  return useMemo(
    () => ({
      cancel,
      error,
      isListening,
      isSupported: getRecorderCtor() !== null,
      start: startSafe,
      stop,
      transcript,
    }),
    [cancel, error, isListening, startSafe, stop, transcript]
  );
}

/**
 * Hook STT pilihan aplikasi.
 *
 * Memilih otomatis: Web Speech API (bila perangkat menyediakannya) atau mesin
 * rekam server-side. Kedua hook dijalankan (aturan hook tidak boleh kondisional)
 * tetapi yang tidak dipakai tidak pernah `start()`, jadi tidak ada efek samping.
 *
 * Di cangkang Tauri/WebView Android, `SpeechRecognition` kadang **ada** tetapi
 * tidak berfungsi (mesin pengenal tidak terpasang, langsung `no-speech`/
 * `service-not-allowed`). Kasus itu dideteksi lewat `shouldPreferServerStt`
 * sehingga rekaman langsung dikirim ke server — inilah perbaikan "belum berfungsi
 * di app mobile" meski server-side sudah ada.
 */
export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const web = useWebSpeechRecognition();
  const recorder = useRecorderSpeechRecognition();
  if (shouldPreferServerStt()) {
    return recorder;
  }
  return web.isSupported ? web : recorder;
}

/**
 * Apakah perangkat sebaiknya memakai rekam-lalu-kirim ke server, bukan mesin
 * pengenal perangkat.
 *
 * Dipakai bersama `isLikelyTtsUnsupported`: Android WebView & cangkang Tauri
 * sama-sama sering mengekspos `SpeechRecognition` tanpa mesin di belakangnya.
 */
export function shouldPreferServerStt(): boolean {
  return isLikelyTtsUnsupported();
}
