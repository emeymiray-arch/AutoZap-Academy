"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";
import { setScopedRewardAzAction } from "@/app/actions/az";
import { cn } from "@/lib/utils";

type Props = {
  kind: "lesson" | "assignment";
  lessonId?: string;
  moduleId: string;
  moduleSlug: string;
  currentAz: number;
  min?: number;
  max?: number;
  className?: string;
};

export function AdminAzStepper({
  kind,
  lessonId,
  moduleId,
  moduleSlug,
  currentAz,
  min = 0,
  max = 50,
  className,
}: Props) {
  const [value, setValue] = useState(currentAz);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function commit(next: number) {
    const clamped = Math.min(max, Math.max(min, next));
    setValue(clamped);
    setError(null);
    startTransition(async () => {
      try {
        await setScopedRewardAzAction({
          kind,
          lessonId,
          moduleId,
          moduleSlug,
          maxAz: clamped,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
        setValue(currentAz);
      }
    });
  }

  return (
    <div
      className={cn("inline-flex flex-col items-end gap-0.5", className)}
      onClick={(e) => e.preventDefault()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--cyan)]/40 bg-white px-1 py-0.5 shadow-sm">
        <button
          type="button"
          aria-label="Меньше AZ"
          disabled={pending || value <= min}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            commit(value - 1);
          }}
          className="grid h-6 w-6 place-items-center rounded-full text-black/70 hover:bg-black/5 disabled:opacity-30"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-[2.5rem] text-center text-xs font-black tabular-nums text-[var(--cyan)]">
          {pending ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : `+${value}`}
        </span>
        <button
          type="button"
          aria-label="Больше AZ"
          disabled={pending || value >= max}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            commit(value + 1);
          }}
          className="grid h-6 w-6 place-items-center rounded-full text-black/70 hover:bg-black/5 disabled:opacity-30"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {error ? <span className="text-[10px] font-bold text-red-600">{error}</span> : null}
    </div>
  );
}
