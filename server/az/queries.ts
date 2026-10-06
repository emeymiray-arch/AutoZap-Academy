import { createAZService } from "@server/az/az-service";
import { prisma } from "@server/db";

const az = createAZService(prisma);

/** Server-only AZ reads — not exported from "use server" (not callable as actions). */
export async function loadStudentAzDashboard(userId: string) {
  const summary = await az.getStudentAZSummary(userId);
  const history = await az.getAZHistory(userId);
  return { summary, history };
}

export async function loadAdminAzOverview() {
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
