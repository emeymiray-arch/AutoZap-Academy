import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { AZService } from "./az-service";

const prisma = new PrismaClient();
const az = new AZService(prisma);

const ids = {
  admin: "test-admin",
  student: "test-student",
  course: "test-course",
  module: "test-module",
  lesson: "test-lesson",
  assignment: "test-assignment",
};

async function reset() {
  await prisma.azLedgerEntry.deleteMany();
  await prisma.userAzBalance.deleteMany();
  await prisma.finalStatusAssignment.deleteMany();
  await prisma.azRecalculationJob.deleteMany();
  await prisma.azQualityRange.deleteMany();
  await prisma.azRewardRuleVersion.deleteMany();
  await prisma.azRewardRule.deleteMany();
  await prisma.azLevelRule.deleteMany();
  await prisma.rankingTieBreakRule.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: { id: ids.admin, email: "admin@test.local", name: "Admin", role: "ADMIN" },
  });
  await prisma.user.create({
    data: { id: ids.student, email: "student@test.local", name: "Student", role: "STUDENT" },
  });
  await prisma.user.create({
    data: { id: "s2", email: "s2@test.local", name: "S2", role: "STUDENT" },
  });
  await prisma.user.create({
    data: { id: "s3", email: "s3@test.local", name: "S3", role: "STUDENT" },
  });
  await prisma.user.create({
    data: { id: "s4", email: "s4@test.local", name: "S4", role: "STUDENT" },
  });

  await prisma.course.create({
    data: { id: ids.course, slug: "c", title: "Course", status: "PUBLISHED" },
  });
  await prisma.module.create({
    data: {
      id: ids.module,
      courseId: ids.course,
      slug: "m1",
      title: "Module 1",
      position: 1,
      status: "PUBLISHED",
    },
  });
  await prisma.lesson.create({
    data: {
      id: ids.lesson,
      moduleId: ids.module,
      slug: "l1",
      title: "Lesson 1",
      position: 1,
      status: "PUBLISHED",
    },
  });
  await prisma.assignment.create({
    data: { id: ids.assignment, moduleId: ids.module, title: "Practice" },
  });

  await az.createLevelRule({ slug: "bronze", name: "Bronze", minAz: 0, maxAz: 50, sortOrder: 1 });
  await az.createLevelRule({ slug: "silver", name: "Silver", minAz: 50, maxAz: 100, sortOrder: 2 });
  await az.createLevelRule({ slug: "gold", name: "Gold", minAz: 100, maxAz: null, sortOrder: 3 });

  await prisma.rankingTieBreakRule.create({
    data: { priority: 1, criterion: "TOTAL_AZ", descending: true, active: true },
  });
}

before(async () => {
  await reset();
});

after(async () => {
  await prisma.$disconnect();
});

describe("AZService", () => {
  it("awards AZ from scoped rule (not hardcoded global)", async () => {
    await reset();
    await az.createRewardRule({
      actionType: "LESSON_COMPLETED",
      scopeType: "LESSON",
      courseId: ids.course,
      moduleId: ids.module,
      lessonId: ids.lesson,
      name: "L1",
      maxAz: 20,
      allowsPartial: false,
      allowsRepeat: false,
      qualityDependent: false,
    });

    const result = await az.applyReward({
      userId: ids.student,
      actionType: "LESSON_COMPLETED",
      sourceType: "lesson",
      sourceId: ids.lesson,
      amount: 20,
      reason: "completed",
      idempotencyKey: "award-1",
      courseId: ids.course,
      moduleId: ids.module,
      lessonId: ids.lesson,
    });

    assert.equal(result.entry.awardedAz, 20);
    assert.equal(result.idempotentReplay, false);

    const summary = await az.getStudentAZSummary(ids.student);
    assert.equal(summary.balance, 20);
  });

  it("is idempotent on duplicate idempotencyKey", async () => {
    const again = await az.applyReward({
      userId: ids.student,
      actionType: "LESSON_COMPLETED",
      sourceType: "lesson",
      sourceId: ids.lesson,
      amount: 20,
      reason: "completed",
      idempotencyKey: "award-1",
      courseId: ids.course,
      moduleId: ids.module,
      lessonId: ids.lesson,
    });
    assert.equal(again.idempotentReplay, true);
    const summary = await az.getStudentAZSummary(ids.student);
    assert.equal(summary.balance, 20);
  });

  it("supports partial award when enabled", async () => {
    await reset();
    await az.createRewardRule({
      actionType: "ASSIGNMENT_REVIEWED",
      scopeType: "MODULE",
      moduleId: ids.module,
      courseId: ids.course,
      name: "Practice",
      maxAz: 20,
      allowsPartial: true,
      allowsRepeat: false,
      qualityDependent: false,
    });

    const result = await az.applyReward({
      userId: ids.student,
      actionType: "ASSIGNMENT_REVIEWED",
      sourceType: "assignment",
      sourceId: ids.assignment,
      amount: 13,
      reason: "partial",
      idempotencyKey: "partial-1",
      moduleId: ids.module,
      courseId: ids.course,
    });

    assert.equal(result.entry.awardedAz, 13);
  });

  it("supports quality ranges and regrade", async () => {
    await reset();
    await az.createRewardRule({
      actionType: "ASSIGNMENT_REVIEWED",
      scopeType: "MODULE",
      moduleId: ids.module,
      courseId: ids.course,
      name: "Practice Q",
      maxAz: 10,
      allowsPartial: true,
      allowsRepeat: false,
      qualityDependent: true,
      qualityRanges: [
        { label: "Плохо", minAz: 0, maxAz: 3 },
        { label: "Средне", minAz: 4, maxAz: 7 },
        { label: "Хорошо", minAz: 8, maxAz: 10 },
      ],
    });

    await az.applyReward({
      userId: ids.student,
      actionType: "ASSIGNMENT_REVIEWED",
      sourceType: "assignment",
      sourceId: ids.assignment,
      amount: 7,
      qualityLabel: "Средне",
      reason: "основные требования",
      idempotencyKey: "q-1",
      moduleId: ids.module,
      courseId: ids.course,
    });

    const regrade = await az.recalculateReward({
      userId: ids.student,
      sourceType: "assignment",
      sourceId: ids.assignment,
      newAmount: 9,
      qualityLabel: "Хорошо",
      reason: "повторная проверка",
      idempotencyKey: "q-regrade-1",
      kind: "REGRADE",
    });

    assert.equal(regrade.entry.previousAwardedAz, 7);
    assert.equal(regrade.entry.awardedAz, 9);
    assert.equal(regrade.entry.delta, 2);

    const summary = await az.getStudentAZSummary(ids.student);
    assert.equal(summary.balance, 9);

    const history = await az.getAZHistory(ids.student);
    assert.ok(history.some((h) => h.kind === "REGRADE"));
  });

  it("allows repeat when configured", async () => {
    await reset();
    await az.createRewardRule({
      actionType: "QUIZ_COMPLETED",
      scopeType: "MODULE",
      moduleId: ids.module,
      courseId: ids.course,
      name: "Quiz",
      maxAz: 30,
      allowsPartial: true,
      allowsRepeat: true,
      qualityDependent: false,
    });

    await az.applyReward({
      userId: ids.student,
      actionType: "QUIZ_COMPLETED",
      sourceType: "quiz",
      sourceId: "quiz-1",
      amount: 20,
      reason: "attempt 1",
      idempotencyKey: "quiz-a1",
      moduleId: ids.module,
    });

    const second = await az.applyReward({
      userId: ids.student,
      actionType: "QUIZ_COMPLETED",
      sourceType: "quiz",
      sourceId: "quiz-1",
      amount: 25,
      reason: "attempt 2",
      idempotencyKey: "quiz-a2",
      moduleId: ids.module,
    });

    assert.equal(second.entry.kind, "REPEAT");
    const summary = await az.getStudentAZSummary(ids.student);
    assert.equal(summary.balance, 45);
  });

  it("recalculates when admin publishes RECALCULATE_EXISTING version", async () => {
    await reset();
    const rule = await az.createRewardRule({
      actionType: "LESSON_COMPLETED",
      scopeType: "LESSON",
      lessonId: ids.lesson,
      moduleId: ids.module,
      courseId: ids.course,
      name: "L1",
      maxAz: 20,
      allowsPartial: false,
      allowsRepeat: false,
      qualityDependent: false,
    });

    await az.applyReward({
      userId: ids.student,
      actionType: "LESSON_COMPLETED",
      sourceType: "lesson",
      sourceId: ids.lesson,
      amount: 20,
      reason: "done",
      idempotencyKey: "recalc-award",
      lessonId: ids.lesson,
      moduleId: ids.module,
      courseId: ids.course,
    });

    const published = await az.publishRewardRuleVersion({
      ruleId: rule.id,
      maxAz: 40,
      allowsPartial: false,
      allowsRepeat: false,
      qualityDependent: false,
      applyMode: "RECALCULATE_EXISTING",
      note: "increase max",
    });

    assert.ok(published.recalcSummary);
    assert.equal(published.recalcSummary?.adjusted, 1);

    const summary = await az.getStudentAZSummary(ids.student);
    assert.equal(summary.balance, 40);
  });

  it("promotes and demotes level without resetting AZ", async () => {
    await reset();
    await az.createRewardRule({
      actionType: "CUSTOM",
      scopeType: "GLOBAL",
      name: "Custom",
      maxAz: 200,
      allowsPartial: true,
      allowsRepeat: true,
      qualityDependent: false,
      autoReductionJson: JSON.stringify({ enabled: true }),
    });

    const rule = (await az.listRewardRules()).find((r) => r.actionType === "CUSTOM");
    assert.ok(rule);

    await az.applyReward({
      userId: ids.student,
      actionType: "CUSTOM",
      sourceType: "manual-event",
      sourceId: "evt-1",
      amount: 60,
      reason: "boost",
      idempotencyKey: "lvl-up",
    });

    let summary = await az.getStudentAZSummary(ids.student);
    assert.equal(summary.level?.slug, "silver");
    assert.equal(summary.balance, 60);

    const versionId = rule!.versions[0].id;
    await az.applyAutoReduction({
      userId: ids.student,
      actionType: "CUSTOM",
      sourceType: "manual-event",
      sourceId: "evt-reduce",
      amount: 20,
      reason: "configured reduction",
      idempotencyKey: "lvl-down",
      ruleId: rule!.id,
      ruleVersionId: versionId,
    });

    summary = await az.getStudentAZSummary(ids.student);
    assert.equal(summary.balance, 40);
    assert.equal(summary.level?.slug, "bronze");
  });

  it("calculates module maximum from scoped rules", async () => {
    await reset();
    await az.createRewardRule({
      actionType: "LESSON_COMPLETED",
      scopeType: "LESSON",
      lessonId: ids.lesson,
      moduleId: ids.module,
      courseId: ids.course,
      name: "L1",
      maxAz: 20,
      allowsPartial: false,
      allowsRepeat: false,
      qualityDependent: false,
    });
    await az.createRewardRule({
      actionType: "ASSIGNMENT_REVIEWED",
      scopeType: "MODULE",
      moduleId: ids.module,
      courseId: ids.course,
      name: "P",
      maxAz: 50,
      allowsPartial: true,
      allowsRepeat: false,
      qualityDependent: false,
    });

    const max = await az.calculateModuleMaximum(ids.module);
    assert.equal(max.calculated, 70);
    assert.equal(max.effective, 70);

    await az.setModuleMaximumOverride(ids.module, 105, true);
    const overridden = await az.calculateModuleMaximum(ids.module);
    assert.equal(overridden.effective, 105);
    assert.equal(overridden.useOverride, true);
  });

  it("builds final ranking and TOP statuses from AZ + tie-break config", async () => {
    await reset();
    await az.createRewardRule({
      actionType: "CUSTOM",
      scopeType: "GLOBAL",
      name: "Points",
      maxAz: 500,
      allowsPartial: true,
      allowsRepeat: true,
      qualityDependent: false,
    });

    await az.applyReward({
      userId: ids.student,
      actionType: "CUSTOM",
      sourceType: "evt",
      sourceId: "a",
      amount: 100,
      reason: "a",
      idempotencyKey: "r-a",
    });
    await az.applyReward({
      userId: "s2",
      actionType: "CUSTOM",
      sourceType: "evt",
      sourceId: "b",
      amount: 80,
      reason: "b",
      idempotencyKey: "r-b",
    });
    await az.applyReward({
      userId: "s3",
      actionType: "CUSTOM",
      sourceType: "evt",
      sourceId: "c",
      amount: 60,
      reason: "c",
      idempotencyKey: "r-c",
    });
    await az.applyReward({
      userId: "s4",
      actionType: "CUSTOM",
      sourceType: "evt",
      sourceId: "d",
      amount: 40,
      reason: "d",
      idempotencyKey: "r-d",
    });

    const statuses = await az.determineFinalStatus({
      graduatedUserIds: [ids.student, "s2", "s3", "s4"],
    });

    assert.equal(statuses.find((s) => s.userId === ids.student)?.status, "TOP_1");
    assert.equal(statuses.find((s) => s.userId === "s2")?.status, "TOP_2");
    assert.equal(statuses.find((s) => s.userId === "s3")?.status, "TOP_3");
    assert.equal(statuses.find((s) => s.userId === "s4")?.status, "MANAGER");
  });
});
