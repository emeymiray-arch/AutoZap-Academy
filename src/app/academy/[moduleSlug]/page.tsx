import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, ChevronRight, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AdminAzStepper } from "@/components/learning/admin-az-stepper";
import { prisma } from "@server/db";
import { requireUser } from "@server/auth/session";
import { createAZService } from "@server/az/az-service";
import { buildLessonUnlockMap } from "@/lib/lesson-unlock";
import { cn, formatAz } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ moduleSlug: string }> };

export default async function ModuleHubPage({ params }: Props) {
  const user = await requireUser();
  const { moduleSlug } = await params;
  const isAdmin = user.role === "ADMIN";

  const mod = await prisma.module.findFirst({
    where: { slug: moduleSlug },
    include: {
      lessons: { where: { status: "PUBLISHED" }, orderBy: { position: "asc" } },
      assessment: true,
      assignments: { orderBy: { createdAt: "asc" }, take: 1 },
      course: true,
    },
  });
  if (!mod) notFound();

  if (mod.status !== "PUBLISHED") {
    redirect("/academy");
  }

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: mod.lessons.map((l) => l.id) } },
  });
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));
  const completedIds = new Set(
    progress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId),
  );
  const unlockMap = buildLessonUnlockMap(mod.lessons, completedIds);

  const completedCount = completedIds.size;
  const totalMinutes = mod.lessons.reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0);
  const allLessonsDone = completedCount >= mod.lessons.length && mod.lessons.length > 0;

  const az = createAZService(prisma);
  const [moduleMax, assignmentRule, latestAttempt] = await Promise.all([
    az.calculateModuleMaximum(mod.id),
    az.getActiveRuleForAction({
      actionType: "ASSIGNMENT_REVIEWED",
      courseId: mod.courseId,
      moduleId: mod.id,
    }),
    mod.assessment
      ? prisma.assessmentAttempt.findFirst({
          where: { assessmentId: mod.assessment.id, userId: user.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  // One module-scoped LESSON_COMPLETED rule is enough for display; fall back to 5.
  const defaultLessonRule = await az.getActiveRuleForAction({
    actionType: "LESSON_COMPLETED",
    courseId: mod.courseId,
    moduleId: mod.id,
  });
  const defaultLessonAz = defaultLessonRule?.versions[0]?.maxAz ?? 5;
  const lessonAz = new Map<string, number>();
  for (const lesson of mod.lessons) {
    lessonAz.set(lesson.id, defaultLessonAz);
  }
  // Admin steppers need per-lesson values when overridden (sequential — avoid pool thrash)
  if (isAdmin) {
    for (const lesson of mod.lessons) {
      const rule = await az.getActiveRuleForAction({
        actionType: "LESSON_COMPLETED",
        courseId: mod.courseId,
        moduleId: mod.id,
        lessonId: lesson.id,
      });
      lessonAz.set(lesson.id, rule?.versions[0]?.maxAz ?? defaultLessonAz);
    }
  }

  const assignmentAz = assignmentRule?.versions[0]?.maxAz ?? 10;

  let continueHref: string | null = null;
  for (const lesson of mod.lessons) {
    const p = progressByLesson.get(lesson.id);
    if (p?.status !== "COMPLETED" && unlockMap.get(lesson.id)) {
      continueHref = `/academy/${mod.slug}/${lesson.slug}`;
      break;
    }
  }
  if (!continueHref && allLessonsDone && mod.assessment) {
    continueHref = `/academy/${mod.slug}/assessment`;
  }
  if (!continueHref && mod.lessons[0]) {
    continueHref = `/academy/${mod.slug}/${mod.lessons[0].slug}`;
  }

  return (
    <AppShell user={user} title={mod.title}>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--cyan)]">
            Модуль {String(mod.position).padStart(2, "0")}
          </p>
          <h1
            className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {mod.title}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
            <span>
              {completedCount}/{mod.lessons.length} уроков
            </span>
            {totalMinutes > 0 ? <span>~{totalMinutes} мин</span> : null}
            <span className="text-[var(--cyan)]">до {formatAz(moduleMax.effective)} AZ</span>
            {latestAttempt ? (
              <span>
                Проверка: {latestAttempt.score}%
                {latestAttempt.passed ? " · зачёт" : ""}
              </span>
            ) : null}
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/80 px-3.5 py-2.5 text-sm leading-relaxed text-slate-600">
            Как набрать баллы: урок +5 · без ошибок с первого раза +1 · сценарии качества до +2 · задание
            куратора 3–10 · полезные посты в ленте (админ)
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-[var(--cyan)] transition-all"
              style={{
                width: `${mod.lessons.length ? (completedCount / mod.lessons.length) * 100 : 0}%`,
              }}
            />
          </div>
          {continueHref ? (
            <Link
              href={continueHref}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--cyan)] px-5 py-3 text-sm font-black text-[#fff] shadow-[0_0_20px_rgba(3,205,253,0.35)]"
            >
              {completedCount === 0 ? "Начать" : allLessonsDone ? "К проверке / продолжить" : "Продолжить"}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </header>

        <ol className="space-y-2">
          {mod.lessons.map((lesson) => {
            const p = progressByLesson.get(lesson.id);
            const unlocked = unlockMap.get(lesson.id) ?? false;
            const completed = p?.status === "COMPLETED";
            const href = `/academy/${mod.slug}/${lesson.slug}`;
            const reward = lessonAz.get(lesson.id) ?? 5;

            const azControl = isAdmin ? (
              <AdminAzStepper
                kind="lesson"
                lessonId={lesson.id}
                moduleId={mod.id}
                moduleSlug={mod.slug}
                currentAz={reward}
                min={0}
                max={50}
              />
            ) : (
              <span className="shrink-0 text-xs font-black tabular-nums text-[var(--cyan)]">
                +{reward} AZ
              </span>
            );

            if (!unlocked) {
              return (
                <li
                  key={lesson.id}
                  className="az-glass flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-3 opacity-70"
                >
                  <Lock className="h-4 w-4 shrink-0 text-black/50" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black tabular-nums text-black/45">
                      {String(lesson.position).padStart(2, "0")}
                    </p>
                    <p className="font-extrabold text-black/70">{lesson.title}</p>
                  </div>
                  {azControl}
                </li>
              );
            }

            return (
              <li key={lesson.id} className="az-glass flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2.5">
                <Link
                  href={href}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-white",
                    completed && "opacity-95",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                      completed ? "bg-emerald-500 text-white" : "bg-black/8 text-black",
                    )}
                  >
                    {completed ? <Check className="h-4 w-4" /> : String(lesson.position).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-black">{lesson.title}</p>
                    {lesson.estimatedMinutes ? (
                      <p className="text-xs font-bold text-black/50">~{lesson.estimatedMinutes} мин</p>
                    ) : null}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-black/35" />
                </Link>
                {azControl}
              </li>
            );
          })}
        </ol>

        {/* Assignment / final check block */}
        <div className="az-glass space-y-3 rounded-2xl bg-white/85 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-[var(--cyan)]">Задание</p>
              <p className="mt-1 font-extrabold text-black">
                {mod.assignments[0]?.title ?? "Объясни своими словами"}
              </p>
              <p className="mt-0.5 text-xs font-bold text-black/55">
                Куратор ставит от 3 до {assignmentAz} AZ
              </p>
            </div>
            {isAdmin ? (
              <AdminAzStepper
                kind="assignment"
                moduleId={mod.id}
                moduleSlug={mod.slug}
                currentAz={assignmentAz}
                min={3}
                max={20}
              />
            ) : (
              <span className="shrink-0 text-xs font-black tabular-nums text-[var(--cyan)]">
                до +{assignmentAz} AZ
              </span>
            )}
          </div>

          {mod.assessment ? (
            allLessonsDone ? (
              <Link
                href={`/academy/${mod.slug}/assessment`}
                className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-3 transition hover:border-black/25"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                  ✓
                </span>
                <div className="flex-1">
                  <p className="font-extrabold text-black">{mod.assessment.title}</p>
                  <p className="text-xs font-bold text-black/55">
                    Проходной балл {mod.assessment.passScore}%
                    {latestAttempt ? ` · последний результат ${latestAttempt.score}%` : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-black/35" />
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-black/5 px-3 py-3 opacity-70">
                <Lock className="h-4 w-4 text-black/50" />
                <div>
                  <p className="font-extrabold text-black/70">{mod.assessment.title}</p>
                  <p className="text-xs font-bold text-black/45">Откроется после всех уроков</p>
                </div>
              </div>
            )
          ) : null}
        </div>

        <Link href="/academy" className="inline-block text-sm font-black text-black/60 hover:text-black">
          ← Все модули
        </Link>
      </div>
    </AppShell>
  );
}
