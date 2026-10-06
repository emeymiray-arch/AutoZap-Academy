import { AppShell } from "@/components/layout/app-shell";
import { openChatAction } from "@/app/actions/social";
import { requireUser } from "@server/auth/session";
import { prisma } from "@server/db";
import { formatAz } from "@/lib/utils";
import { displayName, initials } from "@/lib/user";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ParticipantPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;

  const participant = await prisma.user.findUnique({
    where: { id },
    include: { azBalance: { include: { level: true } }, finalStatus: true },
  });
  if (!participant) notFound();
  if (participant.about?.startsWith("[ARCHIVED]")) notFound();

  const isAdminProfile = participant.role === "ADMIN";
  const isMe = participant.id === me.id;

  return (
    <AppShell
      user={me}
      title={displayName(participant)}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3 py-1">
        {participant.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={participant.avatarUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <span className="az-brand-grad grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-white">
            {initials(displayName(participant))}
          </span>
        )}
        <div>
          <p className="text-lg font-extrabold text-white">{displayName(participant)}</p>
          {participant.nickname ? (
            <p className="text-xs text-[var(--cyan)]">@{participant.nickname}</p>
          ) : null}
          {participant.about && !participant.about.startsWith("[ARCHIVED]") ? (
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">{participant.about}</p>
          ) : null}
        </div>
      </div>

      {!isAdminProfile ? (
        <div className="mb-3 grid grid-cols-3 gap-2 md:mb-5 md:flex md:max-w-xl md:gap-3">
          <div className="az-glass az-tile flex aspect-square flex-col items-center justify-center p-2 text-center md:aspect-auto md:flex-1 md:flex-row md:justify-between md:gap-3 md:px-4 md:py-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)] md:text-xs">
              AZ
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums md:mt-0 md:text-xl">
              {formatAz(participant.azBalance?.balance ?? 0)}
            </p>
          </div>
          <div className="az-glass az-tile flex aspect-square flex-col items-center justify-center p-2 text-center md:aspect-auto md:flex-1 md:flex-row md:justify-between md:gap-3 md:px-4 md:py-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)] md:text-xs">
              Уровень
            </p>
            <p className="mt-1 text-sm font-extrabold md:mt-0 md:text-lg">
              {participant.azBalance?.level?.name ?? "—"}
            </p>
          </div>
          <div className="az-glass az-tile flex aspect-square flex-col items-center justify-center p-2 text-center md:aspect-auto md:flex-1 md:flex-row md:justify-between md:gap-3 md:px-4 md:py-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)] md:text-xs">
              Рейтинг
            </p>
            <p className="mt-1 text-sm font-extrabold md:mt-0 md:text-base">
              {participant.finalStatus?.status ?? "участник"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!isMe ? (
          <form action={openChatAction}>
            <input type="hidden" name="userId" value={participant.id} />
            <button type="submit" className="az-btn az-btn-accent text-sm">
              Написать в чат
            </button>
          </form>
        ) : (
          <Link href="/profile" className="az-btn az-btn-ghost text-sm">
            Редактировать свой профиль
          </Link>
        )}
        <Link href="/leaderboard" className="az-btn az-btn-ghost text-sm">
          Рейтинг
        </Link>
      </div>
    </AppShell>
  );
}
