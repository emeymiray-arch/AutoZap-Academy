import { formatAz } from "@/lib/utils";
import type { StudentAzSummary } from "@server/az/az-service";

export function AzProgressCard({ summary }: { summary: StudentAzSummary }) {
  return (
    <section className="relative overflow-hidden py-2">
      <div className="relative grid gap-8 md:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Баланс AZ
          </p>
          <p
            className="mt-3 text-5xl font-extrabold tracking-tight tabular-nums text-white sm:text-6xl"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {formatAz(summary.balance)}
            <span className="text-2xl font-semibold text-[var(--muted)]">
              {" "}
              / {formatAz(summary.maxAvailableAz)}
            </span>
          </p>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm text-[var(--muted)]">
              <span>До следующего уровня</span>
              <span className="font-medium text-white">
                {summary.nextLevel
                  ? `${formatAz(summary.nextLevel.azNeeded)} AZ → ${summary.nextLevel.name}`
                  : "Максимальный уровень"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="az-progress-fill h-full rounded-full"
                style={{ width: `${summary.progressToNextLevelPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end border-t border-white/10 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Уровень Академии
          </p>
          <p
            className="mt-2 text-4xl font-extrabold text-white"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {summary.level?.name ?? "—"}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Один общий уровень по всей программе.
          </p>
        </div>
      </div>
    </section>
  );
}
