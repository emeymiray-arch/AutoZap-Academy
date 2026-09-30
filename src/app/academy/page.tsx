import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@server/db";
import { createAZService } from "@server/az/az-service";
import { getPublicRewardPreview } from "@/app/actions/az";
import { formatAz } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
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
      title="Академия"
      subtitle="18 модулей. Контент будет добавлен командой AutoZap. Правила AZ видны до выполнения."
    >
      {!course ? (
        <p className="text-[var(--az-muted)]">Курс ещё не создан. Запустите seed.</p>
      ) : (
        <div className="space-y-6">
          {course.modules.map((mod) => (
            <article
              key={mod.id}
              className="rounded-2xl border border-[var(--az-border)] bg-[var(--az-bg-elevated)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--az-muted)]">Модуль {mod.position}</p>
                  <h3 className="text-lg font-medium">{mod.title}</h3>
                  <p className="mt-1 text-sm text-[var(--az-muted)]">{mod.description}</p>
                </div>
                <span className="rounded-full border border-[var(--az-border)] px-3 py-1 text-xs text-[var(--az-muted)]">
                  {mod.status}
                </span>
              </div>

              {mod.position === 1 && moduleMax ? (
                <p className="mt-4 text-sm">
                  Максимум AZ модуля:{" "}
                  <strong className="text-[var(--az-accent)]">
                    {formatAz(moduleMax.effective)}
                  </strong>
                  {moduleMax.useOverride ? " (override Admin)" : ` (расчёт: ${moduleMax.calculated})`}
                </p>
              ) : null}

              {mod.lessons.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-[var(--az-border)] pt-4 text-sm">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex justify-between gap-3 text-[var(--az-muted)]">
                      <span>
                        Урок {lesson.position}. {lesson.title}
                      </span>
                      <span className="text-xs">placeholder</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--az-muted)]">Структура-заглушка</p>
              )}

              {mod.position === 1 && assignmentPreview ? (
                <div className="mt-4 rounded-xl bg-[var(--az-surface)] p-4 text-sm">
                  <p className="font-medium">Правила AZ — практическое задание</p>
                  <p className="mt-1 text-[var(--az-muted)]">
                    Максимум: {assignmentPreview.maxAz} AZ · частичное:{" "}
                    {assignmentPreview.allowsPartial ? "да" : "нет"}
                  </p>
                  {assignmentPreview.qualityRanges.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-[var(--az-muted)]">
                      {assignmentPreview.qualityRanges.map((r) => (
                        <li key={r.id}>
                          {r.label}: {r.minAz}–{r.maxAz} AZ
                          {r.criteria ? ` — ${r.criteria}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
