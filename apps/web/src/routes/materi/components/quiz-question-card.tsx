import type { QuizQuestion } from "@mudahin/api/schemas";
import { Button } from "@mudahin/ui/components/button";
import { Card } from "@mudahin/ui/components/card";
import { cn } from "@mudahin/ui/lib/utils";
import { Check, Mic, MicOff, Volume2 } from "lucide-react";
import { useCallback } from "react";

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

/**
 * Satu soal pilihan ganda. Format menyesuaikan Focus Profile (FR-LEA-02):
 * - profil audio/low-vision → soal dibacakan lewat tombol TTS;
 * - input suara (FR-AUD-04) → tombol mikrofon menjawab dengan ucapan;
 * - tampilan minimal (tanpa dekorasi berlebih) untuk ADHD.
 */
export function QuizQuestionCard({
  index,
  isListening,
  onAnswer,
  onSpeak,
  onVoiceToggle,
  question,
  selectedIndex,
  speakEnabled,
  total,
  voiceEnabled,
  voiceTranscript,
}: {
  index: number;
  isListening: boolean;
  onAnswer: (optionIndex: number) => void;
  onSpeak?: () => void;
  onVoiceToggle?: () => void;
  question: QuizQuestion;
  selectedIndex: number | null;
  speakEnabled: boolean;
  total: number;
  voiceEnabled: boolean;
  voiceTranscript: string;
}) {
  const handleSpeak = useCallback(() => onSpeak?.(), [onSpeak]);
  const handleVoice = useCallback(() => onVoiceToggle?.(), [onVoiceToggle]);

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-muted-foreground text-xs">
            Soal {index + 1} dari {total}
          </span>
          <h2 className="font-semibold text-base leading-snug sm:text-lg">
            {question.question}
          </h2>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {speakEnabled && onSpeak ? (
            <Button
              aria-label="Bacakan soal ini"
              onClick={handleSpeak}
              size="icon"
              variant="outline"
            >
              <Volume2 aria-hidden="true" />
            </Button>
          ) : null}
          {voiceEnabled && onVoiceToggle ? (
            <Button
              aria-label={
                isListening
                  ? "Hentikan menjawab dengan suara"
                  : "Jawab dengan suara"
              }
              aria-pressed={isListening}
              onClick={handleVoice}
              size="icon"
              variant={isListening ? "default" : "outline"}
            >
              {isListening ? (
                <MicOff aria-hidden="true" />
              ) : (
                <Mic aria-hidden="true" />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {isListening ? (
        <p
          className="flex items-center gap-2 rounded-lg bg-primary/10 p-2 text-primary text-xs"
          role="status"
        >
          <span
            aria-hidden="true"
            className="size-2 animate-pulse rounded-full bg-primary"
          />
          Mendengarkan… {voiceTranscript || "sebutkan pilihan jawabanmu"}
        </p>
      ) : null}

      <fieldset
        aria-label={`Pilihan jawaban soal ${index + 1}`}
        className="flex flex-col gap-2"
      >
        {question.options.map((option, optionIndex) => (
          <QuizOption
            isSelected={selectedIndex === optionIndex}
            key={option}
            label={OPTION_LABELS[optionIndex] ?? "?"}
            onSelect={onAnswer}
            option={option}
            optionIndex={optionIndex}
            questionId={question.id}
          />
        ))}
      </fieldset>
    </Card>
  );
}

function QuizOption({
  isSelected,
  label,
  onSelect,
  option,
  optionIndex,
  questionId,
}: {
  isSelected: boolean;
  label: string;
  onSelect: (optionIndex: number) => void;
  option: string;
  optionIndex: number;
  questionId: string;
}) {
  const handleChange = useCallback(
    () => onSelect(optionIndex),
    [onSelect, optionIndex]
  );

  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border hover:bg-muted"
      )}
    >
      <input
        checked={isSelected}
        className="peer sr-only"
        name={questionId}
        onChange={handleChange}
        type="radio"
        value={optionIndex}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border font-medium text-xs",
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input"
        )}
      >
        {isSelected ? <Check className="size-4" /> : <span>{label}</span>}
      </span>
      <span className="peer-focus-visible:underline">{option}</span>
    </label>
  );
}
