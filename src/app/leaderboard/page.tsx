import { AppShell } from "@/components/layout/app-shell";
import {
  MedalEmptySlot,
  MedalTierBlock,
  type MedalTier,
} from "@/components/az/rank-medal";
import { createAZService } from "@server/az/az-service";
import { prisma } from "@server/db";
import { requireUser } from "@server/auth/session";
import { formatAz } from "@/lib/utils";
import { displayName, initials } from "@/lib/user";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TIERS: { tier: MedalTier; start: number }[] = [
  { tier: "gold", start: 1 },
  { tier: "silver", start: 4 },
  { tier: "bronze", start: 7 },
];

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
    <AppShell user={user} title="Рейтинг">
      <div className="mx-auto grid w-full max-w-4xl gap-4 md:gap-5">
        {TIERS.map(({ tier, start }) => {
          const slots = [0, 1, 2].map((offset) => {
            const place = start + offset;
            const row = rows[place - 1];
            return { place, row };
          });

          return (
            <MedalTierBlock key={tier} tier={tier}>
              {slots.map(({ place, row }) => {
                if (!row) return <MedalEmptySlot key={place} index={place} />;

                const final = byUser.get(row.userId);
                const person = meta.get(row.userId);
                const isMe = row.userId === user.id;
                const label = person ? displayName(person) : row.name;

                return (
                  <li key={row.userId}>
                    <Link
                      href={`/participants/${row.userId}`}
                      className={`flex items-center gap-3 rounded-xl bg-white/70 px-3 py-3 text-black transition hover:bg-white/85 ${
                        isMe ? "ring-2 ring-black/40" : ""
                      }`}
                    >
                      <span className="w-7 shrink-0 text-lg font-black tabular-nums text-black md:text-xl">
                        {place}.
                      </span>
                      {person?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={person.avatarUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover md:h-11 md:w-11"
                        />
                      ) : (
                        <span className="az-brand-grad grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black text-white md:h-11 md:w-11">
                          {initials(label)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-base font-black text-black md:text-lg">
                        {label}
                        {isMe ? <span className="ml-1.5 font-bold text-black/70">· вы</span> : null}
                      </span>
                      <span className="shrink-0 text-base font-black tabular-nums text-black md:text-lg">
                        {formatAz(row.totalAz)} AZ
                      </span>
                      <span className="hidden shrink-0 text-sm font-extrabold text-black/80 sm:inline md:text-base">
                        {final?.status ?? "—"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </MedalTierBlock>
          );
        })}

        {rows.length > 9 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 md:p-4">
            <h3 className="mb-3 text-sm font-bold text-[var(--ink)] md:text-base">Остальные</h3>
            <ul className="divide-y divide-white/10">
              {rows.slice(9).map((row, idx) => {
                const place = 10 + idx;
                const person = meta.get(row.userId);
                const isMe = row.userId === user.id;
                const label = person ? displayName(person) : row.name;
                return (
                  <li key={row.userId}>
                    <Link
                      href={`/participants/${row.userId}`}
                      className={`flex items-center gap-3 py-2.5 text-[var(--ink)] md:py-3 ${
                        isMe ? "text-[var(--cyan)]" : ""
                      }`}
                    >
                      <span className="w-6 text-sm font-bold tabular-nums text-[var(--ink-soft)]">
                        {place}.
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold md:text-base">
                        {label}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-[var(--cyan)] md:text-base">
                        {formatAz(row.totalAz)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
