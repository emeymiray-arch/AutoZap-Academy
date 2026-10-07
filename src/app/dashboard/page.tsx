import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AzSpeedStats } from "@/components/az/az-speed-stats";
import { MedalEmptySlot, MedalTierBlock, type MedalTier } from "@/components/az/rank-medal";
import { NewsComposeForm } from "@/components/news/news-compose-form";
import { deleteNewsAction } from "@/app/actions/social";
import { loadStudentAzDashboard } from "@server/az/queries";
import { requireUser } from "@server/auth/session";
import { prisma } from "@server/db";
import { createAZService } from "@server/az/az-service";
import { formatAz } from "@/lib/utils";
import { displayName, initials } from "@/lib/user";
import { Award, BookOpen, Newspaper, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

async function getNextLesson(userId: string) {
  const course = await prisma.course.findFirst({
    include: {
      modules: {
        orderBy: { position: "asc" },
        include: { lessons: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!course) return null;

  const done = await prisma.azLedgerEntry.findMany({
    where: { userId, actionType: "LESSON_COMPLETED", kind: { in: ["INITIAL", "REPEAT"] } },
    select: { sourceId: true },
  });
  const doneIds = new Set(done.map((d) => d.sourceId));

  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (!doneIds.has(lesson.id)) {
        return {
          moduleTitle: mod.title,
          modulePosition: mod.position,
          lessonTitle: lesson.title,
          lessonPosition: lesson.position,
          status: lesson.status,
        };
      }
    }
  }

  const lastMod = course.modules[course.modules.length - 1];
  const lastLesson = lastMod?.lessons[lastMod.lessons.length - 1];
  if (!lastLesson) return null;
  return {
    moduleTitle: lastMod.title,
    modulePosition: lastMod.position,
    lessonTitle: lastLesson.title,
    lessonPosition: lastLesson.position,
    status: "DONE" as const,
  };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [ranking, activityPosts, nextLesson, studentData, news] = await Promise.all([
    createAZService(prisma).calculateFinalRanking(),
    prisma.activityPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        author: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
      },
    }),
    isAdmin ? Promise.resolve(null) : getNextLesson(user.id),
    isAdmin ? Promise.resolve(null) : loadStudentAzDashboard(user.id),
    prisma.newsPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { name: true, nickname: true } } },
    }),
  ]);

  const summary = studentData?.summary;

  return (
    <AppShell user={user} title={`Привет, ${displayName(user)}`}>
      {!isAdmin && summary ? (
        <AzSpeedStats
          balance={summary.balance}
          maxAvailableAz={summary.maxAvailableAz}
          levelName={summary.level?.name ?? "—"}
          progressPercent={summary.progressToNextLevelPercent}
        />
      ) : null}

      <section className="mb-4 border-b border-white/10 pb-4 md:mb-6 md:max-w-3xl md:pb-5">
        <div className="mb-2 flex items-center justify-between md:mb-3">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)] md:text-sm">
            <Newspaper className="h-3.5 w-3.5 text-[var(--cyan)] md:h-4 md:w-4" />
            Новости
          </h3>
          <Link href="/news" className="text-[0.65rem] text-[var(--cyan)] md:text-xs">
            все →
          </Link>
        </div>
        {isAdmin ? (
          <div className="mb-2 flex flex-wrap items-center gap-3 md:mb-3">
            <NewsComposeForm />
            <Link href="/admin/participants" className="text-[0.65rem] text-[var(--cyan)] md:text-xs">
              Участники →
            </Link>
          </div>
        ) : null}
        <ul className="divide-y divide-white/10">
          {news.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 md:py-3">
              <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)] md:text-base">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80 md:text-sm">
                  {item.body}
                </p>
              </div>
              {isAdmin ? (
                <form action={deleteNewsAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-[0.65rem] text-[var(--muted)] hover:text-rose-300 md:text-xs"
                  >
                    удалить
                  </button>
                </form>
              ) : null}
            </li>
          ))}
          {news.length === 0 ? (
            <li className="py-2 text-xs text-[var(--muted)] md:text-sm">Новостей пока нет</li>
          ) : null}
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-3 md:gap-6 md:max-w-5xl">
        <section className="md:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)] md:text-base">
              <Award className="h-4 w-4 text-[var(--cyan)] md:h-5 md:w-5" />
              Рейтинг
            </h3>
            <Link href="/leaderboard" className="text-sm font-medium text-[var(--cyan)]">
              все →
            </Link>
          </div>
          <div className="space-y-3">
            {(
              [
                { tier: "gold" as MedalTier, start: 1 },
                { tier: "silver" as MedalTier, start: 4 },
                { tier: "bronze" as MedalTier, start: 7 },
              ] as const
            ).map(({ tier, start }) => (
              <MedalTierBlock key={tier} tier={tier}>
                {[0, 1, 2].map((offset) => {
                  const place = start + offset;
                  const row = ranking[place - 1];
                  if (!row) return <MedalEmptySlot key={place} index={place} />;
                  const isMe = row.userId === user.id;
                  return (
                    <li key={row.userId}>
                      <Link
                        href={`/participants/${row.userId}`}
                        className={`flex items-center gap-2 rounded-xl bg-white/70 px-2.5 py-2.5 text-black ${
                          isMe ? "ring-2 ring-black/40" : ""
                        }`}
                      >
                        <span className="w-5 text-sm font-black tabular-nums text-black md:text-base">
                          {place}.
                        </span>
                        <span className="az-brand-grad grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black text-white">
                          {initials(row.name)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-black text-black md:text-base">
                          {row.name}
                        </span>
                        <span className="shrink-0 text-sm font-black tabular-nums text-black md:text-base">
                          {formatAz(row.totalAz)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </MedalTierBlock>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)] md:text-base">
              <Sparkles className="h-4 w-4 text-[var(--cyan)] md:h-5 md:w-5" />
              Активность
            </h3>
            <Link href="/activity" className="text-sm font-medium text-[var(--cyan)]">
              все →
            </Link>
          </div>
          <ul className="divide-y divide-white/10">
            {activityPosts.map((post) => (
              <li key={post.id} className="py-2.5 md:py-3">
                <p className="text-sm font-semibold text-[var(--cyan)] md:text-base">
                  {displayName(post.author)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-snug text-[var(--ink)] md:text-base">
                  {post.body}
                </p>
              </li>
            ))}
            {activityPosts.length === 0 ? (
              <li className="py-3 text-sm text-[var(--ink-soft)] md:text-base">Пока пусто</li>
            ) : null}
          </ul>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)] md:text-base">
              <BookOpen className="h-4 w-4 text-[var(--cyan)] md:h-5 md:w-5" />
              Следующий урок
            </h3>
            <Link href="/academy" className="text-sm font-medium text-[var(--cyan)]">
              академия →
            </Link>
          </div>
          {!isAdmin && nextLesson ? (
            <Link href="/academy" className="block py-1">
              {nextLesson.status === "DONE" ? (
                <p className="text-sm text-emerald-300 md:text-base">Все уроки пройдены</p>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)] md:text-sm">
                    Модуль {nextLesson.modulePosition}.
                  </p>
                  <p className="mt-1 text-base font-bold text-[var(--ink)] md:text-lg">
                    {nextLesson.lessonPosition}. {nextLesson.lessonTitle}
                  </p>
                </>
              )}
            </Link>
          ) : !isAdmin ? (
            <p className="text-sm text-[var(--ink-soft)] md:text-base">Курс ещё не настроен</p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
