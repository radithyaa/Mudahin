import type { Material } from "@mudahin/api/materials";
import { Card } from "@mudahin/ui/components/card";
import { Link } from "@tanstack/react-router";
import { BookOpen, Clock } from "lucide-react";

/** Kartu satu materi di Pustaka. */
export function MaterialCard({ material }: { material: Material }) {
  return (
    <Link
      className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
      params={{ materialId: material.id }}
      to="/materi/$materialId"
    >
      <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:bg-muted">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
            {material.subject}
          </span>
          <span>{material.gradeLevel}</span>
        </div>
        <h2 className="font-semibold text-lg">{material.title}</h2>
        <p className="flex-1 text-muted-foreground text-sm">
          {material.summary}
        </p>
        <div className="flex items-center gap-4 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3.5" />
            {material.readingMinutes} menit baca
          </span>
          <span className="flex items-center gap-1 text-primary">
            <BookOpen aria-hidden="true" className="size-3.5" />
            Buka materi
          </span>
        </div>
      </Card>
    </Link>
  );
}
