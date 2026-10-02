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
      eyebrow="Program"
      title="Академия"
      subtitle="18 модулей. Контент добавляет команда AutoZap. Правила AZ видны до выполнения заданий."
    >
      {!course ? (
        <p className="text-[var(--muted)]">Курс ещё не создан. Запустите seed.</p>
      ) : (
        <div className="space-y-0">
          {course.modules.map((mod) => (
            <article
              key={mod.id}
              className="grid gap-6 border-t border-[var(--line-strong)] py-8 md:grid-cols-[140px_1fr]"
            >
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Модуль
                </p>
                <p
                  className="mt-1 text-4xl font-extrabold text-[var(--ink)]"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  {String(mod.position).padStart(2, "0")}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-deep)]">
                  {mod.status}
                </p>
              </div>

              <div>
                <h3
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  {mod.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                  {mod.description}
                </p>

                {mod.position === 1 && moduleMax ? (
                  <p className="mt-4 text-sm">
                    Максимум AZ модуля:{" "}
                    <strong className="text-[var(--accent-deep)]">
                      {formatAz(moduleMax.effective)}
                    </strong>
                    {moduleMax.useOverride
                      ? " · admin override"
                      : ` · расчёт ${moduleMax.calculated}`}
                  </p>
                ) : null}

                {mod.lessons.length > 0 ? (
                  <ol className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                    {mod.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-3 py-3 text-sm"
                      >
                        <span>
                          <span className="mr-3 font-mono text-xs text-[var(--muted)]">
                            {String(lesson.position).padStart(2, "0")}
                          </span>
                          {lesson.title}
                        </span>
                        <span className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                          скоро
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-6 text-sm text-[var(--muted)]">Структура-заглушка</p>
                )}

                {mod.position === 1 && assignmentPreview ? (
                  <div className="mt-6 overflow-hidden rounded-r-xl bg-white/70 py-4 pl-5 pr-4">
                    <div className="az-brand-bar mb-3 w-16" />
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--accent-deep)]">
                      Правила AZ · практика
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink)]">
                      Максимум {assignmentPreview.maxAz} AZ · частичное начисление:{" "}
                      {assignmentPreview.allowsPartial ? "да" : "нет"}
                    </p>
                    {assignmentPreview.qualityRanges.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                        {assignmentPreview.qualityRanges.map((r) => (
                          <li key={r.id}>
                            <span className="font-medium text-[var(--ink)]">{r.label}</span>:{" "}
                            {r.minAz}–{r.maxAz} AZ
                            {r.criteria ? ` — ${r.criteria}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
