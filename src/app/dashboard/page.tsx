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
      title={`Добро пожаловать${user ? `, ${user.name}` : ""}`}
      subtitle="AZ — единая система оценки результатов и прогресса. Значения рассчитываются на backend."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <AzProgressCard summary={summary} />

        <section className="rounded-2xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-6">
          <h3 className="text-sm font-medium text-[var(--az-muted)]">Кратко</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-[var(--az-muted)]">Текущий AZ</span>
              <span className="tabular-nums">{formatAz(summary.balance)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--az-muted)]">Максимум доступно</span>
              <span className="tabular-nums">{formatAz(summary.maxAvailableAz)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--az-muted)]">Уровень</span>
              <span>{summary.level?.name ?? "—"}</span>
            </li>
          </ul>
          <Link
            href="/az-history"
            className="mt-6 inline-flex text-sm text-[var(--az-accent)] hover:underline"
          >
            Открыть историю AZ →
          </Link>
        </section>
      </div>

      <section className="mt-8">
        <h3 className="mb-4 text-lg font-medium">Последние операции AZ</h3>
        <div className="space-y-3">
          {history.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--az-border)] bg-[var(--az-surface)] px-4 py-3 text-sm"
            >
              <div className="flex justify-between gap-3">
                <span>{item.reason}</span>
                <span className="tabular-nums text-[var(--az-accent)]">
                  {item.awardedAz != null ? `${formatAz(item.awardedAz)} AZ` : `${item.delta} AZ`}
                </span>
              </div>
              {item.qualityLabel ? (
                <p className="mt-1 text-xs text-[var(--az-muted)]">Качество: {item.qualityLabel}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
