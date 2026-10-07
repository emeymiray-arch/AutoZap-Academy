import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@server/db";
import { createAZService } from "@server/az/az-service";
import { requireUser } from "@server/auth/session";
import { formatAz } from "@/lib/utils";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const user = await requireUser();

  const course = await prisma.course.findFirst({
    include: {
      modules: {
        orderBy: { position: "asc" },
        include: { lessons: { orderBy: { position: "asc" } }, assignments: true },
      },
    },
  });

  const az = createAZService(prisma);
  const module1 = course?.modules[0];
  const moduleMax = module1 ? await az.calculateModuleMaximum(module1.id) : null;

  return (
    <AppShell user={user} title="Академия">
      {!course ? (
        <p className="text-base font-bold text-black">Курс ещё не создан. Запустите seed.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:mx-auto md:max-w-3xl md:grid-cols-1 md:gap-3">
          {course.modules.map((mod) => {
            const locked = mod.position > 1;

            if (locked) {
              return (
                <article
                  key={mod.id}
                  className="az-glass az-tile flex aspect-square flex-col items-center justify-center gap-1.5 bg-white/75 p-2 text-center opacity-90 md:aspect-auto md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-left"
                >
                  <Lock className="h-4 w-4 shrink-0 text-black/70" aria-hidden />
                  <p
                    className="text-xl font-black tabular-nums text-black md:text-2xl"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {String(mod.position).padStart(2, "0")}
                  </p>
                  <p className="line-clamp-2 px-0.5 text-xs font-extrabold leading-snug text-black md:line-clamp-1 md:flex-1 md:px-0 md:text-base">
                    {mod.title}
                  </p>
                </article>
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
                    <div className="mt-0.5 flex items-baseline gap-2 md:gap-3">
                      <p
                        className="text-3xl font-black tabular-nums text-black md:text-4xl"
                        style={{ fontFamily: "var(--font-display), sans-serif" }}
                      >
                        {String(mod.position).padStart(2, "0")}
                      </p>
                      <h3 className="text-base font-black leading-snug text-black md:text-xl">
                        {mod.title}
                      </h3>
                    </div>
                  </div>
                  {moduleMax ? (
                    <span className="shrink-0 text-right text-xs font-extrabold text-black/80 md:text-sm">
                      до {formatAz(moduleMax.effective)} AZ
                    </span>
                  ) : null}
                </div>

                {mod.lessons.length > 0 ? (
                  <ol className="mt-3 max-h-52 space-y-1 overflow-y-auto border-t border-black/15 pt-3 md:mt-4 md:max-h-none md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-1.5 md:space-y-0 md:pt-4">
                    {mod.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-baseline gap-2 py-1 text-sm leading-snug md:py-1.5 md:text-base"
                      >
                        <span className="shrink-0 font-mono text-sm font-black tabular-nums text-black md:text-base">
                          {String(lesson.position).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 font-extrabold text-black">{lesson.title}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm font-bold text-black/70 md:text-base">Уроки скоро</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
