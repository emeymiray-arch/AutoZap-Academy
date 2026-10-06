import Link from "next/link";
import { BrandMark } from "@/components/brand/logo";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="az-glass-strong w-full max-w-2xl p-5 sm:p-7">
        <div className="mb-4 flex items-center gap-3">
          <BrandMark size={36} />
          <h1 className="text-xl font-extrabold text-white">Персональные данные</h1>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-[var(--muted)]">
          <p>
            Оператор: AutoZap. Платформа хранит учётные данные участников (email, имя, ник, аватар),
            прогресс обучения, баллы AZ, сообщения в чатах и публикации на доске активности.
          </p>
          <p>
            Данные используются только для обучения, рейтинга, модерации и внутренней коммуникации.
            Участники видят публичный профиль (ник, аватар, рейтинг) друг друга.
          </p>
          <p>
            По вопросам удаления или изменения данных обратитесь к администратору Академии.
          </p>
        </div>
        <Link href="/login" className="az-btn az-btn-ghost mt-5 inline-flex text-sm">
          ← Ко входу
        </Link>
      </div>
    </div>
  );
}
