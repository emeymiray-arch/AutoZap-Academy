"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  UserRound,
  MessageCircle,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { BrandMark } from "@/components/brand/logo";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { logoutAction } from "@/app/actions/auth";
import { displayName, initials } from "@/lib/user";

export type ShellUser = {
  id: string;
  email: string;
  name: string;
  nickname?: string | null;
  role: Role;
  avatarUrl?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: ComponentType<{ className?: string }>;
};

const nav: NavItem[] = [
  { href: "/dashboard", label: "Главная", short: "Дом", icon: LayoutDashboard },
  { href: "/academy", label: "Академия", short: "Курс", icon: BookOpen },
  { href: "/activity", label: "Активность", short: "Лента", icon: Sparkles },
  { href: "/chats", label: "Чаты", short: "Чаты", icon: MessageCircle },
  { href: "/leaderboard", label: "Рейтинг", short: "Топ", icon: Trophy },
  { href: "/profile", label: "Профиль", short: "Я", icon: UserRound },
];

export function AppShell({
  children,
  title,
  subtitle,
  user,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  user: ShellUser;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const items = nav;

  return (
    <div className="w-full max-w-[100vw] min-w-0 overflow-x-clip p-2 sm:p-4">
      <div className="mx-auto flex w-full min-w-0 max-w-[1400px] gap-2 sm:gap-3 md:min-h-[calc(100vh-2rem)]">
        <aside
          className={cn(
            "az-glass-strong az-glass-glow sticky top-2 hidden h-[calc(100vh-2rem)] shrink-0 flex-col transition-all duration-300 md:flex",
            expanded ? "w-[220px] p-3" : "w-[68px] items-center p-2",
          )}
        >
          <div className={cn("mb-4 flex items-center", expanded ? "justify-between px-1" : "flex-col gap-2")}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <BrandMark size={expanded ? 36 : 32} />
              {expanded ? (
                <p
                  className="truncate text-sm font-extrabold tracking-tight text-[var(--text)]"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  AutoZap Academy
                </p>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]"
              aria-label={expanded ? "Свернуть" : "Развернуть"}
            >
              {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
          </div>

          <nav className={cn("flex flex-1 flex-col gap-1", !expanded && "items-center")}>
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex items-center rounded-xl text-sm font-medium transition",
                    expanded ? "gap-2.5 px-3 py-2" : "h-10 w-10 justify-center",
                    active
                      ? "border border-[rgba(3,205,253,0.35)] bg-[rgba(3,205,253,0.16)] text-[var(--text)] shadow-[0_0_20px_rgba(3,205,253,0.25)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {expanded ? item.label : null}
                </Link>
              );
            })}
          </nav>

          <form action={logoutAction} className={cn("mt-auto pt-3", !expanded && "flex justify-center")}>
            <button
              type="submit"
              title="Выйти"
              className={cn(
                "flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]",
                expanded ? "w-full gap-2 px-3 py-2 text-sm" : "h-10 w-10 justify-center",
              )}
            >
              <LogOut className="h-4 w-4" />
              {expanded ? "Выйти" : null}
            </button>
          </form>
        </aside>

        <div className="flex min-w-0 w-full flex-1 flex-col gap-2 overflow-x-clip sm:gap-3">
          <header className="az-glass flex w-full min-w-0 items-center justify-between gap-2 px-3 py-2">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
              <BrandMark size={28} />
              <span
                className="min-w-0 truncate text-sm font-extrabold tracking-tight text-[var(--text)] sm:text-base"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                AutoZap Academy
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <NotificationsBell />
              <Link
                href="/profile"
                className="flex max-w-[50vw] items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] py-1 pl-1 pr-2"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="az-brand-grad grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold text-white">
                    {initials(displayName(user))}
                  </span>
                )}
                <span className="hidden truncate text-sm font-semibold text-[var(--text)] sm:block">
                  {displayName(user)}
                </span>
              </Link>
            </div>
          </header>

          {/* Mobile icons on top — one compact row */}
          <nav className="az-glass flex w-full min-w-0 items-center justify-between gap-0 px-1 py-1 md:hidden">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-[0.55rem]",
                    active
                      ? "bg-[rgba(3,205,253,0.16)] text-[var(--text)]"
                      : "text-[var(--muted)]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="w-full truncate text-center leading-none">{item.short}</span>
                </Link>
              );
            })}
          </nav>

          <main className="min-w-0 w-full flex-1 overflow-x-clip px-0.5 py-1 sm:px-2 sm:py-3">
            <div className="az-rise mb-3 min-w-0 sm:mb-4">
              <h1
                className="break-words text-xl font-extrabold tracking-tight text-[var(--text)] sm:text-2xl"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 break-words text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="az-rise-delay min-w-0 w-full overflow-x-clip">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
