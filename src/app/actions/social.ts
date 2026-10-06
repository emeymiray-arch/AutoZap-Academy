"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@server/db";
import { requireAdmin, requireUser } from "@server/auth/session";
import { createAZService } from "@server/az/az-service";
import { chatPairKey } from "@/lib/user";

export type ActionState = { error?: string; ok?: boolean };

export async function createActivityPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 3) return { error: "Слишком короткий вопрос" };
  if (body.length > 2000) return { error: "Слишком длинный текст" };

  await prisma.activityPost.create({
    data: { authorId: user.id, body },
  });

  revalidatePath("/activity");
  return { ok: true };
}

export async function createActivityReplyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!postId || body.length < 2) return { error: "Введите ответ" };

  const post = await prisma.activityPost.findUnique({ where: { id: postId } });
  if (!post) return { error: "Вопрос не найден" };

  await prisma.activityReply.create({
    data: { postId, authorId: user.id, body },
  });

  revalidatePath("/activity");
  return { ok: true };
}

export async function toggleActivityVoteAction(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "") || null;
  const replyId = String(formData.get("replyId") ?? "") || null;
  const kindRaw = String(formData.get("kind") ?? "LIKE");
  const kind = kindRaw === "DISLIKE" ? "DISLIKE" : "LIKE";

  if (postId) {
    const existing = await prisma.activityVote.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });
    if (existing?.kind === kind) {
      await prisma.activityVote.delete({ where: { id: existing.id } });
    } else if (existing) {
      await prisma.activityVote.update({ where: { id: existing.id }, data: { kind } });
    } else {
      await prisma.activityVote.create({
        data: { userId: user.id, postId, kind },
      });
    }
  } else if (replyId) {
    const existing = await prisma.activityVote.findUnique({
      where: { userId_replyId: { userId: user.id, replyId } },
    });
    if (existing?.kind === kind) {
      await prisma.activityVote.delete({ where: { id: existing.id } });
    } else if (existing) {
      await prisma.activityVote.update({ where: { id: existing.id }, data: { kind } });
    } else {
      await prisma.activityVote.create({
        data: { userId: user.id, replyId, kind },
      });
    }
  }

  revalidatePath("/activity");
}

export async function awardActivityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "") || null;
  const replyId = String(formData.get("replyId") ?? "") || null;
  const azAmount = Number(formData.get("azAmount") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!Number.isFinite(azAmount) || azAmount < 1 || azAmount > 500) {
    return { error: "Укажите баллы от 1 до 500" };
  }
  if (!postId && !replyId) return { error: "Не выбран объект награды" };

  let subjectUserId: string | null = null;
  let sourceId = "";
  let reason = "";

  if (postId) {
    const post = await prisma.activityPost.findUnique({
      where: { id: postId },
      include: { award: true },
    });
    if (!post) return { error: "Вопрос не найден" };
    if (post.award) return { error: "За этот вопрос уже начислены баллы" };
    subjectUserId = post.authorId;
    sourceId = post.id;
    reason = note ?? `Полезный вопрос (доска активности)`;
  } else if (replyId) {
    const reply = await prisma.activityReply.findUnique({
      where: { id: replyId },
      include: { award: true },
    });
    if (!reply) return { error: "Ответ не найден" };
    if (reply.award) return { error: "За этот ответ уже начислены баллы" };
    subjectUserId = reply.authorId;
    sourceId = reply.id;
    reason = note ?? `Полезный ответ (доска активности)`;
  }

  if (!subjectUserId) return { error: "Автор не найден" };

  const subject = await prisma.user.findUnique({ where: { id: subjectUserId } });
  if (!subject || subject.role === "ADMIN") {
    return { error: "Админу баллы не начисляются" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.activityAward.create({
      data: {
        postId,
        replyId,
        azAmount,
        awardedById: admin.id,
        note,
      },
    });

    const existing = await tx.userAzBalance.findUnique({ where: { userId: subjectUserId! } });
    const balanceAfter = (existing?.balance ?? 0) + azAmount;

    if (existing) {
      await tx.userAzBalance.update({
        where: { userId: subjectUserId! },
        data: { balance: balanceAfter },
      });
    } else {
      await tx.userAzBalance.create({
        data: { userId: subjectUserId!, balance: balanceAfter, maxAvailableAz: 0 },
      });
    }

    await tx.azLedgerEntry.create({
      data: {
        userId: subjectUserId!,
        delta: azAmount,
        balanceAfter,
        kind: "INITIAL",
        actionType: "CUSTOM",
        sourceType: postId ? "activity_post" : "activity_reply",
        sourceId,
        awardedAz: azAmount,
        reason,
        idempotencyKey: `activity-award:${sourceId}`,
        createdById: admin.id,
      },
    });
  });

  const az = createAZService(prisma);
  await az.recalculateLevel(subjectUserId);

  revalidatePath("/activity");
  revalidatePath("/leaderboard");
  revalidatePath(`/participants/${subjectUserId}`);
  return { ok: true };
}

export async function openChatAction(formData: FormData) {
  const me = await requireUser();
  const otherId = String(formData.get("userId") ?? "");
  if (!otherId || otherId === me.id) redirect("/chats");

  const other = await prisma.user.findUnique({ where: { id: otherId } });
  if (!other) redirect("/chats");

  const pairKey = chatPairKey(me.id, otherId);
  let thread = await prisma.chatThread.findUnique({ where: { pairKey } });
  if (!thread) {
    thread = await prisma.chatThread.create({
      data: {
        pairKey,
        participants: {
          create: [{ userId: me.id }, { userId: otherId }],
        },
      },
    });
  }

  redirect(`/chats/${thread.id}`);
}

export async function sendChatMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const me = await requireUser();
  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!threadId || body.length < 1) return { error: "Пустое сообщение" };
  if (body.length > 4000) return { error: "Слишком длинное сообщение" };

  const part = await prisma.chatParticipant.findUnique({
    where: { threadId_userId: { threadId, userId: me.id } },
  });
  if (!part) return { error: "Нет доступа к чату" };

  await prisma.chatMessage.create({
    data: { threadId, senderId: me.id, body },
  });
  await prisma.chatThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  const others = await prisma.chatParticipant.findMany({
    where: { threadId, userId: { not: me.id } },
    include: { user: { select: { id: true, notifyChat: true } } },
  });
  const targets = others.filter((o) => o.user.notifyChat).map((o) => o.user.id);
  if (targets.length > 0) {
    const { notifyUsers } = await import("@/app/actions/notifications");
    const preview = body.length > 80 ? `${body.slice(0, 80)}…` : body;
    await notifyUsers({
      userIds: targets,
      title: `Сообщение от ${me.nickname || me.name}`,
      body: preview,
      href: `/chats/${threadId}`,
    });
  }

  revalidatePath(`/chats/${threadId}`);
  revalidatePath("/chats");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function updateChatMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const me = await requireUser();
  const messageId = String(formData.get("messageId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!messageId) return { error: "Сообщение не найдено" };
  if (body.length < 1) return { error: "Пустое сообщение" };
  if (body.length > 4000) return { error: "Слишком длинное сообщение" };

  const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!msg || msg.senderId !== me.id) return { error: "Нельзя изменить чужое сообщение" };

  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { body },
  });

  revalidatePath(`/chats/${msg.threadId}`);
  revalidatePath("/chats");
  return { ok: true };
}

export async function deleteChatMessageAction(formData: FormData) {
  const me = await requireUser();
  const messageId = String(formData.get("messageId") ?? "");
  if (!messageId) return;

  const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!msg || msg.senderId !== me.id) return;

  await prisma.chatMessage.delete({ where: { id: messageId } });
  revalidatePath(`/chats/${msg.threadId}`);
  revalidatePath("/chats");
}

export async function updateActivityPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!postId) return { error: "Вопрос не найден" };
  if (body.length < 3) return { error: "Слишком короткий вопрос" };
  if (body.length > 2000) return { error: "Слишком длинный текст" };

  const post = await prisma.activityPost.findUnique({ where: { id: postId } });
  if (!post) return { error: "Вопрос не найден" };
  if (post.authorId !== user.id && user.role !== "ADMIN") {
    return { error: "Нельзя изменить чужой вопрос" };
  }

  await prisma.activityPost.update({ where: { id: postId }, data: { body } });
  revalidatePath("/activity");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteActivityPostAction(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;

  const post = await prisma.activityPost.findUnique({ where: { id: postId } });
  if (!post) return;
  if (post.authorId !== user.id && user.role !== "ADMIN") return;

  await prisma.activityPost.delete({ where: { id: postId } });
  revalidatePath("/activity");
  revalidatePath("/dashboard");
}

export async function updateActivityReplyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const replyId = String(formData.get("replyId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!replyId) return { error: "Ответ не найден" };
  if (body.length < 2) return { error: "Введите ответ" };
  if (body.length > 2000) return { error: "Слишком длинный текст" };

  const reply = await prisma.activityReply.findUnique({ where: { id: replyId } });
  if (!reply) return { error: "Ответ не найден" };
  if (reply.authorId !== user.id && user.role !== "ADMIN") {
    return { error: "Нельзя изменить чужой ответ" };
  }

  await prisma.activityReply.update({ where: { id: replyId }, data: { body } });
  revalidatePath("/activity");
  return { ok: true };
}

export async function deleteActivityReplyAction(formData: FormData) {
  const user = await requireUser();
  const replyId = String(formData.get("replyId") ?? "");
  if (!replyId) return;

  const reply = await prisma.activityReply.findUnique({ where: { id: replyId } });
  if (!reply) return;
  if (reply.authorId !== user.id && user.role !== "ADMIN") return;

  await prisma.activityReply.delete({ where: { id: replyId } });
  revalidatePath("/activity");
}

export async function createNewsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (title.length < 2) return { error: "Введите заголовок" };
  if (body.length < 3) return { error: "Введите текст новости" };
  if (title.length > 120 || body.length > 4000) return { error: "Слишком длинный текст" };

  await prisma.newsPost.create({
    data: { authorId: admin.id, title, body },
  });

  const recipients = await prisma.user.findMany({
    where: {
      id: { not: admin.id },
      role: { not: "ADMIN" },
      notifyNews: true,
      NOT: { about: { startsWith: "[ARCHIVED]" } },
    },
    select: { id: true },
  });
  if (recipients.length > 0) {
    const { notifyUsers } = await import("@/app/actions/notifications");
    await notifyUsers({
      userIds: recipients.map((r) => r.id),
      title: "Новость Academy",
      body: title,
      href: "/news",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/news");
  revalidatePath("/notifications");
  return { ok: true };
}

export async function deleteNewsAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.newsPost.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/dashboard");
  revalidatePath("/news");
}
