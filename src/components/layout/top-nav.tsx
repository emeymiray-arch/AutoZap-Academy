"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Главная" },
  { href: "/academy", label: "Академия" },
  { href: "/az-history", label: "AZ" },
  { href: "/leaderboard", label: "Рейтинг" },
  { href: "/admin/az", label: "Admin" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-3 py-2 text-sm font-medium tracking-wide transition-colors",
              active ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]",
            )}
          >
            {item.label}
            {active ? (
              <span className="absolute inset-x-3 -bottom-[1px] h-[2px] bg-[var(--accent)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
