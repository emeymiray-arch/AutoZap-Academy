import { AppShell } from "@/components/layout/app-shell";
import { NewsComposeForm } from "@/components/news/news-compose-form";
import { NewsCard } from "@/components/news/news-card";
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Link href="/dashboard" className="text-xs font-medium text-[var(--cyan)]">
          ← На главную
        </Link>
        {isAdmin ? <NewsComposeForm /> : null}
      </div>
      <ul className="space-y-3 md:max-w-2xl">
        {news.map((item) => (
          <li key={item.id}>
            <NewsCard
              id={item.id}
              title={item.title}
              body={item.body}
              meta={`${displayName(item.author)} · ${item.createdAt.toLocaleString("ru-RU")}`}
              canDelete={isAdmin}
            />
          </li>
        ))}
        {news.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-black/15 bg-white/70 px-3 py-4 text-sm font-semibold text-black/55">
            Новостей пока нет
          </li>
        ) : null}
      </ul>
    </AppShell>
  );
}
