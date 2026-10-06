import { acceptConsentAction } from "@/app/actions/auth";
import { requireLoggedIn } from "@server/auth/session";
import { BrandMark } from "@/components/brand/logo";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConsentPage() {
  const user = await requireLoggedIn();
  if (user.consentAcceptedAt) {
    redirect(user.mustChangePassword ? "/onboarding" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="az-glass-strong az-glass-glow w-full max-w-lg p-5 sm:p-7">
        <div className="mb-4 flex items-center gap-3">
          <BrandMark size={40} />
          <h1 className="text-xl font-extrabold text-white">Согласие на обработку данных</h1>
        </div>
        <div className="mb-5 space-y-2 text-sm text-[var(--muted)]">
          <p>
            AutoZap Academy обрабатывает имя, ник, email, аватар и данные обучения для работы
            платформы, рейтинга и коммуникации между участниками.
          </p>
          <p>
            Подробности — в{" "}
            <Link href="/privacy" className="text-[var(--cyan)] underline-offset-2 hover:underline">
              политике конфиденциальности
            </Link>
            .
          </p>
        </div>
        <form action={acceptConsentAction}>
          <button type="submit" className="az-btn az-btn-accent w-full">
            Принимаю и продолжаю
          </button>
        </form>
      </div>
    </div>
  );
}
