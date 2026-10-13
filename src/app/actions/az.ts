"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAZService } from "@server/az/az-service";
import { prisma } from "@server/db";
import { requireAdmin, requireUser } from "@server/auth/session";

const az = createAZService(prisma);

const publishSchema = z.object({
  ruleId: z.string(),
  maxAz: z.coerce.number().int().nonnegative(),
  allowsPartial: z.coerce.boolean(),
  allowsRepeat: z.coerce.boolean(),
  qualityDependent: z.coerce.boolean(),
  applyMode: z.enum(["FUTURE_ONLY", "RECALCULATE_EXISTING"]),
  note: z.string().optional(),
});

export async function publishAzRuleVersionAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = publishSchema.parse({
    ruleId: formData.get("ruleId"),
    maxAz: formData.get("maxAz"),
    allowsPartial: formData.get("allowsPartial") === "on" || formData.get("allowsPartial") === "true",
    allowsRepeat: formData.get("allowsRepeat") === "on" || formData.get("allowsRepeat") === "true",
    qualityDependent:
      formData.get("qualityDependent") === "on" || formData.get("qualityDependent") === "true",
    applyMode: formData.get("applyMode"),
    note: formData.get("note") || undefined,
  });

  await az.publishRewardRuleVersion({
    ruleId: parsed.ruleId,
    maxAz: parsed.maxAz,
    allowsPartial: parsed.allowsPartial,
    allowsRepeat: parsed.allowsRepeat,
    qualityDependent: parsed.qualityDependent,
    applyMode: parsed.applyMode,
    createdById: admin.id,
    note: parsed.note,
  });

  revalidatePath("/admin/az");
  revalidatePath("/dashboard");
  revalidatePath("/az-history");
}

const createRuleSchema = z.object({
  name: z.string().min(1),
  actionType: z.enum([
    "LESSON_COMPLETED",
    "QUIZ_COMPLETED",
    "ASSIGNMENT_REVIEWED",
    "SIMULATION_COMPLETED",
    "FINAL_SIMULATION",
    "CERTIFICATION",
    "CUSTOM",
  ]),
  scopeType: z.enum(["GLOBAL", "COURSE", "MODULE", "LESSON"]),
  maxAz: z.coerce.number().int().nonnegative(),
  allowsPartial: z.boolean(),
  allowsRepeat: z.boolean(),
  qualityDependent: z.boolean(),
  courseId: z.string().optional().nullable(),
  moduleId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
});

export async function createAzRewardRuleAction(input: z.infer<typeof createRuleSchema>) {
  const admin = await requireAdmin();
  const parsed = createRuleSchema.parse(input);

  await az.createRewardRule({
    ...parsed,
    createdById: admin.id,
  });

  revalidatePath("/admin/az");
}

/** Form-friendly create: targetId = "lesson:id" | "module:id" | "assignment-module:id" */
export async function createAzRewardRuleFromFormAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const actionType = String(formData.get("actionType") ?? "LESSON_COMPLETED") as z.infer<
    typeof createRuleSchema
  >["actionType"];
  const scopeType = String(formData.get("scopeType") ?? "LESSON") as z.infer<
    typeof createRuleSchema
  >["scopeType"];
  const maxAz = Number.parseInt(String(formData.get("maxAz") ?? "0"), 10);
  const allowsPartial = formData.get("allowsPartial") === "on";
  const qualityDependent = formData.get("qualityDependent") === "on";
  const target = String(formData.get("targetId") ?? "");

  let courseId: string | null = null;
  let moduleId: string | null = null;
  let lessonId: string | null = null;
  let resolvedScope = scopeType;

  if (target.startsWith("lesson:")) {
    lessonId = target.slice("lesson:".length);
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });
    if (!lesson) throw new Error("Урок не найден");
    moduleId = lesson.moduleId;
    courseId = lesson.module.courseId;
    resolvedScope = "LESSON";
  } else if (target.startsWith("module:") || target.startsWith("assignment-module:")) {
    moduleId = target.includes("assignment-module:")
      ? target.slice("assignment-module:".length)
      : target.slice("module:".length);
    const mod = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) throw new Error("Модуль не найден");
    courseId = mod.courseId;
    resolvedScope = "MODULE";
    if (target.startsWith("assignment-module:") && actionType === "LESSON_COMPLETED") {
      // assignment targets should use ASSIGNMENT_REVIEWED
    }
  }

  await az.createRewardRule({
    name,
    actionType:
      target.startsWith("assignment-module:") && actionType === "LESSON_COMPLETED"
        ? "ASSIGNMENT_REVIEWED"
        : actionType,
    scopeType: resolvedScope,
    maxAz: Number.isFinite(maxAz) ? maxAz : 0,
    allowsPartial,
    allowsRepeat: false,
    qualityDependent,
    courseId,
    moduleId,
    lessonId,
    createdById: admin.id,
  });

  revalidatePath("/admin/az");
}

export async function setModuleMaxOverrideAction(formData: FormData) {
  await requireAdmin();
  const moduleId = String(formData.get("moduleId"));
  const useOverride = formData.get("useOverride") === "on";
  const overrideRaw = formData.get("override");
  const override =
    overrideRaw === null || overrideRaw === "" ? null : Number.parseInt(String(overrideRaw), 10);

  await az.setModuleMaximumOverride(moduleId, override, useOverride);
  revalidatePath("/admin/az");
}

/** Inline admin control: set AZ for a lesson or module assignment without a separate settings page */
export async function setScopedRewardAzAction(input: {
  kind: "lesson" | "assignment";
  moduleId: string;
  moduleSlug: string;
  lessonId?: string;
  maxAz: number;
}) {
  const admin = await requireAdmin();
  const maxAz = Math.max(0, Math.min(100, Math.floor(input.maxAz)));

  const mod = await prisma.module.findUniqueOrThrow({
    where: { id: input.moduleId },
    select: { id: true, courseId: true, title: true, slug: true },
  });

  if (input.kind === "lesson") {
    if (!input.lessonId) throw new Error("lessonId required");
    const lesson = await prisma.lesson.findUniqueOrThrow({
      where: { id: input.lessonId },
      select: { id: true, title: true, position: true, moduleId: true },
    });
    if (lesson.moduleId !== mod.id) throw new Error("Урок не из этого модуля");

    const existing = await prisma.azRewardRule.findFirst({
      where: { actionType: "LESSON_COMPLETED", lessonId: lesson.id, active: true },
      include: { versions: { where: { active: true }, orderBy: { version: "desc" }, take: 1 } },
    });

    if (!existing) {
      await az.createRewardRule({
        actionType: "LESSON_COMPLETED",
        scopeType: "LESSON",
        courseId: mod.courseId,
        moduleId: mod.id,
        lessonId: lesson.id,
        name: `${mod.title} / Lesson ${lesson.position}`,
        maxAz,
        allowsPartial: false,
        allowsRepeat: false,
        qualityDependent: false,
        createdById: admin.id,
      });
    } else {
      await az.publishRewardRuleVersion({
        ruleId: existing.id,
        maxAz,
        allowsPartial: false,
        allowsRepeat: false,
        qualityDependent: false,
        applyMode: "FUTURE_ONLY",
        createdById: admin.id,
        note: "Inline admin edit",
      });
    }
  } else {
    const existing = await prisma.azRewardRule.findFirst({
      where: { actionType: "ASSIGNMENT_REVIEWED", moduleId: mod.id, active: true },
      include: { versions: { where: { active: true }, orderBy: { version: "desc" }, take: 1 } },
    });
    const ranges = [
      { label: "Слабо", minAz: Math.min(3, maxAz), maxAz: Math.min(4, maxAz), sortOrder: 0 },
      { label: "Средне", minAz: Math.min(5, maxAz), maxAz: Math.min(7, maxAz), sortOrder: 1 },
      { label: "Хорошо", minAz: Math.min(8, maxAz), maxAz, sortOrder: 2 },
    ].filter((r) => r.minAz <= r.maxAz && r.maxAz > 0);

    if (!existing) {
      await az.createRewardRule({
        actionType: "ASSIGNMENT_REVIEWED",
        scopeType: "MODULE",
        courseId: mod.courseId,
        moduleId: mod.id,
        name: `${mod.title} — задание`,
        maxAz,
        allowsPartial: true,
        allowsRepeat: false,
        qualityDependent: true,
        qualityRanges: ranges.length
          ? ranges
          : [{ label: "Базовый", minAz: 0, maxAz, sortOrder: 0 }],
        createdById: admin.id,
      });
    } else {
      await az.publishRewardRuleVersion({
        ruleId: existing.id,
        maxAz,
        allowsPartial: true,
        allowsRepeat: false,
        qualityDependent: true,
        qualityRanges: ranges.length
          ? ranges
          : [{ label: "Базовый", minAz: 0, maxAz, sortOrder: 0 }],
        applyMode: "FUTURE_ONLY",
        createdById: admin.id,
        note: "Inline admin edit",
      });
    }
  }

  revalidatePath("/academy");
  revalidatePath(`/academy/${input.moduleSlug}`);
  revalidatePath(`/academy/${input.moduleSlug}/assessment`);
  if (input.lessonId) {
    const lesson = await prisma.lesson.findUnique({ where: { id: input.lessonId } });
    if (lesson) revalidatePath(`/academy/${input.moduleSlug}/${lesson.slug}`);
  }
}

export async function runFinalRankingAction() {
  await requireAdmin();

  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
  await az.determineFinalStatus({
    graduatedUserIds: students.map((s) => s.id),
  });

  revalidatePath("/admin/az");
  revalidatePath("/leaderboard");
}

export async function getPublicRewardPreview(params: {
  actionType:
    | "LESSON_COMPLETED"
    | "QUIZ_COMPLETED"
    | "ASSIGNMENT_REVIEWED"
    | "SIMULATION_COMPLETED"
    | "FINAL_SIMULATION"
    | "CERTIFICATION"
    | "CUSTOM";
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
}) {
  await requireUser();
  const rule = await az.getActiveRuleForAction(params);
  if (!rule) return null;
  const version = rule.versions[0];
  return {
    ruleName: rule.name,
    maxAz: version.maxAz,
    allowsPartial: version.allowsPartial,
    allowsRepeat: version.allowsRepeat,
    qualityDependent: version.qualityDependent,
    qualityRanges: version.ranges,
  };
}
