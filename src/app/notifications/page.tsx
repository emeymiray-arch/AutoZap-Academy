import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationPrefsForm } from "@/components/notifications/prefs-form";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { requireUser } from "@server/auth/session";
import { prisma } from "@server/db";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();

  const [prefs, items] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        notifyChat: true,
        notifyNews: true,
        notifyActivity: true,
        notifyAz: true,
      },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <AppShell
      user={user}
      title="Notifications"
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        {unread > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="text-xs text-[var(--cyan)] hover:underline">
              Mark all read
            </button>
          </form>
        ) : null}
      </div>

      <ul className="mb-6 divide-y divide-white/10">
        {items.map((n) => (
          <li key={n.id} className={`py-3 ${n.readAt ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {n.href ? (
                  <Link href={n.href} className="text-sm font-semibold text-white hover:text-[var(--cyan)]">
                    {n.title}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                )}
                <p className="mt-0.5 text-xs text-white/80">{n.body}</p>
                <p className="mt-1 text-[0.6rem] text-[var(--muted)]">
                  {n.createdAt.toLocaleString("ru-RU")}
                </p>
              </div>
              {!n.readAt ? (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" className="text-[0.65rem] text-[var(--cyan)]">
                    Read
                  </button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="py-4 text-sm text-[var(--muted)]">No notifications yet</li>
        ) : null}
      </ul>

      <NotificationPrefsForm
        notifyChat={prefs.notifyChat}
        notifyNews={prefs.notifyNews}
        notifyActivity={prefs.notifyActivity}
        notifyAz={prefs.notifyAz}
      />
    </AppShell>
  );
}
