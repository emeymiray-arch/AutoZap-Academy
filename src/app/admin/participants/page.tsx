import { AppShell } from "@/components/layout/app-shell";
import { createParticipantAction } from "@/app/actions/auth";
import { requireAdmin, initials } from "@server/auth/session";
import { prisma } from "@server/db";
import { formatAz } from "@/lib/utils";
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
      subtitle="Только администратор создаёт профили. Каждый участник входит в свой личный кабинет."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <section className="az-glass-strong p-5">
          <h2
            className="mb-4 text-lg font-bold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Создать участника
          </h2>
          <form action={createParticipantAction} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Имя
              <input name="name" required className="az-input az-input-rect mt-2" placeholder="Иван Петров" />
            </label>
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Email
              <input
                name="email"
                type="email"
                required
                className="az-input az-input-rect mt-2"
                placeholder="ivan@autozap.academy"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              О себе (необязательно)
              <textarea
                name="about"
                rows={3}
                className="az-input az-input-rect mt-2"
                placeholder="Краткое описание"
              />
            </label>
            <button type="submit" className="az-btn az-btn-accent w-full">
              Создать профиль
            </button>
          </form>
        </section>

        <section className="az-glass-strong overflow-hidden p-2 sm:p-4">
          <h2
            className="mb-3 px-2 text-lg font-bold"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Список участников ({students.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="az-table min-w-[520px]">
              <thead>
                <tr>
                  <th>Участник</th>
                  <th>AZ</th>
                  <th>Уровень</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const archived = s.about?.startsWith("[ARCHIVED]");
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="az-brand-grad grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white">
                            {initials(s.name)}
                          </span>
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-xs text-[var(--muted)]">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="tabular-nums font-semibold">
                        {formatAz(s.azBalance?.balance ?? 0)}
                      </td>
                      <td>
                        <span className={`az-badge ${archived ? "az-badge-muted" : "az-badge-info"}`}>
                          {archived ? "Архив" : (s.azBalance?.level?.name ?? "—")}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/participants/${s.id}`}
                          className="text-sm font-semibold text-[var(--accent-deep)]"
                        >
                          Профиль
                        </Link>
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
