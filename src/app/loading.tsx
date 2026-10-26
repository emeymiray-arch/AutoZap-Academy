import { Loader2 } from "lucide-react";

/** Brief placeholder while a dynamic page streams — never blocks /login. */
export default function RootLoading() {
  return (
    <div className="relative flex min-h-[50vh] items-center justify-center p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--cyan)]" aria-hidden />
        <p className="text-sm font-semibold text-[var(--muted)]">Загружаем…</p>
      </div>
    </div>
  );
}
