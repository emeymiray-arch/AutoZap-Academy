import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.azRewardRule.findMany({
    where: { actionType: "LESSON_COMPLETED" },
    include: { versions: { where: { active: true }, take: 1 } },
  });
  const lessons = await prisma.lesson.findMany({
    where: { module: { slug: "module-1" } },
    select: { id: true, slug: true, title: true },
    orderBy: { position: "asc" },
  });
  console.log(
    JSON.stringify(
      {
        lessonCount: lessons.length,
        ruleCount: rules.length,
        lessons: lessons.map((l) => ({ slug: l.slug, id: l.id })),
        rules: rules.map((r) => ({
          name: r.name,
          lessonId: r.lessonId,
          active: r.active,
          maxAz: r.versions[0]?.maxAz,
        })),
      },
      null,
      2,
    ),
  );
}

main().finally(() => prisma.$disconnect());
