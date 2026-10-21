import { AppShell } from "@/components/layout/app-shell";
import { CreateParticipantForm } from "@/components/admin/create-participant-form";
import { ParticipantPasswordControl } from "@/components/admin/participant-password-control";
import { requireAdmin } from "@server/auth/session";
import { prisma } from "@server/db";
import { formatAz } from "@/lib/utils";
import { displayName, initials } from "@/lib/user";
import Link from "next/link";
import { Check, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage() {
  const admin = await requireAdmin();

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { azBalance: { include: { level: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pending = await prisma.assignmentSubmission.groupBy({
    by: ["userId"],
    where: {
      status: { in: ["SUBMITTED", "IN_REVIEW"] },
      reviewedAt: null,
    },
    _count: { _all: true },
  });
  const reviewed = await prisma.assignmentSubmission.groupBy({
    by: ["userId"],
    where: { reviewedAt: { not: null } },
    _count: { _all: true },
  });
  const pendingByUser = new Map(pending.map((p) => [p.userId, p._count._all]));
  const reviewedByUser = new Map(reviewed.map((r) => [r.userId, r._count._all]));

  return (
    <AppShell user={admin} title="Участники">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <section>
          <h2 className="mb-3 text-base font-bold">Создать участника</h2>
          <CreateParticipantForm />
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">Список ({students.length})</h2>
          <div className="w-full max-w-full overflow-x-auto">
            <table className="az-table w-full min-w-0 text-sm sm:min-w-[520px]">
              <thead>
                <tr>
                  <th>Участник</th>
                  <th>AZ</th>
                  <th>Ответ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const archived = s.about?.startsWith("[ARCHIVED]");
                  const wait = pendingByUser.get(s.id) ?? 0;
                  const done = reviewedByUser.get(s.id) ?? 0;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {s.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.avatarUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="az-brand-grad grid h-8 w-8 place-items-center rounded-full text-[0.6rem] font-bold text-white">
                              {initials(displayName(s))}
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-semibold">{displayName(s)}</p>
                            <p className="text-[0.65rem] text-[var(--muted)]">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="tabular-nums text-sm font-semibold">
                        {formatAz(s.azBalance?.balance ?? 0)}
                      </td>
                      <td>
                        {wait > 0 ? (
                          <Link
                            href={`/admin/participants/${s.id}/review`}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[0.7rem] font-black text-amber-900 hover:bg-amber-200"
                          >
                            <Clock className="h-3 w-3" />
                            Ждёт · {wait}
                          </Link>
                        ) : done > 0 ? (
                          <Link
                            href={`/admin/participants/${s.id}/review`}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[0.7rem] font-black text-emerald-800 hover:bg-emerald-200"
                          >
                            <Check className="h-3 w-3" />
                            Оценено
                          </Link>
                        ) : (
                          <span className="text-[0.7rem] font-bold text-[var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="space-x-2 whitespace-nowrap">
                        {(wait > 0 || done > 0) && (
                          <Link
                            href={`/admin/participants/${s.id}/review`}
                            className="text-xs font-black text-[var(--cyan)] hover:underline"
                          >
                            Проверить
                          </Link>
                        )}
                        <Link
                          href={`/participants/${s.id}`}
                          className="text-xs text-[var(--cyan)] hover:underline"
                        >
                          Профиль
                        </Link>
                        <ParticipantPasswordControl userId={s.id} name={displayName(s)} />
                        {archived ? (
                          <span className="ml-1 az-badge az-badge-muted">архив</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
