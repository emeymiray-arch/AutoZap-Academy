import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@server/db";
import { createAZService } from "@server/az/az-service";
import { requireUser } from "@server/auth/session";
import { formatAz, cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";
import { buildLessonUnlockMap } from "@/lib/lesson-unlock";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const user = await requireUser();

  const course = await prisma.course.findFirst({
    include: {
      modules: {
        where: { status: "PUBLISHED" },
        orderBy: { position: "asc" },
        include: {
          lessons: { where: { status: "PUBLISHED" }, orderBy: { position: "asc" } },
          assignments: true,
        },
      },
    },
  });

  const az = createAZService(prisma);
  const modules = course?.modules ?? [];

  const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const progress =
    allLessonIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: { userId: user.id, lessonId: { in: allLessonIds } },
        })
      : [];
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));
  const completedLessonIds = new Set(
    progress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId),
  );

  const moduleDone = (mod: (typeof modules)[number]) =>
    mod.lessons.length > 0 && mod.lessons.every((l) => completedLessonIds.has(l.id));

  // First incomplete module is the featured block; completed ones sink below with a check.
  const activeModule = modules.find((m) => !moduleDone(m)) ?? modules[modules.length - 1] ?? null;
  const completedModules = modules.filter((m) => moduleDone(m) && m.id !== activeModule?.id);
  const upcomingModules = modules.filter(
    (m) => !moduleDone(m) && m.id !== activeModule?.id,
  );

  const moduleMax = activeModule ? await az.calculateModuleMaximum(activeModule.id) : null;
  const completedCount = activeModule
    ? activeModule.lessons.filter((l) => completedLessonIds.has(l.id)).length
    : 0;
  const unlockMap = buildLessonUnlockMap(activeModule?.lessons ?? [], completedLessonIds);
  const allDone = Boolean(activeModule && moduleDone(activeModule) && upcomingModules.length === 0);

  return (
    <AppShell user={user} title="Академия">
      {!course ? (
        <p className="text-base font-bold text-black">Курс ещё не создан. Запустите seed.</p>
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 md:gap-4">
          {activeModule ? (
            <article className="az-glass az-tile flex flex-col bg-white/80 p-3 md:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--cyan)] md:text-sm">
                    {allDone ? "Пройден" : "Открыт"}
                  </p>
                  <Link
                    href={`/academy/${activeModule.slug}`}
                    className="mt-0.5 flex items-baseline gap-2 md:gap-3"
                  >
                    <p
                      className="text-3xl font-black tabular-nums text-black md:text-4xl"
                      style={{ fontFamily: "var(--font-display), sans-serif" }}
                    >
                      {String(activeModule.position).padStart(2, "0")}
                    </p>
                    <h3 className="text-base font-black leading-snug text-black underline-offset-2 hover:underline md:text-xl">
                      {activeModule.title}
                    </h3>
                  </Link>
                  {activeModule.lessons.length > 0 ? (
                    <p className="mt-1 text-xs font-bold text-black/55 md:text-sm">
                      Прогресс: {completedCount}/{activeModule.lessons.length}
                    </p>
                  ) : null}
                </div>
                {moduleMax ? (
                  <span className="shrink-0 text-right text-xs font-extrabold text-black/80 md:text-sm">
                    до {formatAz(moduleMax.effective)} AZ
                  </span>
                ) : null}
              </div>

              {activeModule.lessons.length > 0 ? (
                <ol className="mt-3 max-h-52 space-y-1 overflow-y-auto border-t border-black/15 pt-3 md:mt-4 md:max-h-none md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-1.5 md:space-y-0 md:pt-4">
                  {activeModule.lessons.map((lesson) => {
                    const p = progressByLesson.get(lesson.id);
                    const completed = p?.status === "COMPLETED";
                    const inProgress = p?.status === "IN_PROGRESS";
                    const unlocked = unlockMap.get(lesson.id) ?? lesson.position === 1;
                    const row = (
                      <>
                        <span
                          className={cn(
                            "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                            completed && "bg-emerald-500",
                            inProgress && !completed && "bg-[var(--cyan)]",
                            !completed && !inProgress && unlocked && "bg-black/20",
                            !unlocked && "bg-black/10",
                          )}
                          aria-hidden
                        />
                        <span className="shrink-0 font-mono text-sm font-black tabular-nums text-black md:text-base">
                          {String(lesson.position).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 font-extrabold text-black">{lesson.title}</span>
                        {completed ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : null}
                        {!unlocked ? <Lock className="h-3 w-3 shrink-0 text-black/35" /> : null}
                      </>
                    );
                    return (
                      <li key={lesson.id}>
                        {unlocked ? (
                          <Link
                            href={`/academy/${activeModule.slug}/${lesson.slug}`}
                            className="flex items-baseline gap-2 py-1 text-sm leading-snug hover:opacity-80 md:py-1.5 md:text-base"
                          >
                            {row}
                          </Link>
                        ) : (
                          <div className="flex items-baseline gap-2 py-1 text-sm leading-snug opacity-55 md:py-1.5 md:text-base">
                            {row}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-3 text-sm font-bold text-black/70 md:text-base">Уроки скоро</p>
              )}

              <Link
                href={`/academy/${activeModule.slug}`}
                className="mt-3 inline-flex text-sm font-black text-[var(--cyan)] hover:underline md:mt-4"
              >
                Открыть модуль →
              </Link>
            </article>
          ) : null}

          {upcomingModules.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-3">
              {upcomingModules.map((mod) => (
                <Link
                  key={mod.id}
                  href={`/academy/${mod.slug}`}
                  className="az-glass az-tile flex aspect-square flex-col items-center justify-center gap-1.5 bg-white/75 p-2 text-center md:aspect-auto md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-left"
                >
                  <p
                    className="text-xl font-black tabular-nums text-black md:text-2xl"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {String(mod.position).padStart(2, "0")}
                  </p>
                  <p className="line-clamp-2 px-0.5 text-xs font-extrabold leading-snug text-black md:line-clamp-1 md:flex-1 md:px-0 md:text-base">
                    {mod.title}
                  </p>
                </Link>
              ))}
            </div>
          ) : null}

          {completedModules.length > 0 ? (
            <div className="space-y-2">
              <p className="px-0.5 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                Пройдено
              </p>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-3">
                {completedModules.map((mod) => (
                  <Link
                    key={mod.id}
                    href={`/academy/${mod.slug}`}
                    className="az-glass az-tile relative flex aspect-square flex-col items-center justify-center gap-1.5 border-emerald-200/80 bg-emerald-50/70 p-2 text-center md:aspect-auto md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-left"
                  >
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white md:static md:mr-0">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <p
                      className="text-xl font-black tabular-nums text-emerald-900 md:text-2xl"
                      style={{ fontFamily: "var(--font-display), sans-serif" }}
                    >
                      {String(mod.position).padStart(2, "0")}
                    </p>
                    <p className="line-clamp-2 px-0.5 text-xs font-extrabold leading-snug text-emerald-950 md:line-clamp-1 md:flex-1 md:px-0 md:text-base">
                      {mod.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
