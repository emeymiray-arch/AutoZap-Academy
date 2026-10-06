"use client";

import { useActionState } from "react";
import { createNewsAction, type ActionState } from "@/app/actions/social";

const empty: ActionState = {};

export function NewsComposeForm() {
  const [state, action, pending] = useActionState(createNewsAction, empty);

  return (
    <form action={action} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
      <input
        name="title"
        required
        placeholder="Заголовок"
        className="az-input az-input-rect py-2 text-sm sm:w-40"
      />
      <input
        name="body"
        required
        placeholder="Текст новости…"
        className="az-input az-input-rect flex-1 py-2 text-sm"
      />
      <button type="submit" disabled={pending} className="az-btn az-btn-accent shrink-0 text-xs">
        {pending ? "…" : "Опубликовать"}
      </button>
      {state.error ? <p className="basis-full text-[0.7rem] text-rose-300">{state.error}</p> : null}
    </form>
  );
}
