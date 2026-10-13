import { Button } from "@mudahin/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@mudahin/ui/components/drawer";
import { Skeleton } from "@mudahin/ui/components/skeleton";
import { HelpCircle, RefreshCw, Sparkles, Volume2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { aiErrorMessage, useExplain } from "../hooks/use-ai";
import { useTextToSpeech } from "../hooks/use-text-to-speech";
import { TTS_RATE_DEFAULT, TtsControls } from "./tts-controls";

/**
 * "Jelaskan ini" (FR-AI-03) — pengguna menyorot potongan teks, lalu AI
 * menjelaskannya dengan bahasa sederhana di bottom sheet (pola mobile).
 *
 * Dibuka dari tombol mengambang saat ada teks tersorot.
 */
export function ExplainSheet({
  hasSelection,
  materialTitle,
  onRequestText,
}: {
  /** Apakah pengguna sedang menyorot teks — menentukan penanda tombol. */
  hasSelection: boolean;
  materialTitle: string;
  onRequestText: () => string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const explain = useExplain();
  const { mutate, isPending, isError, error, data, reset } = explain;

  const [rate, setRate] = useState(TTS_RATE_DEFAULT);
  const { cancel, isSpeaking, isSupported, speak } = useTextToSpeech({ rate });

  const runExplain = useCallback(
    (text: string) => {
      reset();
      mutate({ context: materialTitle, text });
    },
    [materialTitle, mutate, reset]
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        const text = onRequestText().trim();
        const snippet = text.length > 0 ? text : "";
        setSelectedText(snippet);
        if (snippet.length > 0) {
          runExplain(snippet);
        }
      } else {
        cancel();
        reset();
      }
    },
    [cancel, onRequestText, reset, runExplain]
  );

  const handleRetry = useCallback(() => {
    if (selectedText.length > 0) {
      runExplain(selectedText);
    }
  }, [runExplain, selectedText]);

  const toggleSpeak = useCallback(() => {
    if (!data) {
      return;
    }
    if (isSpeaking) {
      cancel();
      return;
    }
    speak(data.explanation);
  }, [cancel, data, isSpeaking, speak]);

  const canExplain = open && selectedText.length > 0;

  return (
    <Drawer
      onOpenChange={handleOpenChange}
      open={open}
      showSwipeHandle
      swipeDirection="down"
    >
      <DrawerTrigger
        render={
          <Button
            aria-label={
              hasSelection
                ? "Jelaskan teks yang dipilih"
                : "Jelaskan ini — sorot teks dulu"
            }
            className="shadow-lg"
            size="lg"
            variant="default"
          />
        }
      >
        <HelpCircle aria-hidden="true" />
        <span>Jelaskan ini</span>
        {hasSelection ? (
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-primary-foreground"
          />
        ) : null}
      </DrawerTrigger>

      <DrawerContent className="mx-auto max-w-lg rounded-t-2xl border shadow-xl">
        <DrawerHeader>
          <DrawerTitle className="text-base">Penjelasan Sederhana</DrawerTitle>
        </DrawerHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {selectedText.length > 0 ? (
            <blockquote className="border-primary/40 border-l-2 bg-muted/50 p-3 text-muted-foreground text-sm italic">
              “{selectedText}”
            </blockquote>
          ) : (
            <p className="text-muted-foreground text-sm">
              Sorot sebagian teks materi terlebih dahulu, lalu tekan "Jelaskan
              ini".
            </p>
          )}

          {isPending && canExplain ? (
            <div className="flex flex-col gap-2" role="status">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <span className="sr-only">
                Menyiapkan penjelasan, mohon tunggu.
              </span>
            </div>
          ) : null}

          {isError ? (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-destructive text-sm">
                {aiErrorMessage(error)}
              </p>
              <Button
                className="min-h-11"
                onClick={handleRetry}
                variant="outline"
              >
                <RefreshCw aria-hidden="true" /> Coba lagi
              </Button>
            </div>
          ) : null}

          {data ? (
            <>
              <p className="flex items-start gap-2 text-base leading-relaxed">
                <Sparkles
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-primary"
                />
                <span>{data.explanation}</span>
              </p>
              {isSupported ? (
                <TtsControls
                  isSpeaking={isSpeaking}
                  isSupported={isSupported}
                  onRateChange={setRate}
                  onToggle={toggleSpeak}
                  rate={rate}
                />
              ) : (
                <p className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Volume2 aria-hidden="true" className="size-3.5" />
                  Pembacaan suara tidak didukung di peramban ini.
                </p>
              )}
            </>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** Menyimpan teks terpilih terakhir; dibersihkan setelah dipakai. */
export function useSelectedText(): {
  clear: () => void;
  getSelectedText: () => string;
  hasSelection: boolean;
} {
  const [last, setLast] = useState("");
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    const capture = () => {
      const text = window.getSelection()?.toString() ?? "";
      if (text.trim().length > 0) {
        setLast(text);
        setHasSelection(true);
      }
    };
    // `selectionchange` cukup di desktop; di peramban sentuh (iOS/Android) event
    // ini sering tidak terpicu saat seleksi long-press, sehingga kita juga
    // menangkap pada akhir sentuhan/pointer (mobile-first, gesture friendly).
    document.addEventListener("selectionchange", capture);
    document.addEventListener("pointerup", capture);
    document.addEventListener("touchend", capture);
    return () => {
      document.removeEventListener("selectionchange", capture);
      document.removeEventListener("pointerup", capture);
      document.removeEventListener("touchend", capture);
    };
  }, []);

  const getSelectedText = useCallback(() => {
    const now = window.getSelection()?.toString() ?? "";
    return now.trim().length > 0 ? now.trim() : last.trim();
  }, [last]);

  const clear = useCallback(() => setLast(""), []);

  return { clear, getSelectedText, hasSelection };
}
