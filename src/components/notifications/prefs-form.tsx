"use client";

import { useActionState } from "react";
import {
  updateNotificationPrefsAction,
  type NotifState,
} from "@/app/actions/notifications";

const empty: NotifState = {};

export function NotificationPrefsForm({
  notifyChat,
  notifyNews,
  notifyActivity,
  notifyAz,
}: {
  notifyChat: boolean;
  notifyNews: boolean;
  notifyActivity: boolean;
  notifyAz: boolean;
}) {
  const [state, action, pending] = useActionState(updateNotificationPrefsAction, empty);

  const rows = [
    { name: "notifyNews", label: "News board", defaultChecked: notifyNews },
    { name: "notifyChat", label: "Chat messages", defaultChecked: notifyChat },
    { name: "notifyActivity", label: "Activity board", defaultChecked: notifyActivity },
    { name: "notifyAz", label: "AZ awards", defaultChecked: notifyAz },
  ] as const;

  return (
    <form action={action} className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
        Notification settings
      </p>
      <ul className="divide-y divide-white/10">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-3 py-2.5">
            <label htmlFor={row.name} className="text-sm text-white">
              {row.label}
            </label>
            <input
              id={row.name}
              name={row.name}
              type="checkbox"
              defaultChecked={row.defaultChecked}
              className="h-4 w-4 accent-[var(--cyan)]"
            />
          </li>
        ))}
      </ul>
      {state.ok ? <p className="text-xs text-emerald-300">Saved</p> : null}
      {state.error ? <p className="text-xs text-rose-300">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="az-btn az-btn-accent text-sm">
        {pending ? "…" : "Save"}
      </button>
    </form>
  );
}
