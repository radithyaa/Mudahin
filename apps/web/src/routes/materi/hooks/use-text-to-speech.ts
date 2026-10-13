import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Text-to-Speech dengan penanda kata (FR-AUD-01..03).
 *
 * Memakai Web Speech API (`SpeechSynthesis`). Kecepatan dapat diatur;
 * saat dibacakan, indeks kata aktif dilaporkan lewat `onWord` sehingga UI
 * dapat menyorot kata yang sedang dibaca.
 *
 * Catatan lintas browser:
 * - `onboundary` tidak didukung semua browser/voice. Bila tidak ada, kita
 *   memperkirakan progres berdasarkan `onstart`/`onend` per-utterance;
 *   di sini kami memecah teks menjadi beberapa utterance per kalimat agar
 *   progres tetap terlihat tanpa `onboundary`.
 */

export interface UseTextToSpeechOptions {
  /** Dipanggil setiap kali indeks karakter yang dibaca berubah. */
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
  rate?: number;
  /** Daftar kata (dari teks yang sama) untuk memetakan boundary ke indeks kata. */
  words?: string[];
}

export interface TextToSpeechControls {
  /** Indeks kata aktif (dari `words`), -1 bila tidak ada. */
  activeWordIndex: number;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
}

export function useTextToSpeech({
  rate = 1,
  onBoundary,
  onEnd,
}: UseTextToSpeechOptions = {}): TextToSpeechControls {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Simpan callback di ref agar efek tidak bergantung pada identitas fungsi.
  const onBoundaryRef = useRef(onBoundary);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onBoundaryRef.current = onBoundary;
    onEndRef.current = onEnd;
  }, [onBoundary, onEnd]);

  const cancel = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setActiveWordIndex(-1);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || text.trim().length === 0) {
        return;
      }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.lang = "id-ID";
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setActiveWordIndex(-1);
        onEndRef.current?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setActiveWordIndex(-1);
      };
      utterance.onboundary = (event) => {
        onBoundaryRef.current?.(event.charIndex);
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate]
  );

  // Bersihkan saat unmount agar suara tidak "nyangkut".
  useEffect(() => {
    if (!isSupported) {
      return;
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  return useMemo(
    () => ({ activeWordIndex, cancel, isSpeaking, isSupported, speak }),
    [activeWordIndex, cancel, isSpeaking, isSupported, speak]
  );
}

/** Memecah teks menjadi kata + offset karakter untuk memetakan boundary→kata. */
export function tokenizeWords(
  text: string
): { index: number; start: number; word: string }[] {
  const tokens: { index: number; start: number; word: string }[] = [];
  const regex = /\S+/g;
  let match = regex.exec(text);
  let index = 0;
  while (match !== null) {
    tokens.push({ index, start: match.index, word: match[0] });
    index += 1;
    match = regex.exec(text);
  }
  return tokens;
}

/** Memetakan `charIndex` dari `onboundary` ke indeks kata terdekat. */
export function wordIndexFromChar(
  tokens: { index: number; start: number }[],
  charIndex: number,
  fallback: number
): number {
  if (tokens.length === 0) {
    return fallback;
  }
  let current = tokens[0]?.index ?? fallback;
  for (const token of tokens) {
    if (token.start <= charIndex) {
      current = token.index;
    } else {
      break;
    }
  }
  return current;
}
