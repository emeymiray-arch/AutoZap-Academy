import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AssessmentForm } from "@/components/learning/assessment-form";
import { prisma } from "@server/db";
import { requireUser } from "@server/auth/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ moduleSlug: string }> };

export default async function AssessmentPage({ params }: Props) {
  const user = await requireUser();
  const { moduleSlug } = await params;

  const mod = await prisma.module.findFirst({
    where: { slug: moduleSlug },
    include: {
      assessment: true,
      lessons: { where: { status: "PUBLISHED" }, select: { id: true } },
    },
  });
  if (!mod?.assessment) notFound();
  if (mod.status !== "PUBLISHED") redirect("/academy");

  const completed = await prisma.lessonProgress.count({
    where: {
      userId: user.id,
      status: "COMPLETED",
      lessonId: { in: mod.lessons.map((l) => l.id) },
    },
  });
  if (completed < mod.lessons.length) {
    redirect(`/academy/${moduleSlug}`);
  }

  const latest = await prisma.assessmentAttempt.findFirst({
    where: { assessmentId: mod.assessment.id, userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const curatorSubmission = await prisma.assignmentSubmission.findFirst({
    where: {
      userId: user.id,
      assignment: { moduleId: mod.id },
      status: { in: ["SUBMITTED", "IN_REVIEW", "APPROVED", "REVISION_REQUIRED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const answersJson = latest?.answers as { freeText?: string | null } | null;
  const alreadySentToCurator = Boolean(
    curatorSubmission?.content || answersJson?.freeText,
  );

  return (
    <AppShell user={user} title={mod.assessment.title} hideTitle>
      <div className="mb-3">
        <Link
          href={`/academy/${moduleSlug}`}
          className="text-sm font-black text-[var(--muted)] hover:text-[var(--text)]"
        >
          ← {mod.title}
        </Link>
      </div>
      <AssessmentForm
        moduleSlug={moduleSlug}
        title={mod.assessment.title}
        passScore={mod.assessment.passScore}
        content={mod.assessment.content}
        previousScore={latest?.score ?? null}
        previousPassed={latest?.passed ?? null}
        alreadySentToCurator={alreadySentToCurator}
      />
    </AppShell>
  );
}
