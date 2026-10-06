import { AppShell } from "@/components/layout/app-shell";
import { NewsComposeForm } from "@/components/news/news-compose-form";
import { deleteNewsAction } from "@/app/actions/social";
import { requireUser } from "@server/auth/session";
import { prisma } from "@server/db";
import { displayName } from "@/lib/user";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const news = await prisma.newsPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { select: { name: true, nickname: true } } },
  });

  return (
    <AppShell user={user} title="Новости">
      <Link href="/dashboard" className="mb-3 inline-block text-xs text-[var(--cyan)]">
        ← На главную
      </Link>
      {isAdmin ? <NewsComposeForm /> : null}
      <ul className="mt-3 divide-y divide-white/10">
        {news.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-white">{item.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                {item.body}
              </p>
              <p className="mt-2 text-[0.65rem] text-[var(--muted)]">
                {displayName(item.author)} · {item.createdAt.toLocaleString("ru-RU")}
              </p>
            </div>
            {isAdmin ? (
              <form action={deleteNewsAction}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="text-xs text-[var(--muted)] hover:text-rose-300">
                  удалить
                </button>
              </form>
            ) : null}
          </li>
        ))}
        {news.length === 0 ? (
          <li className="py-4 text-sm text-[var(--muted)]">Новостей пока нет</li>
        ) : null}
      </ul>
    </AppShell>
  );
}
