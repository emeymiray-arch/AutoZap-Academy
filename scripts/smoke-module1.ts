/**
 * Smoke: Module 1 content + progression + AZ award + assessment scoring path.
 * Run: npx tsx scripts/smoke-module1.ts
 */
import { PrismaClient } from "@prisma/client";
import { AZService } from "../server/az/az-service";
import {
  parseAssessmentContent,
  parseLessonContent,
  requiredKnowledgeCheckIds,
  requiredScenarioIds,
} from "../src/lib/lesson-content";

const prisma = new PrismaClient();

async function main() {
  const student =
    (await prisma.user.findFirst({ where: { email: "maria@autozap.academy" } })) ??
    (await prisma.user.findFirst({ where: { role: "STUDENT" } }));
  if (!student) throw new Error("No student user found — run db:seed");
  console.log("Using student", student.email);

  const mod = await prisma.module.findFirst({
    where: { slug: "module-1" },
    include: {
      lessons: { orderBy: { position: "asc" } },
      assessment: true,
      assignments: true,
      course: true,
    },
  });
  if (!mod?.assessment) throw new Error("Module 1 / assessment missing");

  // Reset maria progress for clean smoke
  await prisma.lessonProgress.deleteMany({ where: { userId: student.id } });
  await prisma.assessmentAttempt.deleteMany({
    where: { userId: student.id, assessmentId: mod.assessment.id },
  });
  await prisma.assignmentSubmission.deleteMany({
    where: { userId: student.id, assignmentId: { in: mod.assignments.map((a) => a.id) } },
  });

  const az = new AZService(prisma);

  for (const lesson of mod.lessons) {
    const content = parseLessonContent(lesson.content);
    const checkpoint: Record<string, unknown> = {};
    for (const id of requiredKnowledgeCheckIds(content)) {
      const block = content.find((b) => b.type === "knowledgeCheck" && b.id === id);
      if (block && block.type === "knowledgeCheck") {
        checkpoint[`kc:${id}`] = { optionId: block.correctOptionId, correct: true };
      }
    }
    for (const id of requiredScenarioIds(content)) {
      const block = content.find((b) => b.type === "scenarioChoice" && b.id === id);
      if (block && block.type === "scenarioChoice") {
        checkpoint[`sc:${id}`] = { optionId: block.correctOptionId, correct: true };
      }
    }

    await prisma.lessonProgress.create({
      data: {
        userId: student.id,
        lessonId: lesson.id,
        status: "COMPLETED",
        checkpoint,
        completedAt: new Date(),
      },
    });

    const rule = await az.getActiveRuleForAction({
      actionType: "LESSON_COMPLETED",
      courseId: mod.courseId,
      moduleId: mod.id,
      lessonId: lesson.id,
    });
    const maxAz = rule?.versions[0]?.maxAz ?? 0;
    if (maxAz > 0) {
      try {
        const result = await az.applyReward({
          userId: student.id,
          actionType: "LESSON_COMPLETED",
          sourceType: "lesson",
          sourceId: lesson.id,
          amount: maxAz,
          reason: `Smoke: ${lesson.title}`,
          idempotencyKey: `smoke:lesson:${student.id}:${lesson.id}`,
          courseId: mod.courseId,
          moduleId: mod.id,
          lessonId: lesson.id,
        });
        console.log("AZ", lesson.slug, result.entry.awardedAz, result.idempotentReplay ? "(replay)" : "");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("Repeat AZ awards are disabled")) throw e;
        console.log("AZ", lesson.slug, "already awarded (ok)");
      }
    }

    if (maxAz > 0) {
      const again = await az.applyReward({
        userId: student.id,
        actionType: "LESSON_COMPLETED",
        sourceType: "lesson",
        sourceId: lesson.id,
        amount: maxAz,
        reason: `Smoke: ${lesson.title}`,
        idempotencyKey: `smoke:lesson:${student.id}:${lesson.id}`,
        courseId: mod.courseId,
        moduleId: mod.id,
        lessonId: lesson.id,
      });
      if (!again.idempotentReplay) throw new Error(`Expected idempotent replay for ${lesson.slug}`);
    }
  }

  const questions = parseAssessmentContent(mod.assessment.content);
  const answers: Record<string, unknown> = {};
  for (const q of questions) {
    if (q.type === "mcq" || q.type === "scenario") answers[q.id] = q.correctOptionId;
    if (q.type === "findError") answers[q.id] = q.incorrectStatementId;
    if (q.type === "matching") {
      answers[q.id] = Object.fromEntries(q.pairs.map((p) => [p.left, p.right]));
    }
  }

  let earned = 0;
  let total = 0;
  for (const q of questions) {
    if (q.type === "freeText") continue;
    const points = q.points;
    total += points;
    let correct = false;
    if (q.type === "mcq" || q.type === "scenario") correct = answers[q.id] === q.correctOptionId;
    if (q.type === "findError") correct = answers[q.id] === q.incorrectStatementId;
    if (q.type === "matching") {
      const submitted = answers[q.id] as Record<string, string>;
      correct = q.pairs.every((p) => submitted[p.left] === p.right);
    }
    if (correct) earned += points;
  }
  const score = Math.round((earned / total) * 100);
  const passed = score >= mod.assessment.passScore;

  await prisma.assessmentAttempt.create({
    data: {
      assessmentId: mod.assessment.id,
      userId: student.id,
      score,
      passed,
      answers: { answers, freeText: "Smoke test: AutoZap — экосистема вокруг запчастей.", graded: [] },
    },
  });

  if (mod.assignments[0]) {
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId: mod.assignments[0].id,
        userId: student.id,
        content: "Smoke test free-text for curator review about AutoZap ecosystem.",
        status: "SUBMITTED",
      },
    });
  }

  const completed = await prisma.lessonProgress.count({
    where: { userId: student.id, status: "COMPLETED", lessonId: { in: mod.lessons.map((l) => l.id) } },
  });

  console.log({
    lessonsCompleted: completed,
    assessmentScore: score,
    passed,
    ok: completed === 7 && passed,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
