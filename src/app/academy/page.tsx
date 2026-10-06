import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@server/db";
import { createAZService } from "@server/az/az-service";
import { getPublicRewardPreview } from "@/app/actions/az";
import { requireUser } from "@server/auth/session";
import { formatAz } from "@/lib/utils";

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

  const assignmentPreview = module1
    ? await getPublicRewardPreview({
        actionType: "ASSIGNMENT_REVIEWED",
        courseId: course!.id,
        moduleId: module1.id,
      })
    : null;

  return (
    <AppShell
      user={user}
      title="Академия"
      subtitle="18 модулей. Контент добавляет команда AutoZap. Правила AZ видны до выполнения."
    >
      {!course ? (
        <p className="text-[var(--muted)]">Курс ещё не создан. Запустите seed.</p>
      ) : (
        <div className="space-y-4">
          {course.modules.map((mod) => (
            <article key={mod.id} className="az-glass-strong p-5">
              <div className="grid gap-5 md:grid-cols-[100px_1fr]">
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Модуль
                  </p>
                  <p
                    className="mt-1 text-4xl font-extrabold text-[var(--ink)]"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {String(mod.position).padStart(2, "0")}
                  </p>
                  <span className="az-badge az-badge-info mt-3">{mod.status}</span>
                </div>

                <div>
                  <h3
                    className="text-xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {mod.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{mod.description}</p>

                  {mod.position === 1 && moduleMax ? (
                    <p className="mt-3 text-sm">
                      Максимум AZ модуля:{" "}
                      <strong className="text-[var(--accent-deep)]">
                        {formatAz(moduleMax.effective)}
                      </strong>
                    </p>
                  ) : null}

                  {mod.lessons.length > 0 ? (
                    <ol className="mt-4 divide-y divide-[rgba(3,96,253,0.08)]">
                      {mod.lessons.map((lesson) => (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 py-2.5 text-sm"
                        >
                          <span>
                            <span className="mr-2 font-mono text-xs text-[var(--muted)]">
                              {String(lesson.position).padStart(2, "0")}
                            </span>
                            {lesson.title}
                          </span>
                          <span className="az-badge az-badge-muted">скоро</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-4 text-sm text-[var(--muted)]">Структура-заглушка</p>
                  )}

                  {mod.position === 1 && assignmentPreview ? (
                    <div className="mt-4 rounded-2xl bg-[rgba(3,96,253,0.06)] p-4 text-sm">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--accent-deep)]">
                        Правила AZ · практика
                      </p>
                      <p className="mt-2">
                        Максимум {assignmentPreview.maxAz} AZ · частичное:{" "}
                        {assignmentPreview.allowsPartial ? "да" : "нет"}
                      </p>
                      {assignmentPreview.qualityRanges.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-[var(--muted)]">
                          {assignmentPreview.qualityRanges.map((r) => (
                            <li key={r.id}>
                              <span className="font-medium text-[var(--ink)]">{r.label}</span>:{" "}
                              {r.minAz}–{r.maxAz} AZ
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
