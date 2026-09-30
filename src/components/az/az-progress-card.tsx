import { formatAz } from "@/lib/utils";
import type { StudentAzSummary } from "@server/az/az-service";

export function AzProgressCard({ summary }: { summary: StudentAzSummary }) {
  return (
    <section className="rounded-2xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--az-muted)]">AZ</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {formatAz(summary.balance)}
            <span className="text-lg font-normal text-[var(--az-muted)]">
              {" "}
              / {formatAz(summary.maxAvailableAz)}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--az-muted)]">Level</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--az-accent)]">
            {summary.level?.name ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm text-[var(--az-muted)]">
          <span>До следующего уровня</span>
          <span>
            {summary.nextLevel
              ? `${formatAz(summary.nextLevel.azNeeded)} AZ → ${summary.nextLevel.name}`
              : "Максимальный уровень"}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--az-surface)]">
          <div
            className="h-full rounded-full bg-[var(--az-accent)] transition-all"
            style={{ width: `${summary.progressToNextLevelPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
