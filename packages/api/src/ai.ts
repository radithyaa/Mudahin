/**
 * Klien DeepSeek — pembungkus tipis untuk panggilan `deepseek-chat`.
 *
 * Aturan Teknis §6:
 * - model `deepseek-chat` (bukan `deepseek-reasoner`);
 * - `temperature: 0.3`, `max_tokens: 1200`;
 * - timeout 8 detik, maksimal 1 retry;
 * - JSON mode untuk endpoint terstruktur (simplify, quiz).
 *
 * Modul ini **tidak** memvalidasi Zod — itu tugas pemanggil (`routers/ai.ts`).
 * Ia hanya bertanggung jawab memanggil HTTP dengan benar + membatasi waktu.
 */

export const DEEPSEEK_TIMEOUT_MS = 8000;
export const DEEPSEEK_TEMPERATURE = 0.3;
export const DEEPSEEK_MAX_TOKENS = 1200;

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

/** Error khusus agar pemanggil dapat membedakan kegagalan jaringan/timeout/format. */
export class DeepSeekError extends Error {
  readonly kind: "timeout" | "http" | "parse" | "empty" | "disabled";

  constructor(
    kind: DeepSeekError["kind"],
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "DeepSeekError";
    this.kind = kind;
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

function isRetryable(error: unknown): boolean {
  if (error instanceof DeepSeekError) {
    return error.kind !== "disabled";
  }
  // TypeError dari fetch = kegagalan jaringan (retryable).
  return error instanceof TypeError;
}

async function attempt(
  config: DeepSeekConfig,
  messages: DeepSeekMessage[],
  externalSignal?: AbortSignal
): Promise<unknown> {
  const timeoutSignal = AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS);
  const signal = externalSignal
    ? AbortSignal.any([externalSignal, timeoutSignal])
    : timeoutSignal;

  const endpoint = `${config.baseUrl.replace(TRAILING_SLASH, "")}/chat/completions`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      body: JSON.stringify({
        model: config.model,
        messages,
        response_format: { type: "json_object" },
        temperature: DEEPSEEK_TEMPERATURE,
        max_tokens: DEEPSEEK_MAX_TOKENS,
        stream: false,
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal,
    });
  } catch (error) {
    if (timeoutSignal.aborted) {
      // biome-ignore lint/style/useErrorCause: DeepSeekError menerima `cause` di ErrorOptions; rule belum mengenali kelas ini.
      throw new DeepSeekError(
        "timeout",
        "DeepSeek melebihi batas waktu 8 detik",
        { cause: error }
      );
    }
    throw error;
  }

  if (!response.ok) {
    throw new DeepSeekError(
      "http",
      `DeepSeek mengembalikan HTTP ${response.status}`
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new DeepSeekError("empty", "DeepSeek mengembalikan respons kosong");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    // biome-ignore lint/style/useErrorCause: DeepSeekError menerima `cause` di ErrorOptions; rule belum mengenali kelas ini.
    throw new DeepSeekError("parse", "Respons DeepSeek bukan JSON yang valid", {
      cause: error,
    });
  }
}
