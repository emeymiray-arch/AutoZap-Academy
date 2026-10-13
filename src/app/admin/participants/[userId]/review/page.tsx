import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ReviewSubmissionForm } from "@/components/admin/review-submission-form";
import { requireAdmin } from "@server/auth/session";
import { prisma } from "@server/db";
import { displayName } from "@/lib/user";
import { formatAz } from "@/lib/utils";
import { Check, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ userId: string }> };

export default async function ParticipantReviewPage({ params }: Props) {
  const admin = await requireAdmin();
  const { userId } = await params;

  const student = await prisma.user.findFirst({
    where: { id: userId, role: "STUDENT" },
    include: { azBalance: true },
  });
  if (!student) notFound();

  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      userId,
      status: { in: ["SUBMITTED", "IN_REVIEW", "APPROVED", "REVISION_REQUIRED", "REJECTED"] },
    },
    include: {
      assignment: { include: { module: { select: { title: true, slug: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId },
    include: { assessment: { include: { module: { select: { title: true, slug: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <AppShell user={admin} title={`Ответы · ${displayName(student)}`}>
      <div className="mb-4">
        <Link href="/admin/participants" className="text-sm font-black text-[var(--muted)] hover:text-[var(--text)]">
          ← Участники
        </Link>
      </div>

      <header className="mb-6 space-y-1">
        <h1
          className="text-2xl font-black text-[var(--text)]"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {displayName(student)}
        </h1>
        <p className="text-sm font-bold text-[var(--muted)]">
          {student.email} · баланс {formatAz(student.azBalance?.balance ?? 0)}
        </p>
      </header>

      {submissions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line-strong)] p-6 text-sm font-bold text-[var(--muted)]">
          Пока нет ответов на проверку куратора.
        </p>
      ) : (
        <div className="space-y-8">
          {submissions.map((sub) => {
            const reviewed = sub.reviewedAt != null;
            return (
              <section key={sub.id} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black text-[var(--text)]">
                    {sub.assignment.module.title} · {sub.assignment.title}
                  </h2>
                  {reviewed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">
                      <Check className="h-3.5 w-3.5" /> Оценено · {sub.awardedAz ?? 0} AZ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900">
                      <Clock className="h-3.5 w-3.5" /> Ждёт оценки
                    </span>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-4 md:p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                    Ответ участника
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-relaxed text-[var(--text)] md:text-base">
                    {sub.content}
                  </p>
                  <p className="mt-3 text-xs font-bold text-[var(--muted)]">
                    Отправлено {sub.createdAt.toLocaleString("ru-RU")}
                  </p>
                </div>

                <ReviewSubmissionForm
                  submissionId={sub.id}
                  currentAz={sub.awardedAz}
                  currentLabel={sub.qualityLabel}
                  currentFeedback={sub.feedback}
                  minAz={3}
                  maxAz={10}
                />
              </section>
            );
          })}
        </div>
      )}

      {attempts.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-[var(--muted)]">
            Автопроверка (попытки)
          </h2>
          <ul className="space-y-2">
            {attempts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2.5 text-sm font-bold"
              >
                <span className="text-[var(--text)]">
                  {a.assessment.module.title}: {a.score}% {a.passed ? "· зачёт" : "· не зачёт"}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {a.createdAt.toLocaleString("ru-RU")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}
