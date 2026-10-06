import { prisma } from "@server/db";

function isSafeInternalHref(href: string | undefined | null): string | null {
  if (!href) return null;
  const value = href.trim();
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  if (value.length > 500) return null;
  return value;
}

/** Server-only fan-out — must NOT live in a "use server" file. */
export async function notifyUsers(input: {
  userIds: string[];
  title: string;
  body: string;
  href?: string;
}) {
  if (input.userIds.length === 0) return;
  const href = isSafeInternalHref(input.href);
  await prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      userId,
      title: input.title.slice(0, 200),
      body: input.body.slice(0, 2000),
      href,
    })),
  });
}
