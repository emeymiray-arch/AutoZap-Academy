"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getUnreadNotificationCount } from "@/app/actions/notifications";

export function NotificationsBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    getUnreadNotificationCount()
      .then((n) => {
        if (alive) setCount(n);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-[var(--muted)] hover:text-white"
      aria-label="Notifications"
      title="Notifications"
    >
      <Bell className="h-4 w-4" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[1rem] place-items-center rounded-full bg-[var(--cyan)] px-1 text-[0.55rem] font-bold text-black">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
