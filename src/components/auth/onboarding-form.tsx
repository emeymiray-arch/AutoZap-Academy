"use client";

import { useActionState, useState } from "react";
import { completeOnboardingAction, type AuthState } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand/logo";

const initial: AuthState = {};

export default function OnboardingForm({
  defaultName,
}: {
  defaultName: string;
}) {
  const [state, action, pending] = useActionState(completeOnboardingAction, initial);
  const [avatarUrl, setAvatarUrl] = useState("");

  function onFile(file: File | null) {
    if (!file) return;
    if (file.size > 400_000) {
      alert("Файл слишком большой (макс. ~400 КБ)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  return (
    <div className="az-glass-strong az-glass-glow w-full max-w-lg p-5 sm:p-7">
      <div className="mb-4 flex items-center gap-3">
        <BrandMark size={40} />
        <h1 className="text-xl font-extrabold text-white">Настройка профиля</h1>
      </div>
      <form action={action} className="space-y-3">
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Аватар
          <input
            type="file"
            accept="image/*"
            className="mt-1.5 block w-full text-sm text-[var(--muted)]"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : null}
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Имя
          <input
            name="name"
            required
            defaultValue={defaultName}
            className="az-input az-input-rect mt-1.5"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Ник
          <input
            name="nickname"
            required
            className="az-input az-input-rect mt-1.5"
            placeholder="ivan_az"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Новый пароль
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="az-input az-input-rect mt-1.5"
          />
        </label>
        {state.error ? (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className="az-btn az-btn-accent w-full">
          {pending ? "Сохранение…" : "Сохранить и войти"}
        </button>
      </form>
    </div>
  );
}
