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
