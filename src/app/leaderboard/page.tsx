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
      eyebrow="Competition"
      title="Рейтинг"
      subtitle="Места по AZ. Tie-break только из настроек Admin. TOP_1/2/3 — финальный статус, не уровень."
    >
      <table className="az-table">
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
            return (
              <tr key={row.userId}>
                <td>
                  <span
                    className="text-xl font-extrabold tabular-nums"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {String(row.rank).padStart(2, "0")}
                  </span>
                </td>
                <td className="font-medium">{row.name}</td>
                <td className="tabular-nums font-semibold">{formatAz(row.totalAz)}</td>
                <td className="text-[var(--muted)]">{final?.status ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </AppShell>
  );
}
