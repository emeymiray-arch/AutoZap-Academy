import { AppShell } from "@/components/layout/app-shell";
import { createAZService } from "@server/az/az-service";
import { prisma } from "@server/db";
import { requireUser } from "@server/auth/session";
import { formatAz } from "@/lib/utils";
import { displayName, initials } from "@/lib/user";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await requireUser();
  const az = createAZService(prisma);
  const ranking = await az.calculateFinalRanking();
  const finals = await prisma.finalStatusAssignment.findMany();
  const byUser = new Map(finals.map((f) => [f.userId, f]));

  const users = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, nickname: true, avatarUrl: true },
  });
  const meta = new Map(users.map((u) => [u.id, u]));

  // Admin never appears in ranking
  const rows = ranking.filter((row) => meta.has(row.userId));

  return (
    <AppShell
      user={user}
      title="Рейтинг"
    >
      <div className="w-full max-w-full overflow-x-auto">
        <table className="az-table w-full min-w-0 text-sm sm:min-w-[480px]">
          <thead>
            <tr>
              <th>Место</th>
              <th>Участник</th>
              <th>AZ</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const final = byUser.get(row.userId);
              const person = meta.get(row.userId);
              const isMe = row.userId === user.id;
              const label = person ? displayName(person) : row.name;
              return (
                <tr key={row.userId} className={isMe ? "bg-[rgba(3,205,253,0.08)]" : undefined}>
                  <td>
                    <span className="text-lg font-extrabold tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/participants/${row.userId}`}
                      className="flex items-center gap-2 hover:text-[var(--cyan)]"
                    >
                      {person?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={person.avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="az-brand-grad grid h-8 w-8 place-items-center rounded-full text-[0.6rem] font-bold text-white">
                          {initials(label)}
                        </span>
                      )}
                      <span className="text-sm font-medium">
                        {label}
                        {isMe ? <span className="ml-2 az-badge az-badge-info">вы</span> : null}
                      </span>
                    </Link>
                  </td>
                  <td className="tabular-nums text-sm font-semibold">{formatAz(row.totalAz)}</td>
                  <td className="text-xs text-[var(--muted)]">{final?.status ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
