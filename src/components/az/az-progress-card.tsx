import { formatAz } from "@/lib/utils";
import type { StudentAzSummary } from "@server/az/az-service";

export function AzProgressCard({ summary }: { summary: StudentAzSummary }) {
  return (
    <section className="relative overflow-hidden border-y border-[var(--line-strong)] bg-white/70 py-8">
      <div className="pointer-events-none absolute -right-8 top-0 h-full w-1/3 bg-[linear-gradient(120deg,transparent,rgba(3,205,253,0.16))]" />
      <div className="relative grid gap-8 md:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Баланс AZ
          </p>
          <p
            className="mt-3 text-5xl font-extrabold tracking-tight tabular-nums text-[var(--ink)] sm:text-6xl"
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
              <span className="font-medium text-[var(--ink)]">
                {summary.nextLevel
                  ? `${formatAz(summary.nextLevel.azNeeded)} AZ → ${summary.nextLevel.name}`
                  : "Максимальный уровень"}
              </span>
            </div>
            <div className="h-[4px] overflow-hidden bg-[var(--line)]">
              <div
                className="az-progress-fill h-full"
                style={{ width: `${summary.progressToNextLevelPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end border-t border-[var(--line)] pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Уровень Академии
          </p>
          <p
            className="mt-2 text-4xl font-extrabold text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {summary.level?.name ?? "—"}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Один общий уровень по всей программе. Не привязан к модулю.
          </p>
        </div>
      </div>
    </section>
  );
}
