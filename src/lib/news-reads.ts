import { prisma } from "@server/db";

/** Record that the user saw these news posts (unique readers; author is skipped). */
export async function markNewsRead(userId: string, posts: Array<{ id: string; authorId: string }>) {
  const ids = posts.filter((p) => p.authorId !== userId).map((p) => p.id);
  if (ids.length === 0) return;
  await prisma.newsPostRead.createMany({
    data: ids.map((newsPostId) => ({ newsPostId, userId })),
    skipDuplicates: true,
  });
}

export function formatReadCount(n: number) {
  if (n <= 0) return "Ещё не прочли";
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = "прочтений";
  if (mod10 === 1 && mod100 !== 11) word = "прочтение";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = "прочтения";
  return `${n} ${word}`;
}
