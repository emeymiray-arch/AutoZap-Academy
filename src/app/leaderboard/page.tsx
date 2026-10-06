import { AppShell } from "@/components/layout/app-shell";
import { createAZService } from "@server/az/az-service";
import { prisma } from "@server/db";
import { requireUser, initials } from "@server/auth/session";
import { formatAz } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await requireUser();
  const az = createAZService(prisma);
  const ranking = await az.calculateFinalRanking();
  const finals = await prisma.finalStatusAssignment.findMany();
  const byUser = new Map(finals.map((f) => [f.userId, f]));

  return (
    <AppShell
      user={user}
      title="Рейтинг"
      subtitle="Места по AZ. Tie-break только из настроек Admin. TOP_1/2/3 — финальный статус."
    >
      <div className="az-glass-strong overflow-x-auto p-2 sm:p-4">
        <table className="az-table min-w-[520px]">
          <thead>
            <tr>
              <th>Место</th>
              <th>Ученик</th>
              <th>AZ</th>
              <th>Final Status</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row) => {
              const final = byUser.get(row.userId);
              const isMe = row.userId === user.id;
              return (
                <tr key={row.userId} className={isMe ? "bg-[rgba(3,96,253,0.06)]" : undefined}>
                  <td>
                    <span
                      className="text-xl font-extrabold tabular-nums"
                      style={{ fontFamily: "var(--font-display), sans-serif" }}
                    >
                      {String(row.rank).padStart(2, "0")}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="az-brand-grad grid h-8 w-8 place-items-center rounded-full text-[0.65rem] font-bold text-white">
                        {initials(row.name)}
                      </span>
                      <span className="font-medium">
                        {row.name}
                        {isMe ? (
                          <span className="ml-2 az-badge az-badge-info">вы</span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td className="tabular-nums font-semibold">{formatAz(row.totalAz)}</td>
                  <td className="text-[var(--muted)]">{final?.status ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
