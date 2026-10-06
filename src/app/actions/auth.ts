"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@server/db";
import { SESSION_COOKIE, requireAdmin } from "@server/auth/session";
import { createAZService } from "@server/az/az-service";

export async function loginAsUserAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const jar = await cookies();
  jar.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(user.role === "ADMIN" ? "/admin/participants" : "/dashboard");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

const createParticipantSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  about: z.string().trim().max(500).optional(),
});

export async function createParticipantAction(formData: FormData) {
  await requireAdmin();

  const parsed = createParticipantSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    about: formData.get("about") || undefined,
  });

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) {
    throw new Error("Участник с таким email уже существует");
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      about: parsed.about ?? null,
      role: "STUDENT",
    },
  });

  await prisma.userAzBalance.create({
    data: {
      userId: user.id,
      balance: 0,
      maxAvailableAz: 0,
    },
  });

  const az = createAZService(prisma);
  await az.recalculateLevel(user.id);

  revalidatePath("/admin/participants");
  revalidatePath("/leaderboard");
}

export async function archiveParticipantAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === admin.id) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "STUDENT") return;

  // Soft-disable: keep history, mark via about prefix if no status field yet
  await prisma.user.update({
    where: { id: userId },
    data: {
      about: user.about?.startsWith("[ARCHIVED]")
        ? user.about
        : `[ARCHIVED] ${user.about ?? ""}`.trim(),
    },
  });

  revalidatePath("/admin/participants");
}
