import type { MindMap } from "@mudahin/api/schemas";
import { Card } from "@mudahin/ui/components/card";
import { cn } from "@mudahin/ui/lib/utils";
import { GitBranch, Sparkles } from "lucide-react";

/**
 * Peta pikiran (FR-AI-04) — visualisasi Ringkasan AI sebagai diagram
 * topik → cabang → anak ide.
 *
 * Digambar dengan layout bertingkat + garis penghubung CSS (bukan library graf)
 * agar ringan di ponsel dan tetap terbaca screen reader sebagai daftar bersarang.
 */
export function MindMapView({ mindMap }: { mindMap: MindMap }) {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2 font-medium text-sm">
        <GitBranch aria-hidden="true" className="size-4 text-primary" />
        Peta Pikiran
      </div>

      {/* Root node */}
      <div className="flex justify-center">
        <span className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm shadow-sm">
          <Sparkles aria-hidden="true" className="size-4" />
          {mindMap.root}
        </span>
      </div>

      {/* Branches */}
      <ul className="flex flex-col gap-3">
        {mindMap.branches.map((branch) => (
          <li className="flex flex-col gap-2" key={branch.id}>
            <span className="flex items-center gap-2 self-start rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 font-medium text-sm">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-primary"
              />
              {branch.label}
            </span>

            {branch.leaves.length > 0 ? (
              <ul
                className={cn(
                  "ml-4 flex flex-col gap-1.5 border-primary/30 border-l-2 pl-4"
                )}
              >
                {branch.leaves.map((leaf) => (
                  <li
                    className="relative flex items-center text-muted-foreground text-sm before:absolute before:top-1/2 before:-left-4 before:h-px before:w-3 before:bg-primary/30"
                    key={leaf.id}
                  >
                    {leaf.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
