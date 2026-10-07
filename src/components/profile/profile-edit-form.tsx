"use client";

import { useActionState, useRef, useState } from "react";
import { updateProfileAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export function ProfileEditForm({
  name,
  nickname,
  about,
  avatarUrl,
  initials,
}: {
  name: string;
  nickname: string;
  about: string;
  avatarUrl: string;
  initials: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const [preview, setPreview] = useState(avatarUrl);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(file: File | null) {
    if (!file) return;
    if (file.size > 400_000) {
      alert("Файл слишком большой (макс. ~400 КБ)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result ?? ""));
      setOpen(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="avatarUrl" value={preview} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      <div className="flex justify-center py-1 md:justify-start">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative rounded-full outline-none ring-[var(--cyan)]/40 transition hover:ring-4 focus-visible:ring-4"
          aria-label="Просмотреть или изменить аватар"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-20 w-20 rounded-full object-cover md:h-24 md:w-24"
            />
          ) : (
            <span className="az-brand-grad grid h-20 w-20 place-items-center rounded-full text-xl font-bold text-white md:h-24 md:w-24 md:text-2xl">
              {initials}
            </span>
          )}
          <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-black/0 text-[0.65rem] font-bold text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
            открыть
          </span>
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Аватар"
          onClick={() => setOpen(false)}
        >
          <div
            className="az-glass-strong flex w-full max-w-sm flex-col items-center gap-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="max-h-[55vh] w-full rounded-2xl object-contain" />
            ) : (
              <span className="az-brand-grad grid h-40 w-40 place-items-center rounded-full text-4xl font-bold text-white">
                {initials}
              </span>
            )}
            <div className="flex w-full gap-2">
              <button
                type="button"
                className="az-btn az-btn-accent flex-1 text-sm"
                onClick={() => fileRef.current?.click()}
              >
                Изменить
              </button>
              <button
                type="button"
                className="az-btn az-btn-ghost flex-1 text-sm"
                onClick={() => setOpen(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
