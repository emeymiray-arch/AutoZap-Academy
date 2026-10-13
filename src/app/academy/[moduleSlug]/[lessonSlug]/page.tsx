import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LessonPlayer } from "@/components/learning/lesson-player";
import { isLessonUnlocked } from "@/app/actions/learning";
import { prisma } from "@server/db";
import { requireUser } from "@server/auth/session";
import { createAZService } from "@server/az/az-service";
import type { CheckpointState } from "@/components/learning/block-renderer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ moduleSlug: string; lessonSlug: string }> };

export default async function LessonPage({ params }: Props) {
  const user = await requireUser();
  const { moduleSlug, lessonSlug } = await params;

  if (lessonSlug === "assessment") {
    redirect(`/academy/${moduleSlug}/assessment`);
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      slug: lessonSlug,
      status: "PUBLISHED",
      module: { slug: moduleSlug },
    },
    include: {
      module: {
        include: {
          lessons: { where: { status: "PUBLISHED" }, orderBy: { position: "asc" } },
          assessment: true,
        },
      },
    },
  });
  if (!lesson) notFound();

  if (lesson.module.status !== "PUBLISHED") {
    redirect("/academy");
  }

  const unlocked = await isLessonUnlocked(user.id, lesson.moduleId, lesson.position);
  if (!unlocked) {
    redirect(`/academy/${moduleSlug}`);
  }

  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
  });

  const lessons = lesson.module.lessons;
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;

  const az = createAZService(prisma);
  const rewardRule = await az.getActiveRuleForAction({
    actionType: "LESSON_COMPLETED",
    courseId: lesson.module.courseId,
    moduleId: lesson.moduleId,
    lessonId: lesson.id,
  });
  const lessonRewardAz = rewardRule?.versions[0]?.maxAz ?? null;
  const estimatedMinutes = Math.max(lesson.estimatedMinutes ?? 0, 6);

  return (
    <AppShell user={user} title={lesson.title} hideTitle>
      <LessonPlayer
        moduleSlug={moduleSlug}
        moduleTitle={lesson.module.title}
        modulePosition={lesson.module.position}
        lessonSlug={lesson.slug}
        lessonTitle={lesson.title}
        lessonPosition={lesson.position}
        lessonCount={lessons.length}
        estimatedMinutes={estimatedMinutes}
        lessonRewardAz={lessonRewardAz}
        isAdmin={user.role === "ADMIN"}
        lessonId={lesson.id}
        moduleId={lesson.moduleId}
        content={lesson.content}
        initialCheckpoint={(progress?.checkpoint as CheckpointState) ?? {}}
        completed={progress?.status === "COMPLETED"}
        prevSlug={prev?.slug ?? null}
        nextSlug={next?.slug ?? null}
        nextIsAssessment={!next && Boolean(lesson.module.assessment)}
      />
    </AppShell>
  );
}
