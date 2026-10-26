"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/brand/logo";
import Link from "next/link";

const ERRORS: Record<string, string> = {
  empty: "Введите email и пароль",
  auth: "Неверный email или пароль",
  rate: "Слишком много попыток. Подождите немного.",
  db: "Сервер базы данных просыпается. Подождите 10–20 сек и попробуйте снова.",
  arch: "Аккаунт отключён. Обратитесь к администратору.",
  cfg: "Сервер не настроен. Попробуйте позже.",
  form: "Не удалось отправить форму. Обновите страницу.",
};

export default function LoginForm() {
  const params = useSearchParams();
  const error = ERRORS[params.get("e") ?? ""] ?? null;
  const [pending, setPending] = useState(false);

  // Warm Neon while the user types — classic POST login does not need React to succeed.
  useEffect(() => {
    const ctrl = new AbortController();
    void fetch("/api/health", { signal: ctrl.signal, cache: "no-store" }).catch(() => {});
    return () => ctrl.abort();
  }, []);

  return (
    <div className="az-glass-strong az-glass-glow relative w-full max-w-md p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <BrandMark size={44} />
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--cyan)]">
            AutoZap Academy
          </p>
          <h1
            className="text-xl font-extrabold text-[var(--text)] sm:text-2xl"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Вход
          </h1>
        </div>
      </div>

      <form
        action="/api/login"
        method="post"
        className="space-y-3"
        onSubmit={() => setPending(true)}
      >
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="az-input az-input-rect mt-1.5"
            placeholder="you@autozap.academy"
          />
        </label>
        <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Пароль
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="az-input az-input-rect mt-1.5"
            placeholder="••••••••"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="az-btn az-btn-accent w-full">
          {pending ? "Вход…" : "Войти"}
        </button>
      </form>

      <p className="mt-4 text-center text-[0.7rem] text-[var(--muted)]">
        Входя, вы подтверждаете согласие на обработку персональных данных.{" "}
        <Link href="/privacy" className="text-[var(--cyan)] underline-offset-2 hover:underline">
          Подробнее
        </Link>
      </p>
    </div>
  );
}
