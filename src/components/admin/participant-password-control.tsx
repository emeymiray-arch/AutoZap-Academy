"use client";

import { useActionState, useState } from "react";
import { setParticipantPasswordAction, type AuthState } from "@/app/actions/auth";
import { generatePassword } from "@/lib/password-gen";

const initial: AuthState = {};

export function ParticipantPasswordControl({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState(setParticipantPasswordAction, initial);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-[var(--cyan)] hover:underline"
      >
        Пароль
      </button>
    );
  }

  return (
    <form action={action} className="mt-2 flex w-full min-w-[15rem] flex-col gap-1.5 whitespace-normal">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex gap-1.5">
        <input
          name="password"
          type="text"
          required
          autoComplete="off"
          minLength={6}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label={`Новый пароль для ${name}`}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-900"
          placeholder="Новый пароль"
        />
        <button
          type="button"
          onClick={() => setPassword(generatePassword())}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Сгенерировать
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--cyan)] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Закрыть
        </button>
      </div>
      {state.error ? <p className="text-xs font-semibold text-rose-600">{state.error}</p> : null}
      {state.ok && state.tempPassword ? (
        <p className="text-xs text-emerald-800">
          Сохранено. Новый пароль: <span className="select-all font-mono font-semibold">{state.tempPassword}</span>
        </p>
      ) : null}
    </form>
  );
}
