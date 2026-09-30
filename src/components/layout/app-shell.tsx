import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/dashboard", label: "Главная" },
  { href: "/academy", label: "Академия" },
  { href: "/az-history", label: "История AZ" },
  { href: "/leaderboard", label: "Рейтинг" },
  { href: "/admin/az", label: "Admin AZ" },
];

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 flex-col gap-6 md:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--az-accent)]">
              AutoZap
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Academy</h1>
          </div>
          <nav className="flex flex-col gap-1">
            {studentNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm text-[var(--az-muted)] transition",
                  "hover:bg-[var(--az-surface)] hover:text-[var(--az-text)]",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="mb-8 border-b border-[var(--az-border)] pb-6">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm text-[var(--az-muted)]">{subtitle}</p>
            ) : null}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
