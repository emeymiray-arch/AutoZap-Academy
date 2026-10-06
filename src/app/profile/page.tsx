import { AppShell } from "@/components/layout/app-shell";
import { getStudentAzDashboard } from "@/app/actions/az";
import { requireUser, initials } from "@server/auth/session";
import { formatAz } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const { summary } = await getStudentAzDashboard(user.id);

  return (
    <AppShell
      user={user}
      title="Мой профиль"
      subtitle="Личный кабинет участника. Чувствительные данные другим не показываются."
    >
      <div className="az-glass-strong mb-5 flex flex-wrap items-center gap-4 p-5">
        <span className="az-brand-grad grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-white">
          {initials(user.name)}
        </span>
        <div>
          <h2
            className="text-2xl font-extrabold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {user.name}
          </h2>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
          {user.about ? <p className="mt-2 max-w-xl text-sm">{user.about}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="az-glass-strong p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Уровень</p>
          <p
            className="mt-2 text-3xl font-extrabold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {summary.level?.name ?? "—"}
          </p>
        </div>
        <div className="az-glass-strong p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">AZ</p>
          <p
            className="mt-2 text-3xl font-extrabold tabular-nums"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {formatAz(summary.balance)}
            <span className="text-base font-semibold text-[var(--muted)]">
              {" "}
              / {formatAz(summary.maxAvailableAz)}
            </span>
          </p>
        </div>
        <div className="az-glass-strong p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Статус</p>
          <p
            className="mt-2 text-3xl font-extrabold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {user.role === "ADMIN" ? "Admin" : "Участник"}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
