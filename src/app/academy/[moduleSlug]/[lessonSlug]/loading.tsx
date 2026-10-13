import { Loader2 } from "lucide-react";

export default function LessonLoading() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl items-center justify-center gap-2 text-sm font-black text-[var(--cyan)]">
      <Loader2 className="h-5 w-5 animate-spin" />
      Загружаем урок…
    </div>
  );
}
