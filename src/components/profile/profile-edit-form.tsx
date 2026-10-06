"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export function ProfileEditForm({
  name,
  nickname,
  about,
  avatarUrl,
}: {
  name: string;
  nickname: string;
  about: string;
  avatarUrl: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const [preview, setPreview] = useState(avatarUrl);

  function onFile(file: File | null) {
    if (!file) return;
    if (file.size > 400_000) {
      alert("Файл слишком большой (макс. ~400 КБ)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="avatarUrl" value={preview} />
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="az-brand-grad grid h-14 w-14 place-items-center rounded-full text-sm font-bold text-white">
            ?
          </span>
        )}
        <label className="text-xs text-[var(--muted)]">
          Аватар
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-xs"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        Имя
        <input name="name" required defaultValue={name} className="az-input az-input-rect mt-1.5" />
      </label>
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        Ник
        <input
          name="nickname"
          required
          defaultValue={nickname}
          className="az-input az-input-rect mt-1.5"
        />
      </label>
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        О себе
        <textarea
          name="about"
          rows={2}
          defaultValue={about}
          className="az-input az-input-rect mt-1.5"
        />
      </label>
      {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-300">Сохранено</p> : null}
      <button type="submit" disabled={pending} className="az-btn az-btn-accent text-sm">
        {pending ? "…" : "Сохранить"}
      </button>
    </form>
  );
}
