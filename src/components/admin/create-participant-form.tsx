"use client";

import { useActionState, useState } from "react";
import { createParticipantAction, type AuthState } from "@/app/actions/auth";
import { generatePassword } from "@/lib/password-gen";

const initial: AuthState = {};

export function CreateParticipantForm() {
  const [state, action, pending] = useActionState(createParticipantAction, initial);
  const [password, setPassword] = useState("");

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
      <div>
        <label
          htmlFor="new-participant-password"
          className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]"
        >
          Пароль
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="new-participant-password"
            name="password"
            type="text"
            autoComplete="off"
            minLength={6}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="az-input az-input-rect min-w-0 flex-1 font-mono"
            placeholder="Свой пароль или сгенерировать"
          />
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            className="az-btn shrink-0 text-sm"
          >
            Сгенерировать
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Если оставить пустым, участник получит временный пароль и сменит его при первом входе.
        </p>
      </div>
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        О себе (необязательно)
        <textarea name="about" rows={2} className="az-input az-input-rect mt-1.5" />
      </label>
      {state.error ? <p className="text-sm font-semibold text-rose-600">{state.error}</p> : null}
      {state.tempPassword ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm">
          <p className="font-semibold text-slate-900">Пароль участника (передайте ему):</p>
          <p className="mt-1 select-all font-mono text-lg text-sky-800">{state.tempPassword}</p>
        </div>
      ) : null}
      <button type="submit" disabled={pending} className="az-btn az-btn-accent w-full text-sm">
        {pending ? "Создание…" : "Создать профиль"}
      </button>
    </form>
  );
}
