import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand/logo";
import { SideNav } from "@/components/layout/side-nav";
import { logoutAction } from "@/app/actions/auth";
import { initials, type SessionUser } from "@server/auth/session";
import { Bell } from "lucide-react";

export function AppShell({
  children,
  title,
  subtitle,
  user,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  user: SessionUser;
}) {
  const roleLabel =
    user.role === "ADMIN" ? "Администратор" : user.role === "SUPERVISOR" ? "Супервизор" : "Участник";

  return (
    <div className="min-h-screen p-3 sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1400px] gap-4">
        <aside className="az-glass-strong sticky top-5 hidden h-[calc(100vh-2.5rem)] w-[var(--sidebar-w)] shrink-0 flex-col p-4 md:flex">
          <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-1">
            <BrandMark size={42} />
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--accent-deep)]">
                AutoZap
              </p>
              <p
                className="text-lg font-extrabold leading-none text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Academy
              </p>
            </div>
          </Link>

          <SideNav role={user.role} />

          <div className="mt-auto space-y-3 pt-6">
            {user.role === "ADMIN" ? (
              <div className="az-brand-grad rounded-2xl p-4 text-white">
                <p className="text-sm font-bold">Admin Panel</p>
                <p className="mt-1 text-xs text-white/85">
                  Создавайте профили участников и управляйте AZ.
                </p>
                <Link
                  href="/admin/participants"
                  className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur"
                >
                  Участники →
                </Link>
              </div>
            ) : null}

            <form action={logoutAction}>
              <button type="submit" className="az-btn az-btn-ghost w-full text-sm">
                Выйти
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="az-glass flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3 md:max-w-md">
              <BrandMark size={36} className="md:hidden" />
              <div className="hidden w-full rounded-full border border-white/70 bg-white/55 px-4 py-2 text-sm text-[var(--muted)] sm:block">
                Поиск по Академии…
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/60 text-[var(--muted)]"
                aria-label="Уведомления"
              >
                <Bell className="h-4 w-4" />
              </button>
              <Link href="/profile" className="flex items-center gap-3 rounded-full bg-white/55 py-1.5 pl-1.5 pr-3">
                <span className="az-brand-grad grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white">
                  {initials(user.name)}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-semibold text-[var(--ink)]">{user.name}</span>
                  <span className="block text-[0.7rem] text-[var(--muted)]">{roleLabel}</span>
                </span>
              </Link>
            </div>
          </header>

          {/* mobile nav */}
          <div className="az-glass px-3 py-2 md:hidden">
            <SideNav role={user.role} />
          </div>

          <main className="az-glass flex-1 p-5 sm:p-7">
            <div className="az-rise mb-7 max-w-3xl">
              <h1
                className="text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="az-rise-delay">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
