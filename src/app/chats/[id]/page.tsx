import { AppShell } from "@/components/layout/app-shell";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { requireUser } from "@server/auth/session";
import { prisma } from "@server/db";
import { displayName, initials } from "@/lib/user";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;

  const thread = await prisma.chatThread.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, nickname: true, avatarUrl: true, role: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: { id: true, name: true, nickname: true, avatarUrl: true },
          },
        },
        take: 200,
      },
    },
  });

  if (!thread) notFound();
  const member = thread.participants.some((p) => p.userId === me.id);
  if (!member) notFound();

  const other = thread.participants.map((p) => p.user).find((u) => u.id !== me.id);
  if (!other) notFound();

  return (
    <AppShell user={me} title={displayName(other)}>
      <Link href="/chats" className="mb-3 inline-block text-xs text-[var(--cyan)]">
        ← Все чаты
      </Link>

      <div className="flex max-h-[60vh] flex-col border-t border-white/10 pt-3">
        <div className="flex-1 space-y-2 overflow-y-auto">
          {thread.messages.map((m) => (
            <ChatMessageBubble
              key={m.id}
              mine={m.senderId === me.id}
              message={{
                id: m.id,
                body: m.body,
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
                sender: m.sender,
              }}
            />
          ))}
          {thread.messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted)]">Напишите первое сообщение</p>
          ) : null}
        </div>
        <ChatComposer threadId={thread.id} />
      </div>

      <Link href={`/participants/${other.id}`} className="mt-3 flex items-center gap-3 py-2">
        {other.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={other.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="az-brand-grad grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white">
            {initials(displayName(other))}
          </span>
        )}
        <span className="text-sm text-white">Открыть профиль · {displayName(other)}</span>
      </Link>
    </AppShell>
  );
}
