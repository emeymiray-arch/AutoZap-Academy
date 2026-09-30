"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAZService } from "@server/az/az-service";
import { prisma } from "@server/db";

const az = createAZService(prisma);

function requireAdmin(role: string) {
  if (role !== "ADMIN") {
    throw new Error("Forbidden: ADMIN only");
  }
}

export async function getStudentAzDashboard(userId: string) {
  const summary = await az.getStudentAZSummary(userId);
  const history = await az.getAZHistory(userId);
  return { summary, history };
}

export async function getAdminAzOverview() {
  const rules = await az.listRewardRules();
  const levels = await az.listLevelRules();
  const tieBreaks = await prisma.rankingTieBreakRule.findMany({
    orderBy: { priority: "asc" },
  });
  const students = await prisma.userAzBalance.findMany({
    include: { user: true, level: true },
    orderBy: { balance: "desc" },
  });
  const modules = await prisma.module.findMany({
    include: { course: true, lessons: true },
    orderBy: { position: "asc" },
  });

  const moduleMaximums = await Promise.all(
    modules.map(async (m) => ({
      module: m,
      maximum: await az.calculateModuleMaximum(m.id),
    })),
  );

  return { rules, levels, tieBreaks, students, moduleMaximums };
}

const publishSchema = z.object({
  ruleId: z.string(),
  maxAz: z.coerce.number().int().nonnegative(),
  allowsPartial: z.coerce.boolean(),
  allowsRepeat: z.coerce.boolean(),
  qualityDependent: z.coerce.boolean(),
  applyMode: z.enum(["FUTURE_ONLY", "RECALCULATE_EXISTING"]),
  note: z.string().optional(),
  adminId: z.string(),
});

export async function publishAzRuleVersionAction(formData: FormData) {
  const parsed = publishSchema.parse({
    ruleId: formData.get("ruleId"),
    maxAz: formData.get("maxAz"),
    allowsPartial: formData.get("allowsPartial") === "on" || formData.get("allowsPartial") === "true",
    allowsRepeat: formData.get("allowsRepeat") === "on" || formData.get("allowsRepeat") === "true",
    qualityDependent:
      formData.get("qualityDependent") === "on" || formData.get("qualityDependent") === "true",
    applyMode: formData.get("applyMode"),
    note: formData.get("note") || undefined,
    adminId: formData.get("adminId"),
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { id: parsed.adminId } });
  requireAdmin(admin.role);

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
  adminId: z.string(),
});

export async function createAzRewardRuleAction(input: z.infer<typeof createRuleSchema>) {
  const parsed = createRuleSchema.parse(input);
  const admin = await prisma.user.findUniqueOrThrow({ where: { id: parsed.adminId } });
  requireAdmin(admin.role);

  await az.createRewardRule({
    ...parsed,
    createdById: admin.id,
  });

  revalidatePath("/admin/az");
}

export async function setModuleMaxOverrideAction(formData: FormData) {
  const adminId = String(formData.get("adminId"));
  const moduleId = String(formData.get("moduleId"));
  const useOverride = formData.get("useOverride") === "on";
  const overrideRaw = formData.get("override");
  const override =
    overrideRaw === null || overrideRaw === "" ? null : Number.parseInt(String(overrideRaw), 10);

  const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId } });
  requireAdmin(admin.role);

  await az.setModuleMaximumOverride(moduleId, override, useOverride);
  revalidatePath("/admin/az");
}

export async function runFinalRankingAction(formData: FormData) {
  const adminId = String(formData.get("adminId"));
  const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId } });
  requireAdmin(admin.role);

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
