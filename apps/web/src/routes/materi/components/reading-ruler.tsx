import { GripHorizontal } from "lucide-react";
import { useCallback } from "react";

/**
 * Reading Ruler overlay — garis bantu horizontal yang mengikuti baris aktif.
 *
 * Area pandu dibuat `pointer-events-none` agar tidak menghalangi membaca;
 * hanya "gagang" kecil di tepi kanan yang dapat diseret untuk mengatur posisi
 * secara manual (target sentuh ≥ 44px).
 */
export function ReadingRuler({
  isDragging,
  onStartDrag,
  y,
}: {
  isDragging: boolean;
  onStartDrag: (clientY: number) => void;
  y: number;
}) {
  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      onStartDrag(event.clientY);
    },
    [onStartDrag]
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-30"
      style={{ top: y - 20, height: 40 }}
    >
      <div className="h-full border-primary/60 border-y-2 bg-primary/5" />

      {/* Gagang seret — satu-satunya bagian yang menerima sentuhan. */}
      <button
        aria-label="Geser pemandu baris"
        className="pointer-events-auto absolute top-1/2 right-2 flex size-11 -translate-y-1/2 touch-none items-center justify-center rounded-full border border-primary/60 bg-background/90 text-primary shadow-sm backdrop-blur"
        onPointerDown={handlePointerDown}
        type="button"
      >
        <GripHorizontal aria-hidden="true" className="size-5" />
      </button>

      {isDragging ? (
        <span className="absolute right-2 -bottom-6 rounded bg-primary px-2 py-0.5 text-[0.65rem] text-primary-foreground">
          Lepas untuk lanjut otomatis
        </span>
      ) : null}
    </div>
  );
}
