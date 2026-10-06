"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@server/db";
import { getCurrentUser, requireUser } from "@server/auth/session";

export type NotifState = { error?: string; ok?: boolean };

export async function updateNotificationPrefsAction(
  _prev: NotifState,
  formData: FormData,
): Promise<NotifState> {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      notifyChat: formData.get("notifyChat") === "on",
      notifyNews: formData.get("notifyNews") === "on",
      notifyActivity: formData.get("notifyActivity") === "on",
      notifyAz: formData.get("notifyAz") === "on",
    },
  });
  revalidatePath("/notifications");
  return { ok: true };
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function getUnreadNotificationCount() {
  const user = await getCurrentUser();
  if (!user) return 0;
  return prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });
}

/** Fan-out helper used by other actions */
export async function notifyUsers(input: {
  userIds: string[];
  title: string;
  body: string;
  href?: string;
}) {
  if (input.userIds.length === 0) return;
  await prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      userId,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    })),
  });
}
