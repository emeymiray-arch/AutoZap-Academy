import type { ReactNode } from "react";
import Link from "next/link";
import { TopNav } from "@/components/layout/top-nav";
import { BrandMark } from "@/components/brand/logo";

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
      <header className="bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3.5">
            <BrandMark size={52} />
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                AutoZap
              </p>
              <h1
                className="text-[1.55rem] font-extrabold leading-none tracking-tight text-[var(--ink)] sm:text-3xl"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Academy
              </h1>
            </div>
          </Link>
          <p className="hidden max-w-xs text-right text-xs leading-relaxed text-[var(--muted)] sm:block">
            Система обучения менеджеров. Прогресс, практика, аттестация.
          </p>
        </div>
        <div className="az-brand-bar" />
      </header>

      <div className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/90 backdrop-blur-md">
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
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[var(--accent-deep)]">
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
