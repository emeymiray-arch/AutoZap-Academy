import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@server/auth/session";
import { prisma } from "@server/db";
import { displayName } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function AdminLessonProgressPage() {
  const admin = await requireAdmin();

  const [course, students, progress] = await Promise.all([
    prisma.course.findFirst({
      include: {
        modules: {
          where: { status: "PUBLISHED" },
          orderBy: { position: "asc" },
          include: {
            lessons: { where: { status: "PUBLISHED" }, orderBy: { position: "asc" } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", NOT: { about: { startsWith: "[ARCHIVED]" } } },
      select: { id: true, name: true, nickname: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.lessonProgress.findMany({
      where: { status: "COMPLETED", completionCount: { gt: 0 } },
      select: {
        userId: true,
        lessonId: true,
        completionCount: true,
        lastCompletedAt: true,
        completedAt: true,
      },
    }),
  ]);

  const byLesson = new Map<string, Map<string, (typeof progress)[number]>>();
  for (const row of progress) {
    let map = byLesson.get(row.lessonId);
    if (!map) {
      map = new Map();
      byLesson.set(row.lessonId, map);
    }
    map.set(row.userId, row);
  }

  const modules = course?.modules ?? [];

  return (
    <AppShell user={admin} title="Прохождения уроков">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/participants" className="text-sm font-semibold text-[var(--cyan)] hover:underline">
          ← Участники
        </Link>
        <p className="text-xs font-semibold text-[var(--muted)]">
          Сколько раз каждый ученик завершил конкретный урок
        </p>
      </div>

      {modules.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line-strong)] p-6 text-sm font-bold text-[var(--muted)]">
          Пока нет опубликованных модулей.
        </p>
      ) : (
        <div className="space-y-8">
          {modules.map((mod) => (
            <section key={mod.id} className="space-y-4">
              <h2
                className="text-lg font-black text-[var(--text)]"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Модуль {mod.position}. {mod.title}
              </h2>

              <div className="space-y-5">
                {mod.lessons.map((lesson) => {
                  const rows = students
                    .map((s) => {
                      const p = byLesson.get(lesson.id)?.get(s.id);
                      return {
                        student: s,
                        count: p?.completionCount ?? 0,
                        last: p?.lastCompletedAt ?? p?.completedAt ?? null,
                      };
                    })
                    .sort((a, b) => b.count - a.count || displayName(a.student).localeCompare(displayName(b.student), "ru"));

                  const doneStudents = rows.filter((r) => r.count > 0).length;

                  return (
                    <article
                      key={lesson.id}
                      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_4px_16px_rgba(15,40,80,0.04)]"
                    >
                      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                            Урок {lesson.position}
                          </p>
                          <h3 className="text-base font-bold text-[var(--text)]">{lesson.title}</h3>
                        </div>
                        <p className="text-xs font-semibold tabular-nums text-[var(--muted)]">
                          Прошли {doneStudents} из {students.length}
                        </p>
                      </header>

                      <div className="w-full overflow-x-auto">
                        <table className="az-table w-full min-w-[28rem] text-sm">
                          <thead>
                            <tr>
                              <th>Ученик</th>
                              <th className="text-right">Раз</th>
                              <th className="text-right">Последний раз</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map(({ student, count, last }) => (
                              <tr key={student.id} className={count === 0 ? "opacity-55" : undefined}>
                                <td>
                                  <Link
                                    href={`/admin/participants/${student.id}/review`}
                                    className="font-semibold text-[var(--text)] hover:text-[var(--cyan)] hover:underline"
                                  >
                                    {displayName(student)}
                                  </Link>
                                  <p className="text-[0.65rem] font-medium text-[var(--muted)]">{student.email}</p>
                                </td>
                                <td className="text-right tabular-nums font-bold">
                                  {count > 0 ? `${count}×` : "—"}
                                </td>
                                <td className="text-right text-xs font-semibold text-[var(--muted)]">
                                  {last ? last.toLocaleString("ru-RU") : "—"}
                                </td>
                              </tr>
                            ))}
                            {students.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="text-[var(--muted)]">
                                  Нет участников
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
