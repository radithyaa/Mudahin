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

interface SpeechRecognitionLike {
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const WHITESPACE = /\s+/;

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
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  transcript: string;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isSupported = getRecognitionCtor() !== null;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    setIsListening(false);
    setTranscript("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      return;
    }

    // Hentikan sesi sebelumnya bila ada.
    recognitionRef.current?.abort();

    const recognition = new Ctor();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result) {
          text += result[0].transcript;
        }
      }
      setTranscript(text.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setTranscript("");
    setIsListening(true);
    recognition.start();
  }, []);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    []
  );

  return useMemo(
    () => ({ cancel, isListening, isSupported, start, stop, transcript }),
    [cancel, isListening, isSupported, start, stop, transcript]
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
