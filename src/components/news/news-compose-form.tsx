"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createNewsAction, type ActionState } from "@/app/actions/social";

const empty: ActionState = {};

export function NewsComposeForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createNewsAction, empty);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border border-[var(--cyan)]/40 bg-[rgba(3,205,253,0.14)] px-2.5 py-1 text-xs font-bold text-[var(--cyan)] shadow-[0_0_16px_rgba(3,205,253,0.2)] transition hover:bg-[rgba(3,205,253,0.22)]"
      >
        <Plus className="h-3.5 w-3.5" />
        Новость
      </button>

      {open ? (
        <form
          action={action}
          className="absolute left-0 top-full z-20 mt-2 w-[min(100vw-2rem,22rem)] space-y-2 rounded-2xl border border-white/70 bg-white p-3 text-black shadow-[0_12px_40px_rgba(3,205,253,0.25)]"
        >
          <input
            name="title"
            required
            placeholder="Заголовок"
            className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-sm font-semibold text-black outline-none focus:border-[var(--cyan)]"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Текст новости…"
            className="w-full resize-none rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-black outline-none focus:border-[var(--cyan)]"
          />
          {state.error ? <p className="text-xs font-semibold text-rose-600">{state.error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[var(--cyan)] px-3 py-1.5 text-xs font-bold text-black"
            >
              {pending ? "…" : "Опубликовать"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-black/60"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
