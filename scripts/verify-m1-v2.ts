import { PrismaClient } from "@prisma/client";
import { parseLessonContent, requiredKnowledgeCheckIds } from "../src/lib/lesson-content";

async function main() {
  const prisma = new PrismaClient();
  try {
    const lessons = await prisma.lesson.findMany({
      where: { module: { slug: "module-1" }, status: "PUBLISHED" },
      orderBy: { position: "asc" },
      select: {
        slug: true,
        title: true,
        position: true,
        estimatedMinutes: true,
        content: true,
      },
    });
    console.log(
      "published lessons:",
      lessons.map((l) => `${l.position}. ${l.slug} — ${l.title} (~${l.estimatedMinutes}м)`),
    );
    for (const l of lessons) {
      const content = parseLessonContent(l.content);
      const kcs = requiredKnowledgeCheckIds(content);
      if (kcs.length < 1) throw new Error(`${l.slug}: missing knowledge check`);
      console.log(`  ${l.slug}: ${content.length} blocks, kc=${kcs.length}`);
    }
    if (lessons.length !== 8) throw new Error(`Expected 8 lessons, got ${lessons.length}`);
    console.log("OK");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
