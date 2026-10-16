import { TRPCError } from "@trpc/server";
import { AiError, GEMINI_DEFAULT_BASE_URL } from "../ai";
import { parseDataUrl, synthesizeSpeech, transcribeSpeech } from "../audio";
import { hashKey, readCache, writeCache } from "../cache";
import { publicProcedure, router } from "../index";
import {
  type SynthesizeSpeechResult,
  synthesizeSpeechInputSchema,
  type TranscribeSpeechResult,
  transcribeSpeechInputSchema,
} from "../schemas";

/**
 * Router suara server-side — TTS & STT.
 *
 * **Mengapa server-side:** WebView Android (cangkang APK Tauri) umumnya tidak
 * mengekspos `speechSynthesis` (TTS) maupun `SpeechRecognition` (STT), sehingga
 * tombol suara tampak mati di perangkat mobile. Keduanya kini dijalankan di
 * Worker memakai Gemini, dan klien memutar/merekam audionya sendiri lewat
 * `<audio>` + `MediaRecorder` — dua API yang **selalu ada** di WebView.
 *
 * Frontend tetap memakai Web Speech API bila tersedia (gratis, tanpa jaringan)
 * dan hanya jatuh ke prosedur ini saat perangkat tidak mendukung.
 */

type ApiContext = Parameters<
  Parameters<typeof publicProcedure.query>[0]
>[0]["ctx"];

/**
 * Konfigurasi Gemini untuk audio.
 *
 * Gemini TTS/STT memakai endpoint **asli** (`generativelanguage.googleapis.com`),
 * bukan jalur OpenAI-compatible yang dipakai OCR — jadi `GEMINI_BASE_URL` yang
 * berakhiran `/openai` dinormalkan ke akar v1beta agar tidak salah alamat.
 */
function geminiAudioConfig(ctx: ApiContext): {
  apiKey: string;
  baseUrl: string;
} {
  const { env } = ctx;
  const configured = env.GEMINI_BASE_URL ?? GEMINI_DEFAULT_BASE_URL;
  const normalized = configured.replace(OPENAI_SUFFIX, "");
  return {
    apiKey: env.GEMINI_API_KEY ?? "",
    baseUrl: normalized || "https://generativelanguage.googleapis.com/v1beta",
  };
}

/** Petunjuk ramah untuk pengguna saat suara tidak tersedia. */
const VOICE_UNAVAILABLE_MESSAGE =
  "Fitur suara belum dikonfigurasi di server. Hubungi pengelola aplikasi untuk mengaktifkan kunci Gemini.";

/** Akhiran `/openai` pada base URL Gemini yang tidak berlaku untuk endpoint audio. */
const OPENAI_SUFFIX = /\/openai\/?$/;

export const speechRouter = router({
  /**
   * Teks → suara. Hasil disimpan di cache D1 (hash teks) supaya kalimat yang
   * sama tidak pernah disintesis dua kali — hemat kuota & instan saat demo.
   */
  synthesize: publicProcedure
    .input(synthesizeSpeechInputSchema)
    .mutation(
      async ({ ctx, input, signal }): Promise<SynthesizeSpeechResult> => {
        const key = await hashKey("tts", input.text.trim());

        const cached = await readCache<SynthesizeSpeechResult>(ctx.db, key);
        if (cached) {
          return cached;
        }

        const { audio, mimeType } = await callGeminiAudio(
          () => synthesizeSpeech(geminiAudioConfig(ctx), input.text, signal),
          "Gagal membuat suara panduan"
        );

        const result: SynthesizeSpeechResult = {
          audioDataUrl: `data:${mimeType};base64,${bytesToBase64(audio)}`,
          mimeType,
        };

        await writeCache(ctx.db, key, "tts", result);
        return result;
      }
    ),

  /** Suara → teks. Rekaman tidak di-cache (isinya unik & privat). */
  transcribe: publicProcedure
    .input(transcribeSpeechInputSchema)
    .mutation(
      async ({ ctx, input, signal }): Promise<TranscribeSpeechResult> => {
        const audio = parseDataUrl(input.audioDataUrl);
        const text = await callGeminiAudio(
          () => transcribeSpeech(geminiAudioConfig(ctx), audio, signal),
          "Gagal mengenali suara"
        );

        // Model menjawab penanda khusus bila rekaman benar-benar hening.
        const cleaned = text.replace(/\(tidak ada suara\)/gi, "").trim();
        return { text: cleaned };
      }
    ),
});

/** Mengubah byte menjadi base64 untuk dibungkus menjadi data URL. */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/** Menjalankan operasi suara dan memetakan kegagalan ke TRPCError yang ramah UI. */
async function callGeminiAudio<T>(
  run: () => Promise<T>,
  fallbackMessage: string
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof AiError && error.kind === "disabled") {
      // biome-ignore lint/style/useErrorCause: TRPCError menerima `cause` di opsi objeknya; rule belum mengenali kelas ini.
      throw new TRPCError({
        cause: error,
        code: "PRECONDITION_FAILED",
        message: VOICE_UNAVAILABLE_MESSAGE,
      });
    }
    // biome-ignore lint/style/useErrorCause: TRPCError menerima `cause` di opsi objeknya; rule belum mengenali kelas ini.
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `${fallbackMessage}. Coba lagi sebentar lagi.`,
      cause: error,
    });
  }
}
