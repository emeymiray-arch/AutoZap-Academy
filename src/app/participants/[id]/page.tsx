import { AppShell } from "@/components/layout/app-shell";
import { getStudentAzDashboard } from "@/app/actions/az";
import { requireAdmin, initials } from "@server/auth/session";
import { prisma } from "@server/db";
import { formatAz } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ParticipantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  const participant = await prisma.user.findUnique({
    where: { id },
    include: { azBalance: { include: { level: true } }, finalStatus: true },
  });
  if (!participant || participant.role !== "STUDENT") notFound();

  const { summary, history } = await getStudentAzDashboard(participant.id);

  return (
    <AppShell
      user={admin}
      title={participant.name}
      subtitle={`Профиль участника · ${participant.email}`}
    >
      <div className="az-glass-strong mb-5 flex flex-wrap items-center gap-4 p-5">
        <span className="az-brand-grad grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-white">
          {initials(participant.name)}
        </span>
        <div>
          <p className="text-sm text-[var(--muted)]">Создан администратором</p>
          {participant.about ? (
            <p className="mt-1 max-w-2xl text-sm">{participant.about.replace(/^\[ARCHIVED\]\s*/, "")}</p>
          ) : (
            <p className="mt-1 text-sm text-[var(--muted)]">Описание пока не заполнено.</p>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="az-glass-strong p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">AZ</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums">
            {formatAz(summary.balance)} / {formatAz(summary.maxAvailableAz)}
          </p>
        </div>
        <div className="az-glass-strong p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Уровень</p>
          <p className="mt-2 text-3xl font-extrabold">{summary.level?.name ?? "—"}</p>
        </div>
        <div className="az-glass-strong p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Final status
          </p>
          <p className="mt-2 text-3xl font-extrabold">{participant.finalStatus?.status ?? "—"}</p>
        </div>
      </div>

      <section className="az-glass-strong p-5">
        <h3 className="mb-3 text-lg font-bold">История AZ</h3>
        <ul className="divide-y divide-[rgba(3,96,253,0.08)]">
          {history.slice(0, 10).map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
              <span>{item.reason}</span>
              <span className="font-bold tabular-nums text-[var(--accent-deep)]">
                {item.awardedAz != null ? `${formatAz(item.awardedAz)} AZ` : `${item.delta} AZ`}
              </span>
            </li>
          ))}
          {history.length === 0 ? (
            <li className="py-4 text-sm text-[var(--muted)]">Начислений ещё нет.</li>
          ) : null}
        </ul>
      </section>
    </AppShell>
  );
}
