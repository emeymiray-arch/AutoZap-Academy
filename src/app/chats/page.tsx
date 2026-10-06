import { AppShell } from "@/components/layout/app-shell";
import { openChatAction } from "@/app/actions/social";
import { requireUser } from "@server/auth/session";
import { prisma } from "@server/db";
import { displayName, initials } from "@/lib/user";
import Link from "next/link";
import { Pin } from "lucide-react";

export const dynamic = "force-dynamic";

function PersonTile({
  person,
  existing,
  pinned,
}: {
  person: {
    id: string;
    name: string;
    nickname: string | null;
    avatarUrl: string | null;
    role: string;
  };
  existing?: { id: string; last?: string };
  pinned?: boolean;
}) {
  const tileClass = `az-tile az-glass flex aspect-square flex-col items-center justify-center gap-1.5 p-2 text-center ${
    pinned ? "az-glass-glow !border-[rgba(3,205,253,0.55)]" : ""
  }`;

  const avatar = person.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={person.avatarUrl}
      alt=""
      className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12"
    />
  ) : (
    <span className="az-brand-grad grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-white sm:h-12 sm:w-12">
      {initials(displayName(person))}
    </span>
  );

  const label = (
    <>
      <span className="line-clamp-2 w-full text-[0.65rem] font-semibold leading-tight text-white sm:text-xs">
        {displayName(person)}
      </span>
      {pinned ? (
        <span className="inline-flex items-center gap-0.5 text-[0.55rem] text-[var(--cyan)]">
          <Pin className="h-2.5 w-2.5" />
          Админ
        </span>
      ) : existing?.last ? (
        <span className="line-clamp-1 w-full text-[0.55rem] text-[var(--muted)]">{existing.last}</span>
      ) : (
        <span className="text-[0.55rem] text-[var(--muted)]">Написать</span>
      )}
    </>
  );

  if (existing) {
    return (
      <Link href={`/chats/${existing.id}`} className={tileClass}>
        {avatar}
        {label}
      </Link>
    );
  }

  return (
    <form action={openChatAction} className={tileClass}>
      <input type="hidden" name="userId" value={person.id} />
      <button type="submit" className="flex h-full w-full flex-col items-center justify-center gap-1.5">
        {avatar}
        {label}
      </button>
    </form>
  );
}

export default async function ChatsPage() {
  const me = await requireUser();

  const threads = await prisma.chatThread.findMany({
    where: { participants: { some: { userId: me.id } } },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, nickname: true, avatarUrl: true, role: true },
          },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const threadByUser = new Map<string, { id: string; last?: string }>();
  for (const t of threads) {
    const other = t.participants.map((p) => p.user).find((u) => u.id !== me.id);
    if (!other) continue;
    threadByUser.set(other.id, { id: t.id, last: t.messages[0]?.body });
  }

  const people = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      NOT: { about: { startsWith: "[ARCHIVED]" } },
    },
    select: { id: true, name: true, nickname: true, avatarUrl: true, role: true },
    orderBy: { name: "asc" },
  });

  const admins = people.filter((p) => p.role === "ADMIN");
  const others = people
    .filter((p) => p.role !== "ADMIN")
    .sort((a, b) => displayName(a).localeCompare(displayName(b), "ru"));

  // If current user is not admin and no admin in list, fetch explicitly
  let pinnedAdmins = admins;
  if (me.role !== "ADMIN" && pinnedAdmins.length === 0) {
    pinnedAdmins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, nickname: true, avatarUrl: true, role: true },
    });
  }

  return (
    <AppShell user={me} title="Чаты">
      {pinnedAdmins.length > 0 ? (
        <section className="mb-4">
          <p className="mb-2 flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--cyan)]">
            <Pin className="h-3 w-3" />
            Закреплено
          </p>
          <div className="grid max-w-[140px] grid-cols-1 gap-2 sm:max-w-[160px]">
            {pinnedAdmins.map((admin) => (
              <PersonTile
                key={admin.id}
                person={admin}
                existing={threadByUser.get(admin.id)}
                pinned
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
          Участники
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {others.map((p) => (
            <PersonTile key={p.id} person={p} existing={threadByUser.get(p.id)} />
          ))}
          {others.length === 0 ? (
            <p className="col-span-full text-sm text-[var(--muted)]">Других участников пока нет</p>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
