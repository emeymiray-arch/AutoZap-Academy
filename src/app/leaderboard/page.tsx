import { AppShell } from "@/components/layout/app-shell";
import { createAZService } from "@server/az/az-service";
import { prisma } from "@server/db";
import { formatAz } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const az = createAZService(prisma);
  const ranking = await az.calculateFinalRanking();
  const finals = await prisma.finalStatusAssignment.findMany();
  const byUser = new Map(finals.map((f) => [f.userId, f]));

  return (
    <AppShell
      title="Рейтинг"
      subtitle="Ранжирование по AZ. При равенстве используются только настроенные Admin tie-break критерии. TOP_1/2/3 — финальный статус, не уровень."
    >
      <div className="overflow-hidden rounded-2xl border border-[var(--az-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--az-surface)] text-[var(--az-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Место</th>
              <th className="px-4 py-3 font-medium">Ученик</th>
              <th className="px-4 py-3 font-medium">AZ</th>
              <th className="px-4 py-3 font-medium">Final Status</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row) => {
              const final = byUser.get(row.userId);
              return (
                <tr key={row.userId} className="border-t border-[var(--az-border)]">
                  <td className="px-4 py-3 tabular-nums">#{row.rank}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 tabular-nums">{formatAz(row.totalAz)}</td>
                  <td className="px-4 py-3 text-[var(--az-muted)]">{final?.status ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
