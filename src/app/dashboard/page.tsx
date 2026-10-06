import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AzProgressCard } from "@/components/az/az-progress-card";
import { getStudentAzDashboard } from "@/app/actions/az";
import { requireUser } from "@server/auth/session";
import { formatAz } from "@/lib/utils";
import { Award, BookOpen, TrendingUp, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const { summary, history } = await getStudentAzDashboard(user.id);

  return (
    <AppShell
      user={user}
      title={`Привет, ${user.name}`}
      subtitle="Ваш прогресс в AutoZap Academy. AZ и уровень считаются на backend."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "AZ баланс",
            value: formatAz(summary.balance),
            hint: `из ${formatAz(summary.maxAvailableAz)}`,
            icon: TrendingUp,
          },
          {
            label: "Уровень",
            value: summary.level?.name ?? "—",
            hint: summary.nextLevel ? `до ${summary.nextLevel.name}` : "макс.",
            icon: Award,
          },
          {
            label: "До следующего",
            value: summary.nextLevel ? `${formatAz(summary.nextLevel.azNeeded)}` : "0",
            hint: "AZ",
            icon: Trophy,
          },
          {
            label: "Прогресс",
            value: `${summary.progressToNextLevelPercent}%`,
            hint: "к уровню",
            icon: BookOpen,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="az-glass-strong p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="az-kpi-icon">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="az-badge az-badge-ok">live</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {kpi.label}
              </p>
              <p
                className="mt-1 text-2xl font-extrabold tabular-nums"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {kpi.value}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{kpi.hint}</p>
            </div>
          );
        })}
      </div>

      <AzProgressCard summary={summary} />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="az-glass-strong p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h3
              className="text-lg font-bold"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Последние AZ
            </h3>
            <Link href="/az-history" className="text-sm font-semibold text-[var(--accent-deep)]">
              Вся история →
            </Link>
          </div>
          <ul className="divide-y divide-[rgba(3,96,253,0.08)]">
            {history.slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{item.reason}</p>
                  {item.qualityLabel ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">Качество · {item.qualityLabel}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm font-extrabold tabular-nums text-[var(--accent-deep)]">
                  {item.awardedAz != null ? `${formatAz(item.awardedAz)} AZ` : `${item.delta} AZ`}
                </span>
              </li>
            ))}
            {history.length === 0 ? (
              <li className="py-6 text-sm text-[var(--muted)]">Пока нет начислений.</li>
            ) : null}
          </ul>
        </section>

        <section className="az-glass-strong p-5">
          <h3
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Быстрые действия
          </h3>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/academy" className="az-btn az-btn-accent">
              Продолжить обучение
            </Link>
            <Link href="/leaderboard" className="az-btn az-btn-ghost">
              Открыть рейтинг
            </Link>
            <Link href="/profile" className="az-btn az-btn-ghost">
              Мой профиль
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
