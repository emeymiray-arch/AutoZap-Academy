"use client";

import { useActionState } from "react";
import { createParticipantAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export function CreateParticipantForm() {
  const [state, action, pending] = useActionState(createParticipantAction, initial);

  return (
    <form action={action} className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        Имя
        <input name="name" required className="az-input az-input-rect mt-1.5" placeholder="Иван Петров" />
      </label>
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        Email
        <input
          name="email"
          type="email"
          required
          className="az-input az-input-rect mt-1.5"
          placeholder="ivan@autozap.academy"
        />
      </label>
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        О себе (необязательно)
        <textarea name="about" rows={2} className="az-input az-input-rect mt-1.5" />
      </label>
      {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      {state.tempPassword ? (
        <div className="rounded-xl border border-[rgba(3,205,253,0.35)] bg-[rgba(3,205,253,0.12)] p-3 text-sm">
          <p className="font-semibold text-white">Временный пароль (передайте участнику):</p>
          <p className="mt-1 font-mono text-lg text-[var(--cyan)]">{state.tempPassword}</p>
        </div>
      ) : null}
      <button type="submit" disabled={pending} className="az-btn az-btn-accent w-full text-sm">
        {pending ? "Создание…" : "Создать профиль"}
      </button>
    </form>
  );
}
