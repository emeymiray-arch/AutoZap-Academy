import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@server/db";
import { getStudentAzDashboard } from "@/app/actions/az";
import { formatAz } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const studentId = process.env.DEMO_STUDENT_ID ?? "student-demo-001";
  const user = await prisma.user.findUnique({ where: { id: studentId } });
  const { summary } = await getStudentAzDashboard(studentId);

  return (
    <AppShell
      eyebrow="Profile"
      title={user?.name ?? "Профиль"}
      subtitle="Публичные данные ученика. Чувствительная информация другим не показывается."
    >
      <div className="grid gap-10 border-y border-[var(--line-strong)] py-8 md:grid-cols-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Уровень
          </p>
          <p
            className="mt-2 text-3xl font-extrabold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {summary.level?.name ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            AZ
          </p>
          <p
            className="mt-2 text-3xl font-extrabold tabular-nums"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {formatAz(summary.balance)} / {formatAz(summary.maxAvailableAz)}
          </p>
        </div>
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Роль
          </p>
          <p
            className="mt-2 text-3xl font-extrabold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {user?.role ?? "STUDENT"}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
