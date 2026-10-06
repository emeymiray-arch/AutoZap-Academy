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
        <p className="text-[var(--muted)]">Курс ещё не создан. Запустите seed.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:mx-auto md:max-w-3xl md:grid-cols-1 md:gap-3">
          {course.modules.map((mod) => {
            const locked = mod.position > 1;

            if (locked) {
              return (
                <article
                  key={mod.id}
                  className="az-glass az-tile flex aspect-square flex-col items-center justify-center gap-1.5 p-2 text-center opacity-70 md:aspect-auto md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-left"
                >
                  <Lock className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden />
                  <p
                    className="text-lg font-extrabold tabular-nums text-white/80 md:text-xl"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {String(mod.position).padStart(2, "0")}
                  </p>
                  <p className="line-clamp-2 px-0.5 text-[0.6rem] leading-tight text-[var(--muted)] md:line-clamp-1 md:flex-1 md:px-0 md:text-sm">
                    {mod.title}
                  </p>
                </article>
              );
            }

            return (
              <article
                key={mod.id}
                className="az-glass az-tile col-span-3 flex flex-col p-3 md:col-span-1 md:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[var(--cyan)] md:text-xs">
                      Открыт
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-2 md:gap-3">
                      <p
                        className="text-2xl font-extrabold tabular-nums text-white md:text-3xl"
                        style={{ fontFamily: "var(--font-display), sans-serif" }}
                      >
                        {String(mod.position).padStart(2, "0")}
                      </p>
                      <h3 className="text-sm font-bold leading-snug text-white md:text-lg">
                        {mod.title}
                      </h3>
                    </div>
                  </div>
                  {moduleMax ? (
                    <span className="shrink-0 text-right text-[0.6rem] text-[var(--muted)] md:text-xs">
                      до {formatAz(moduleMax.effective)} AZ
                    </span>
                  ) : null}
                </div>

                {mod.lessons.length > 0 ? (
                  <ol className="mt-2 max-h-40 space-y-0.5 overflow-y-auto border-t border-white/10 pt-2 md:mt-3 md:max-h-none md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-1 md:space-y-0 md:pt-3">
                    {mod.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-baseline gap-1.5 py-0.5 text-[0.7rem] leading-snug md:py-1 md:text-sm"
                      >
                        <span className="shrink-0 font-mono text-[0.6rem] text-[var(--muted)] md:text-xs">
                          {String(lesson.position).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 text-white/85">{lesson.title}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-[0.7rem] text-[var(--muted)] md:text-sm">Уроки скоро</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
