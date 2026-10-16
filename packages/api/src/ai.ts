/**
 * Klien AI — pembungkus tipis untuk panggilan model generatif.
 *
 * Dua provider dengan tugas berbeda:
 * - **DeepSeek** (`chatJson`): seluruh fitur teks (simplify, quiz, explain, mindmap, flashcards).
 * - **Gemini** (`chatJsonVision`): khusus OCR tulisan tangan → flashcards (Future F3),
 *   karena Gemini unggul membaca teks pada gambar.
 *
 * Aturan Teknis §6:
 * - `temperature: 0.3`, `max_tokens: 1200`;
 * - timeout 8 detik, maksimal 1 retry;
 * - JSON mode untuk endpoint terstruktur.
 *
 * Modul ini **tidak** memvalidasi Zod — itu tugas pemanggil (`routers/ai.ts`).
 * Ia hanya bertanggung jawab memanggil HTTP dengan benar + membatasi waktu.
 */

export const DEEPSEEK_TIMEOUT_MS = 8000;
export const DEEPSEEK_TEMPERATURE = 0.3;
export const DEEPSEEK_MAX_TOKENS = 1200;

/** Gemini sedikit lebih lambat untuk gambar; beri anggaran 2 detik lebih. */
export const GEMINI_TIMEOUT_MS = 10_000;
export const GEMINI_TEMPERATURE = 0.3;
export const GEMINI_MAX_TOKENS = 1200;
export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";
export const GEMINI_DEFAULT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai";

const TRAILING_SLASH = /\/$/;

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface DeepSeekMessage {
  content: string;
  role: "system" | "user" | "assistant";
}

export interface ChatJsonOptions {
  config: DeepSeekConfig;
  messages: DeepSeekMessage[];
  /** AbortSignal opsional dari request tRPC untuk membatalkan bila client pergi. */
  signal?: AbortSignal;
}

export type ChatRole = DeepSeekMessage["role"];

/** Satu bagian konten multimodal (teks atau gambar data-URL). */
export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatVisionMessage {
  content: string | ChatContentPart[];
  role: ChatRole;
}

export interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ChatVisionOptions {
  config: GeminiConfig;
  messages: ChatVisionMessage[];
  signal?: AbortSignal;
}

/** Error khusus agar pemanggil dapat membedakan kegagalan jaringan/timeout/format. */
export class AiError extends Error {
  readonly kind: "timeout" | "http" | "parse" | "empty" | "disabled";
  /** Provider yang gagal — untuk pesan diagnostik yang jelas. */
  readonly provider: "deepseek" | "gemini";

  constructor(
    kind: AiError["kind"],
    provider: AiError["provider"],
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "AiError";
    this.kind = kind;
    this.provider = provider;
  }
}

/** Nama lama dipertahankan agar pemanggil lama tetap bekerja tanpa perubahan. */
export class DeepSeekError extends AiError {
  constructor(kind: AiError["kind"], message: string, options?: ErrorOptions) {
    super(kind, "deepseek", message, options);
    this.name = "DeepSeekError";
  }
}

/**
 * Memanggil `chat/completions` dengan `response_format: json_object` dan
 * mengembalikan objek JSON yang sudah di-parse.
 *
 * Retry dilakukan **satu kali** jika percobaan pertama gagal karena timeout,
 * jaringan, HTTP 5xx/429, atau JSON rusak. Error 4xx lain tidak diulang.
 */
export async function chatJson({
  config,
  messages,
  signal,
}: ChatJsonOptions): Promise<unknown> {
  if (!config.apiKey) {
    throw new DeepSeekError("disabled", "DEEPSEEK_API_KEY belum dikonfigurasi");
  }

  const first = await attempt(config, messages, signal).catch((error) => error);
  if (!(first instanceof Error)) {
    return first;
  }

  if (!isRetryable(first)) {
    throw first;
  }

  return attempt(config, messages, signal);
}

/**
 * Memanggil Gemini (mode OpenAI-compatible) dengan **gambar** + teks, dan
 * mengembalikan objek JSON yang sudah di-parse.
 *
 * Dipakai khusus oleh prosedur `ai.ocrToFlashcards` (Future F3): foto catatan
 * tulisan tangan siswa → teks (OCR) → kartu belajar.
 */
export async function chatJsonVision({
  config,
  messages,
  signal,
}: ChatVisionOptions): Promise<unknown> {
  if (!config.apiKey) {
    throw new AiError(
      "disabled",
      "gemini",
      "GEMINI_API_KEY belum dikonfigurasi"
    );
  }

  const first = await visionAttempt(config, messages, signal).catch(
    (error) => error
  );
  if (!(first instanceof Error)) {
    return first;
  }

  if (!isRetryable(first)) {
    throw first;
  }

  return visionAttempt(config, messages, signal);
}

function isRetryable(error: unknown): boolean {
  if (error instanceof AiError) {
    return error.kind !== "disabled";
  }
  // TypeError dari fetch = kegagalan jaringan (retryable).
  return error instanceof TypeError;
}

function attempt(
  config: DeepSeekConfig,
  messages: DeepSeekMessage[],
  externalSignal?: AbortSignal
): Promise<unknown> {
  return requestJson({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    messages,
    maxTokens: DEEPSEEK_MAX_TOKENS,
    model: config.model,
    provider: "deepseek",
    signal: externalSignal,
    temperature: DEEPSEEK_TEMPERATURE,
    timeoutMs: DEEPSEEK_TIMEOUT_MS,
  });
}

function visionAttempt(
  config: GeminiConfig,
  messages: ChatVisionMessage[],
  externalSignal?: AbortSignal
): Promise<unknown> {
  return requestJson({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    messages,
    maxTokens: GEMINI_MAX_TOKENS,
    model: config.model,
    provider: "gemini",
    signal: externalSignal,
    temperature: GEMINI_TEMPERATURE,
    timeoutMs: GEMINI_TIMEOUT_MS,
  });
}

interface RequestJsonOptions {
  apiKey: string;
  baseUrl: string;
  maxTokens: number;
  messages: (DeepSeekMessage | ChatVisionMessage)[];
  model: string;
  provider: AiError["provider"];
  signal?: AbortSignal;
  temperature: number;
  timeoutMs: number;
}

/**
 * Inti panggilan HTTP bersama untuk DeepSeek **dan** Gemini (keduanya
 * OpenAI-compatible): `POST {baseUrl}/chat/completions` dengan JSON mode.
 * Perbedaan provider hanya pada URL, model, timeout, dan label pesan error.
 */
async function requestJson({
  apiKey,
  baseUrl,
  messages,
  maxTokens,
  model,
  provider,
  signal: externalSignal,
  temperature,
  timeoutMs,
}: RequestJsonOptions): Promise<unknown> {
  const label = provider === "gemini" ? "Gemini" : "DeepSeek";
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = externalSignal
    ? AbortSignal.any([externalSignal, timeoutSignal])
    : timeoutSignal;

  const endpoint = `${baseUrl.replace(TRAILING_SLASH, "")}/chat/completions`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal,
    });
  } catch (error) {
    if (timeoutSignal.aborted) {
      // biome-ignore lint/style/useErrorCause: AiError menerima `cause` di ErrorOptions; rule belum mengenali kelas ini.
      throw new AiError(
        "timeout",
        provider,
        `${label} melebihi batas waktu ${Math.round(timeoutMs / 1000)} detik`,
        { cause: error }
      );
    }
    throw error;
  }

  if (!response.ok) {
    throw new AiError(
      "http",
      provider,
      `${label} mengembalikan HTTP ${response.status}`
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiError(
      "empty",
      provider,
      `${label} mengembalikan respons kosong`
    );
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    // biome-ignore lint/style/useErrorCause: AiError menerima `cause` di ErrorOptions; rule belum mengenali kelas ini.
    throw new AiError(
      "parse",
      provider,
      `Respons ${label} bukan JSON yang valid`,
      { cause: error }
    );
  }
}
