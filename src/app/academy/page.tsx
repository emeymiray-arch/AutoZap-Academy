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
  const module1 = modules.find((m) => m.position === 1) ?? modules[0];
  const moduleMax = module1 ? await az.calculateModuleMaximum(module1.id) : null;

  const lessonIds = module1?.lessons.map((l) => l.id) ?? [];
  const progress =
    lessonIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: { userId: user.id, lessonId: { in: lessonIds } },
        })
      : [];
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));
  const completedCount = progress.filter((p) => p.status === "COMPLETED").length;

  const unlockMap = buildLessonUnlockMap(
    module1?.lessons ?? [],
    progress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId),
  );

  return (
    <AppShell user={user} title="Академия">
      {!course ? (
        <p className="text-base font-bold text-black">Курс ещё не создан. Запустите seed.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:mx-auto md:max-w-3xl md:grid-cols-1 md:gap-3">
          {modules.map((mod) => {
            const isPrimary = mod.id === module1?.id;

            if (!isPrimary) {
              return (
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
              );
            }

            return (
              <article
                key={mod.id}
                className="az-glass az-tile col-span-3 flex flex-col bg-white/80 p-3 md:col-span-1 md:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--cyan)] md:text-sm">
                      Открыт
                    </p>
                    <Link href={`/academy/${mod.slug}`} className="mt-0.5 flex items-baseline gap-2 md:gap-3">
                      <p
                        className="text-3xl font-black tabular-nums text-black md:text-4xl"
                        style={{ fontFamily: "var(--font-display), sans-serif" }}
                      >
                        {String(mod.position).padStart(2, "0")}
                      </p>
                      <h3 className="text-base font-black leading-snug text-black underline-offset-2 hover:underline md:text-xl">
                        {mod.title}
                      </h3>
                    </Link>
                    {mod.lessons.length > 0 ? (
                      <p className="mt-1 text-xs font-bold text-black/55 md:text-sm">
                        Прогресс: {completedCount}/{mod.lessons.length}
                      </p>
                    ) : null}
                  </div>
                  {moduleMax ? (
                    <span className="shrink-0 text-right text-xs font-extrabold text-black/80 md:text-sm">
                      до {formatAz(moduleMax.effective)} AZ
                    </span>
                  ) : null}
                </div>

                {mod.lessons.length > 0 ? (
                  <ol className="mt-3 max-h-52 space-y-1 overflow-y-auto border-t border-black/15 pt-3 md:mt-4 md:max-h-none md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-1.5 md:space-y-0 md:pt-4">
                    {mod.lessons.map((lesson) => {
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
                              href={`/academy/${mod.slug}/${lesson.slug}`}
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
                  href={`/academy/${mod.slug}`}
                  className="mt-3 inline-flex text-sm font-black text-[var(--cyan)] hover:underline md:mt-4"
                >
                  Открыть модуль →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
