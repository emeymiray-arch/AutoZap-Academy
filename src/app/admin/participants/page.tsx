import { AppShell } from "@/components/layout/app-shell";
import { CreateParticipantForm } from "@/components/admin/create-participant-form";
import { requireAdmin } from "@server/auth/session";
import { prisma } from "@server/db";
import { formatAz } from "@/lib/utils";
import { displayName, initials } from "@/lib/user";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage() {
  const admin = await requireAdmin();

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { azBalance: { include: { level: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      user={admin}
      title="Участники"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <section>
          <h2 className="mb-3 text-base font-bold">Создать участника</h2>
          <CreateParticipantForm />
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold">Список ({students.length})</h2>
          <div className="w-full max-w-full overflow-x-auto">
            <table className="az-table w-full min-w-0 text-sm sm:min-w-[480px]">
              <thead>
                <tr>
                  <th>Участник</th>
                  <th>AZ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const archived = s.about?.startsWith("[ARCHIVED]");
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
                        <Link
                          href={`/participants/${s.id}`}
                          className="text-xs text-[var(--cyan)] hover:underline"
                        >
                          Профиль
                        </Link>
                        {archived ? (
                          <span className="ml-2 az-badge az-badge-muted">архив</span>
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
