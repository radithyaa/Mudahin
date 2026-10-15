import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Speech-to-Text (FR-AUD-04) memakai Web Speech API (`SpeechRecognition`).
 *
 * Dipakai untuk menjawab kuis dengan suara. Karena API ini masih berprefiks
 * di beberapa peramban, kami mendeteksi ketersediaannya dan menyediakan
 * `isSupported` agar UI dapat menyembunyikan tombol bila tidak didukung.
 */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorLike {
  error?: string;
}

interface SpeechRecognitionLike {
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const WHITESPACE = /\s+/;

/** Pesan saat peramban/WebView tidak menyediakan mesin pengenal suara. */
export const SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE =
  "Perekaman suara belum didukung di perangkat atau browser ini.";

/** Menerjemahkan kode kesalahan Web Speech menjadi pesan yang ramah pengguna. */
export function speechErrorMessage(code?: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Izin mikrofon ditolak. Aktifkan izin mikrofon untuk aplikasi ini di pengaturan perangkat.";
    case "audio-capture":
      return "Mikrofon tidak terdeteksi. Pastikan perangkat memiliki mikrofon yang aktif.";
    case "network":
      return "Pengenalan suara butuh koneksi internet. Periksa jaringanmu lalu coba lagi.";
    case "no-speech":
      return "Belum ada suara yang terdengar. Coba bicara lebih dekat ke mikrofon.";
    case "aborted":
      return "Perekaman dihentikan.";
    default:
      return "Perekaman suara gagal. Coba lagi sebentar lagi.";
  }
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognitionResult {
  cancel: () => void;
  /** Pesan kesalahan terakhir (mis. izin mikrofon ditolak), atau `null`. */
  error: string | null;
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  transcript: string;
}

/**
 * Menggabungkan hasil baru dengan transkrip final sebelumnya.
 *
 * Event Web Speech hanya memuat hasil yang berubah sejak `resultIndex`, dan
 * hasil final tiba bertahap. Fungsi murni ini mengumpulkan hasil final
 * (`finalRef`) lalu menambahkan interim terbaru, sehingga ucapan yang sudah
 * dikonfirmasi tidak hilang saat event berikutnya melompat maju.
 *
 * @returns transkrip gabungan & nilai final terbaru untuk disimpan pemanggil.
 */
export function combineSpeechResults(
  event: {
    resultIndex: number;
    results: { length: number; [index: number]: SpeechRecognitionResultLike };
  },
  previousFinal: string
): { final: string; transcript: string } {
  let final = previousFinal;
  for (let i = event.resultIndex; i < event.results.length; i += 1) {
    const result = event.results[i];
    if (result?.isFinal) {
      final += result[0].transcript;
    }
  }

  let interim = "";
  for (let i = event.resultIndex; i < event.results.length; i += 1) {
    const result = event.results[i];
    if (result && !result.isFinal) {
      interim += result[0].transcript;
    }
  }

  return { final, transcript: `${final}${interim}`.trim() };
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");
  const isSupported = getRecognitionCtor() !== null;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    setIsListening(false);
    finalTranscriptRef.current = "";
    setTranscript("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError(SPEECH_RECOGNITION_UNSUPPORTED_MESSAGE);
      return;
    }

    // Hentikan sesi sebelumnya bila ada.
    recognitionRef.current?.abort();
    finalTranscriptRef.current = "";
    setError(null);

    const recognition = new Ctor();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      // Hasil final dikumpulkan lewat ref agar tidak hilang walau event
      // berikutnya melompat (`resultIndex` menunjuk hasil terbaru saja).
      const { final, transcript: combined } = combineSpeechResults(
        event,
        finalTranscriptRef.current
      );
      finalTranscriptRef.current = final;
      if (combined.length > 0) {
        setTranscript(combined);
      }
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setError(speechErrorMessage(event?.error));
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setTranscript("");
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setError(
        "Mikrofon tidak bisa dinyalakan. Pastikan izin mikrofon sudah diberikan."
      );
    }
  }, []);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    []
  );

  return useMemo(
    () => ({
      cancel,
      error,
      isListening,
      isSupported,
      start,
      stop,
      transcript,
    }),
    [cancel, error, isListening, isSupported, start, stop, transcript]
  );
}

/**
 * Mencocokkan ucapan pengguna ke salah satu pilihan jawaban.
 * Mengembalikan indeks opsi, atau -1 bila tidak ada yang cocok.
 *
 * Strategi: normalisasi teks → cocokkan label opsi (A/B/C/D) → fallback
 * ke kemiripan kata kunci opsi.
 */
export function matchOptionIndex(spoken: string, options: string[]): number {
  const normalized = spoken.toLowerCase().trim();
  if (normalized.length === 0) {
    return -1;
  }

  const spokenWords = new Set(normalized.split(WHITESPACE));
  const labelMap = ["a", "b", "c", "d", "e"];

  // Cek label lisan ("a", "b", ...) lebih dulu.
  const labelIndex = labelMap
    .slice(0, options.length)
    .findIndex((label) => spokenWords.has(label));
  if (labelIndex >= 0) {
    return labelIndex;
  }

  // Fallback: cocokkan kata kunci — opsi yang katanya paling banyak muncul.
  let bestIndex = -1;
  let bestScore = 0;
  for (let index = 0; index < options.length; index += 1) {
    const keywords = (options[index] ?? "")
      .toLowerCase()
      .split(WHITESPACE)
      .filter((word) => word.length > 3);
    const score = keywords.filter((word) => normalized.includes(word)).length;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestIndex;
}
