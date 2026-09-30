import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AzProgressCard } from "@/components/az/az-progress-card";
import { getStudentAzDashboard } from "@/app/actions/az";
import { prisma } from "@server/db";
import { formatAz } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const studentId = process.env.DEMO_STUDENT_ID ?? "student-demo-001";
  const user = await prisma.user.findUnique({ where: { id: studentId } });
  const { summary, history } = await getStudentAzDashboard(studentId);

  return (
    <AppShell
      eyebrow="Dashboard"
      title={user ? `${user.name}, продолжайте обучение` : "Добро пожаловать"}
      subtitle="AZ — единая метрика результата. Уровень, прогресс и рейтинг считаются на backend."
    >
      <AzProgressCard summary={summary} />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <h3
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Последние AZ
            </h3>
            <Link
              href="/az-history"
              className="text-sm font-semibold text-[var(--accent-deep)] hover:text-[var(--accent)]"
            >
              Вся история →
            </Link>
          </div>
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {history.slice(0, 4).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-medium text-[var(--ink)]">{item.reason}</p>
                  {item.qualityLabel ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      Качество · {item.qualityLabel}
                    </p>
                  ) : null}
                </div>
                <span
                  className="shrink-0 text-base font-extrabold tabular-nums text-[var(--ink)]"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  {item.awardedAz != null ? `${formatAz(item.awardedAz)} AZ` : `${item.delta} AZ`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-[var(--line-strong)] pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <h3
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Снимок
          </h3>
          <dl className="mt-6 space-y-5">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-[var(--muted)]">Текущий AZ</dt>
              <dd className="text-2xl font-extrabold tabular-nums">{formatAz(summary.balance)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-[var(--muted)]">Максимум доступно</dt>
              <dd className="text-2xl font-extrabold tabular-nums">
                {formatAz(summary.maxAvailableAz)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-[var(--muted)]">Уровень</dt>
              <dd className="text-2xl font-extrabold text-[var(--accent-deep)]">
                {summary.level?.name ?? "—"}
              </dd>
            </div>
          </dl>
          <Link href="/academy" className="az-btn az-btn-accent mt-8 w-full sm:w-auto">
            Продолжить в Академии
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
