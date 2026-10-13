import { cn } from "@mudahin/ui/lib/utils";
import { useMemo } from "react";

const WHITESPACE_SPLIT = /(\s+)/;

interface WordToken {
  key: string;
  text: string;
  wordIndex: number;
}

/**
 * Menampilkan teks dengan kata aktif tersorot. Dipakai Focus Reader &
 * Ringkasan AI untuk memvisualisasikan posisi TTS (FR-AUD-02).
 */
export function HighlightedText({
  activeWordIndex,
  className,
  text,
}: {
  activeWordIndex: number;
  className?: string;
  text: string;
}) {
  const tokens = useMemo<WordToken[]>(() => {
    const parts = text.split(WHITESPACE_SPLIT);
    let wordIndex = -1;
    return parts.map((part, partIndex) => {
      const isWhitespace = part.trim().length === 0;
      if (!isWhitespace) {
        wordIndex += 1;
      }
      return {
        // Offset partIndex membuat kunci unik walau kata berulang.
        key: `${partIndex}-${part}`,
        text: part,
        wordIndex: isWhitespace ? -1 : wordIndex,
      };
    });
  }, [text]);

  return (
    <p className={className}>
      {tokens.map((token) => {
        if (token.wordIndex < 0) {
          return <span key={token.key}>{token.text}</span>;
        }
        const isActive = token.wordIndex === activeWordIndex;
        return (
          <span
            className={cn(
              "rounded-sm transition-colors",
              isActive && "bg-primary/25 ring-1 ring-primary/40"
            )}
            data-active={isActive || undefined}
            key={token.key}
          >
            {token.text}
          </span>
        );
      })}
    </p>
  );
}
