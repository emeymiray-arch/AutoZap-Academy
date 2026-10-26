import { Loader2 } from "lucide-react";

/** Shown immediately while a server page waits (DB wake-up, etc.). */
export default function RootLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="az-glass-strong flex w-full max-w-sm flex-col items-center gap-3 p-6 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--cyan)]" aria-hidden />
        <p
          className="text-base font-extrabold text-[var(--text)]"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          AutoZap Academy
        </p>
        <p className="text-sm font-semibold text-[var(--muted)]">Загружаем… это займёт пару секунд</p>
      </div>
    </div>
  );
}
