"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { reviewAssignmentSubmissionAction } from "@/app/actions/learning";
import { cn } from "@/lib/utils";

const TIERS = [
  { label: "Слабо", az: 3 },
  { label: "Средне", az: 6 },
  { label: "Хорошо", az: 9 },
] as const;

type Props = {
  submissionId: string;
  currentAz: number | null;
  currentLabel: string | null;
  currentFeedback: string | null;
  minAz?: number;
  maxAz?: number;
};

export function ReviewSubmissionForm(props: Props) {
  const router = useRouter();
  const min = props.minAz ?? 3;
  const max = props.maxAz ?? 10;
  const [az, setAz] = useState(props.currentAz ?? 6);
  const [label, setLabel] = useState(props.currentLabel ?? "Средне");
  const [feedback, setFeedback] = useState(props.currentFeedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  function pickTier(t: (typeof TIERS)[number]) {
    setLabel(t.label);
    setAz(Math.min(max, Math.max(min, t.az)));
  }

  function handleSubmit() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      try {
        await reviewAssignmentSubmissionAction({
          submissionId: props.submissionId,
          awardedAz: az,
          qualityLabel: label,
          feedback: feedback.trim() || undefined,
        });
        setOk(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось сохранить оценку");
      }
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-4 md:p-5">
      <p className="text-sm font-black text-[var(--text)]">Оценка куратора</p>
      <div className="flex flex-wrap gap-2">
        {TIERS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => pickTier(t)}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-black",
              label === t.label
                ? "border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--text)]"
                : "border-[var(--line-strong)] text-[var(--muted)] hover:border-[var(--cyan)]/40",
            )}
          >
            {t.label} · ~{t.az} AZ
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
          Баллы AZ ({min}–{max})
        </span>
        <input
          type="number"
          min={min}
          max={max}
          value={az}
          onChange={(e) => setAz(Number(e.target.value))}
          className="mt-1 w-full max-w-[8rem] rounded-xl border border-[var(--line-strong)] bg-white px-3 py-2 text-sm font-black text-[var(--text)]"
        />
      </label>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
          Комментарий (необязательно)
        </span>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 py-2 text-sm font-bold text-[var(--text)]"
          placeholder="Что улучшить / что хорошо…"
        />
      </label>

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      {ok ? <p className="text-sm font-bold text-emerald-700">Оценка сохранена, AZ начислены.</p> : null}

      <button
        type="button"
        disabled={pending || az < min || az > max}
        onClick={handleSubmit}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--cyan)] px-4 py-2.5 text-sm font-black text-[#fff] disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {props.currentAz != null ? "Обновить оценку" : "Оценить и начислить AZ"}
      </button>
    </div>
  );
}
