import { loginAsUserAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand/logo";
import { prisma } from "@server/db";
import { getCurrentUser } from "@server/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const current = await getCurrentUser();
  if (current) {
    redirect(current.role === "ADMIN" ? "/admin/participants" : "/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true },
  });

  const admins = users.filter((u) => u.role === "ADMIN");
  const students = users.filter((u) => u.role === "STUDENT");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="az-glass-strong w-full max-w-lg p-7 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <BrandMark size={52} />
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--accent-deep)]">
              AutoZap Academy
            </p>
            <h1
              className="text-2xl font-extrabold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Вход
            </h1>
          </div>
        </div>

        <p className="mb-6 text-sm text-[var(--muted)]">
          Профили участников создаёт администратор. Выберите свой аккаунт, чтобы открыть личный
          кабинет.
        </p>

        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            Администратор
          </h2>
          <div className="space-y-2">
            {admins.map((user) => (
              <form key={user.id} action={loginAsUserAction}>
                <input type="hidden" name="userId" value={user.id} />
                <button type="submit" className="az-btn az-btn-accent w-full justify-between">
                  <span>{user.name}</span>
                  <span className="text-xs opacity-80">Admin</span>
                </button>
              </form>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            Участники
          </h2>
          <div className="space-y-2">
            {students.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Пока нет участников. Войдите как Admin.</p>
            ) : (
              students.map((user) => (
                <form key={user.id} action={loginAsUserAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button type="submit" className="az-btn az-btn-ghost w-full justify-between">
                    <span className="text-left">
                      <span className="block font-semibold">{user.name}</span>
                      <span className="block text-xs text-[var(--muted)]">{user.email}</span>
                    </span>
                    <span className="az-badge az-badge-info">Участник</span>
                  </button>
                </form>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
