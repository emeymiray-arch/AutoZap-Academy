import type { ReactNode } from "react";
import Link from "next/link";
import { TopNav } from "@/components/layout/top-nav";

export function AppShell({
  children,
  title,
  subtitle,
  eyebrow,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden bg-[var(--ink)] text-white">
        <div className="az-lane pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Link href="/dashboard" className="group block">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                Corporate Learning
              </p>
              <h1
                className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                AutoZap <span className="text-[var(--accent)]">Academy</span>
              </h1>
            </Link>
            <p className="max-w-xs text-right text-xs leading-relaxed text-white/55">
              Система обучения менеджеров. Прогресс, практика, аттестация.
            </p>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--paper-2)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <TopNav />
          <Link
            href="/profile"
            className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)] hover:text-[var(--ink)] sm:inline"
          >
            Профиль
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="az-rise mb-10 max-w-3xl">
          {eyebrow ? (
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="az-rise-delay">{children}</div>
      </main>
    </div>
  );
}
