"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createAZService } from "@server/az/az-service";
import { prisma } from "@server/db";
import { requireAdmin, requireUser } from "@server/auth/session";
import {
  isCleanLessonCheckpoint,
  parseAssessmentContent,
  parseLessonContent,
  requiredKnowledgeCheckIds,
  scenarioPassIds,
  scenarioQualityAzEarned,
  type AssessmentQuestion,
} from "@/lib/lesson-content";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const az = createAZService(prisma);

function academyPaths(moduleSlug: string, lessonSlug?: string) {
  revalidatePath("/academy");
  revalidatePath(`/academy/${moduleSlug}`);
  if (lessonSlug) revalidatePath(`/academy/${moduleSlug}/${lessonSlug}`);
  revalidatePath(`/academy/${moduleSlug}/assessment`);
  revalidatePath("/dashboard");
}

async function loadLessonForUser(moduleSlug: string, lessonSlug: string) {
  const lesson = await prisma.lesson.findFirst({
    where: {
      slug: lessonSlug,
      module: { slug: moduleSlug },
      status: "PUBLISHED",
    },
    include: {
      module: {
        include: {
          course: true,
          lessons: { where: { status: "PUBLISHED" }, orderBy: { position: "asc" } },
        },
      },
    },
  });
  return lesson;
}

/** Sequential unlock: lesson N requires lessons 1..N-1 completed (single round-trip). */
export async function isLessonUnlocked(
  userId: string,
  moduleId: string,
  lessonPosition: number,
): Promise<boolean> {
  if (lessonPosition <= 1) return true;
  const incompletePrior = await prisma.lesson.count({
    where: {
      moduleId,
      status: "PUBLISHED",
      position: { lt: lessonPosition },
      OR: [
        { progress: { none: { userId } } },
        { progress: { some: { userId, status: { not: "COMPLETED" } } } },
      ],
    },
  });
  return incompletePrior === 0;
}

export async function saveLessonCheckpointAction(input: {
  moduleSlug: string;
  lessonSlug: string;
  checkpoint: Record<string, unknown>;
}) {
  const user = await requireUser();
  const lesson = await loadLessonForUser(input.moduleSlug, input.lessonSlug);
  if (!lesson) throw new Error("Урок не найден");

  const unlocked = await isLessonUnlocked(user.id, lesson.moduleId, lesson.position);
  if (!unlocked) throw new Error("Урок ещё закрыт");

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
  });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    create: {
      userId: user.id,
      lessonId: lesson.id,
      status: "IN_PROGRESS",
      checkpoint: asJson(input.checkpoint),
    },
    update: {
      checkpoint: asJson(input.checkpoint),
      ...(existing?.status === "COMPLETED" ? {} : { status: "IN_PROGRESS" as const }),
    },
  });

  // No revalidation here: autosave must not trigger a full page re-render
  // (it also blocks subsequent server actions like "Завершить урок").
  return { ok: true as const };
}

const completeSchema = z.object({
  moduleSlug: z.string().min(1),
  lessonSlug: z.string().min(1),
  checkpoint: z.record(z.string(), z.unknown()).optional(),
});

export async function completeLessonAction(input: z.infer<typeof completeSchema>) {
  const user = await requireUser();
  const parsed = completeSchema.parse(input);
  const lesson = await loadLessonForUser(parsed.moduleSlug, parsed.lessonSlug);
  if (!lesson) throw new Error("Урок не найден");

  const unlocked = await isLessonUnlocked(user.id, lesson.moduleId, lesson.position);
  if (!unlocked) throw new Error("Урок ещё закрыт");

  const content = parseLessonContent(lesson.content);
  const checkpoint = parsed.checkpoint ?? {};

  for (const id of requiredKnowledgeCheckIds(content)) {
    const entry = checkpoint[`kc:${id}`] as { correct?: boolean } | undefined;
    if (!entry?.correct) {
      throw new Error("Пройдите все проверки знаний перед завершением урока");
    }
  }
  for (const block of content) {
    if (block.type !== "scenarioChoice") continue;
    const entry = checkpoint[`sc:${block.id}`] as { optionId?: string; correct?: boolean } | undefined;
    const passed =
      entry?.correct ||
      (entry?.optionId != null && scenarioPassIds(block).includes(entry.optionId));
    if (!passed) {
      throw new Error("Ответьте на все сценарии перед завершением урока");
    }
  }

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
  });
  const now = new Date();

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    create: {
      userId: user.id,
      lessonId: lesson.id,
      status: "COMPLETED",
      checkpoint: asJson(checkpoint),
      completionCount: 1,
      completedAt: now,
      lastCompletedAt: now,
    },
    update: {
      status: "COMPLETED",
      checkpoint: asJson(checkpoint),
      completionCount: { increment: 1 },
      completedAt: existing?.completedAt ?? now,
      lastCompletedAt: now,
    },
  });

  const awarded: { base: number; cleanBonus: number; qualityBonus: number } = {
    base: 0,
    cleanBonus: 0,
    qualityBonus: 0,
  };

  const tryAward = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      console.error("AZ award on lesson complete failed:", e);
    }
  };

  const ruleScope = {
    courseId: lesson.module.courseId,
    moduleId: lesson.moduleId,
    lessonId: lesson.id,
  };
  const [preview, customRule] = await Promise.all([
    az.getActiveRuleForAction({ actionType: "LESSON_COMPLETED", ...ruleScope }),
    az.getActiveRuleForAction({ actionType: "CUSTOM", ...ruleScope }),
  ]);

  // 1) Base lesson completion
  const maxAz = preview?.versions[0]?.maxAz ?? 0;

  if (maxAz > 0) {
    await tryAward(async () => {
      await az.applyReward({
        userId: user.id,
        actionType: "LESSON_COMPLETED",
        sourceType: "lesson",
        sourceId: lesson.id,
        amount: maxAz,
        reason: `Урок завершён: ${lesson.title}`,
        idempotencyKey: `lesson-complete:${user.id}:${lesson.id}`,
        courseId: lesson.module.courseId,
        moduleId: lesson.moduleId,
        lessonId: lesson.id,
      });
      awarded.base = maxAz;
    });
  }

  const customMax = customRule?.versions[0]?.maxAz ?? 0;

  // 2) Clean-check bonus (+1): all checks/scenarios passed on first try
  const clean = isCleanLessonCheckpoint(content, checkpoint);
  if (clean && customMax > 0) {
    await tryAward(async () => {
      const amount = Math.min(1, customMax);
      await az.applyReward({
        userId: user.id,
        actionType: "CUSTOM",
        sourceType: "lesson_clean",
        sourceId: lesson.id,
        amount,
        reason: `Чистая сдача без ошибок: ${lesson.title}`,
        idempotencyKey: `lesson-clean:${user.id}:${lesson.id}`,
        courseId: lesson.module.courseId,
        moduleId: lesson.moduleId,
        lessonId: lesson.id,
      });
      awarded.cleanBonus = amount;
    });
  }

  // 3) Tiered scenario quality (qualityAz on options)
  const qualityEarned = scenarioQualityAzEarned(content, checkpoint);
  if (qualityEarned > 0 && customMax > 0) {
    await tryAward(async () => {
      const amount = Math.min(qualityEarned, customMax);
      await az.applyReward({
        userId: user.id,
        actionType: "CUSTOM",
        sourceType: "lesson_quality",
        sourceId: lesson.id,
        amount,
        reason: `Качество сценариев: ${lesson.title}`,
        idempotencyKey: `lesson-quality:${user.id}:${lesson.id}`,
        courseId: lesson.module.courseId,
        moduleId: lesson.moduleId,
        lessonId: lesson.id,
      });
      awarded.qualityBonus = amount;
    });
  }

  academyPaths(parsed.moduleSlug, parsed.lessonSlug);
  return { ok: true as const, lessonId: lesson.id, awarded, clean };
}

type GradedAnswer = {
  questionId: string;
  correct: boolean;
  pointsEarned: number;
  pointsMax: number;
};

function scoreAssessment(
  questions: AssessmentQuestion[],
  answers: Record<string, unknown>,
): { score: number; passed: boolean; graded: GradedAnswer[]; passScore: number; totalPoints: number; earnedPoints: number } {
  let earned = 0;
  let total = 0;
  const graded: GradedAnswer[] = [];

  for (const q of questions) {
    if (q.type === "freeText") continue;

    const points = "points" in q ? q.points : 1;
    total += points;
    let correct = false;

    if (q.type === "mcq" || q.type === "scenario") {
      correct = answers[q.id] === q.correctOptionId;
    } else if (q.type === "findError") {
      correct = answers[q.id] === q.incorrectStatementId;
    } else if (q.type === "matching") {
      const submitted = answers[q.id] as Record<string, string> | undefined;
      if (submitted && typeof submitted === "object") {
        correct = q.pairs.every((p) => submitted[p.left] === p.right);
      }
    }

    const pointsEarned = correct ? points : 0;
    earned += pointsEarned;
    graded.push({ questionId: q.id, correct, pointsEarned, pointsMax: points });
  }

  const score = total === 0 ? 100 : Math.round((earned / total) * 100);
  return {
    score,
    earnedPoints: earned,
    totalPoints: total,
    graded,
    passed: false, // filled by caller with passScore
    passScore: 70,
  };
}

const submitAssessmentSchema = z.object({
  moduleSlug: z.string().min(1),
  answers: z.record(z.string(), z.unknown()),
  freeText: z.string().min(20).max(8000).optional(),
});

export async function submitAssessmentAction(input: z.infer<typeof submitAssessmentSchema>) {
  const user = await requireUser();
  const parsed = submitAssessmentSchema.parse(input);

  const mod = await prisma.module.findFirst({
    where: { slug: parsed.moduleSlug },
    include: {
      assessment: true,
      lessons: { where: { status: "PUBLISHED" }, orderBy: { position: "asc" } },
      assignments: { orderBy: { createdAt: "asc" }, take: 1 },
      course: true,
    },
  });
  if (!mod?.assessment) throw new Error("Проверка не найдена");

  // Gate: all lessons completed
  const lessonIds = mod.lessons.map((l) => l.id);
  const completed = await prisma.lessonProgress.count({
    where: { userId: user.id, lessonId: { in: lessonIds }, status: "COMPLETED" },
  });
  if (completed < lessonIds.length) {
    throw new Error("Сначала завершите все уроки модуля");
  }

  const questions = parseAssessmentContent(mod.assessment.content);
  const hasFreeText = questions.some((q) => q.type === "freeText");
  if (hasFreeText && (!parsed.freeText || parsed.freeText.trim().length < 20)) {
    throw new Error("Напишите развёрнутый ответ своими словами (минимум 20 символов)");
  }

  const scored = scoreAssessment(questions, parsed.answers);
  const passed = scored.score >= mod.assessment.passScore;

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: mod.assessment.id,
      userId: user.id,
      score: scored.score,
      passed,
      answers: asJson({
        answers: parsed.answers,
        freeText: parsed.freeText ?? null,
        graded: scored.graded,
        earnedPoints: scored.earnedPoints,
        totalPoints: scored.totalPoints,
      }),
    },
  });

  // Free-text → AssignmentSubmission for curator
  const assignment = mod.assignments[0];
  if (assignment && parsed.freeText) {
    const existingSub = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: assignment.id,
        userId: user.id,
        OR: [{ status: "DRAFT" }, { status: "SUBMITTED", reviewedAt: null }],
      },
      orderBy: { createdAt: "desc" },
    });
    if (existingSub) {
      await prisma.assignmentSubmission.update({
        where: { id: existingSub.id },
        data: { content: parsed.freeText, status: "SUBMITTED" },
      });
    } else {
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          userId: user.id,
          content: parsed.freeText,
          status: "SUBMITTED",
        },
      });
    }
  }

  academyPaths(parsed.moduleSlug);
  revalidatePath("/admin/participants");
  return {
    ok: true as const,
    attemptId: attempt.id,
    score: scored.score,
    passed,
    passScore: mod.assessment.passScore,
    graded: scored.graded,
    sentToCurator: Boolean(parsed.freeText),
  };
}

const reviewSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  awardedAz: z.number().int().min(0).max(50),
  qualityLabel: z.string().min(1).max(40),
  feedback: z.string().max(4000).optional(),
});

/** Admin grades free-text answer from module assessment (3–10 AZ typical). */
export async function reviewAssignmentSubmissionAction(
  input: z.infer<typeof reviewSubmissionSchema>,
) {
  const admin = await requireAdmin();
  const parsed = reviewSubmissionSchema.parse(input);

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: parsed.submissionId },
    include: {
      assignment: { include: { module: { include: { course: true } } } },
      user: { select: { id: true, name: true, nickname: true, email: true } },
    },
  });
  if (!submission) throw new Error("Ответ не найден");
  if (!submission.content?.trim()) throw new Error("Пустой ответ — нечего оценивать");

  const mod = submission.assignment.module;
  const alreadyAwarded = submission.awardedAz != null && submission.reviewedAt != null;

  await prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data: {
      status: "APPROVED",
      awardedAz: parsed.awardedAz,
      qualityLabel: parsed.qualityLabel,
      feedback: parsed.feedback?.trim() || null,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  if (parsed.awardedAz > 0) {
    try {
      if (alreadyAwarded) {
        await az.recalculateReward({
          userId: submission.userId,
          sourceType: "assignment_submission",
          sourceId: submission.id,
          newAmount: parsed.awardedAz,
          qualityLabel: parsed.qualityLabel,
          reason: `Переоценка ответа: ${submission.assignment.title}`,
          idempotencyKey: `assignment-regrade:${submission.id}:${Date.now()}`,
          kind: "REGRADE",
        });
      } else {
        await az.applyReward({
          userId: submission.userId,
          actionType: "ASSIGNMENT_REVIEWED",
          sourceType: "assignment_submission",
          sourceId: submission.id,
          amount: parsed.awardedAz,
          qualityLabel: parsed.qualityLabel,
          reason: `Проверка ответа: ${submission.assignment.title}`,
          idempotencyKey: `assignment-review:${submission.id}`,
          courseId: mod.courseId,
          moduleId: mod.id,
        });
      }
    } catch (e) {
      console.error("AZ award on assignment review failed:", e);
    }
  }

  revalidatePath("/admin/participants");
  revalidatePath(`/admin/participants/${submission.userId}/review`);
  revalidatePath("/academy");
  revalidatePath(`/academy/${mod.slug}`);
  return { ok: true as const, awardedAz: parsed.awardedAz };
}
