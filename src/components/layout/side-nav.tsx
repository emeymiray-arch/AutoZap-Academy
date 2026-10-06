"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  History,
  Users,
  Settings2,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const nav: NavItem[] = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/academy", label: "Академия", icon: BookOpen },
  { href: "/az-history", label: "История AZ", icon: History },
  { href: "/leaderboard", label: "Рейтинг", icon: Trophy },
  { href: "/profile", label: "Мой профиль", icon: UserRound },
  { href: "/admin/participants", label: "Участники", icon: Users, adminOnly: true },
  { href: "/admin/az", label: "AZ CMS", icon: Settings2, adminOnly: true },
];

export function SideNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = nav.filter((item) => !item.adminOnly || role === "ADMIN");

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
              active
                ? "border border-[rgba(3,205,253,0.35)] bg-[rgba(3,205,253,0.16)] text-white shadow-[0_0_24px_rgba(3,205,253,0.25)]"
                : "text-[var(--muted)] hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
