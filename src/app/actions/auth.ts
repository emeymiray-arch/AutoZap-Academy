"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@server/db";
import { SESSION_COOKIE, requireAdmin, requireLoggedIn, requireUser } from "@server/auth/session";
import { generateTempPassword, hashPassword, verifyPassword } from "@server/auth/password";
import { createAZService } from "@server/az/az-service";

export type AuthState = { error?: string; ok?: boolean; tempPassword?: string };

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: "Неверный email или пароль" };
  }

  if (user.about?.startsWith("[ARCHIVED]")) {
    return { error: "Аккаунт отключён. Обратитесь к администратору." };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  if (!user.consentAcceptedAt) redirect("/consent");
  if (user.mustChangePassword) redirect("/onboarding");
  redirect(user.role === "ADMIN" ? "/admin/participants" : "/dashboard");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function acceptConsentAction() {
  const user = await requireLoggedIn();
  await prisma.user.update({
    where: { id: user.id },
    data: { consentAcceptedAt: new Date() },
  });
  if (user.mustChangePassword) redirect("/onboarding");
  redirect(user.role === "ADMIN" ? "/admin/participants" : "/dashboard");
}

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  nickname: z.string().trim().min(2).max(40),
  password: z.string().min(6).max(72),
  avatarUrl: z.string().trim().max(500_000).optional(),
});

export async function completeOnboardingAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await requireLoggedIn();
  if (!user.consentAcceptedAt) redirect("/consent");

  try {
    const parsed = onboardingSchema.parse({
      name: formData.get("name"),
      nickname: formData.get("nickname"),
      password: formData.get("password"),
      avatarUrl: formData.get("avatarUrl") || undefined,
    });

    const nickTaken = await prisma.user.findFirst({
      where: { nickname: parsed.nickname, NOT: { id: user.id } },
    });
    if (nickTaken) return { error: "Этот ник уже занят" };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.name,
        nickname: parsed.nickname,
        passwordHash: hashPassword(parsed.password),
        mustChangePassword: false,
        avatarUrl: parsed.avatarUrl || user.avatarUrl,
      },
    });

    redirect("/dashboard");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: "Проверьте данные формы" };
  }
}

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  nickname: z.string().trim().min(2).max(40),
  about: z.string().trim().max(500).optional(),
  avatarUrl: z.string().trim().max(500_000).optional(),
});

export async function updateProfileAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await requireUser();
  try {
    const parsed = profileSchema.parse({
      name: formData.get("name"),
      nickname: formData.get("nickname"),
      about: formData.get("about") || undefined,
      avatarUrl: formData.get("avatarUrl") || undefined,
    });

    const nickTaken = await prisma.user.findFirst({
      where: { nickname: parsed.nickname, NOT: { id: user.id } },
    });
    if (nickTaken) return { error: "Этот ник уже занят" };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.name,
        nickname: parsed.nickname,
        about: parsed.about ?? null,
        avatarUrl: parsed.avatarUrl || null,
      },
    });

    revalidatePath("/profile");
    revalidatePath(`/participants/${user.id}`);
    return { ok: true };
  } catch {
    return { error: "Не удалось сохранить профиль" };
  }
}

const createParticipantSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  about: z.string().trim().max(500).optional(),
});

export async function createParticipantAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await requireAdmin();

  try {
    const parsed = createParticipantSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      about: formData.get("about") || undefined,
    });

    const existing = await prisma.user.findUnique({ where: { email: parsed.email.toLowerCase() } });
    if (existing) return { error: "Участник с таким email уже существует" };

    const tempPassword = generateTempPassword();

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        about: parsed.about ?? null,
        role: "STUDENT",
        passwordHash: hashPassword(tempPassword),
        mustChangePassword: true,
      },
    });

    await prisma.userAzBalance.create({
      data: { userId: user.id, balance: 0, maxAvailableAz: 0 },
    });

    const az = createAZService(prisma);
    await az.recalculateLevel(user.id);

    revalidatePath("/admin/participants");
    revalidatePath("/leaderboard");
    return { ok: true, tempPassword };
  } catch {
    return { error: "Не удалось создать участника" };
  }
}

export async function archiveParticipantAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === admin.id) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "STUDENT") return;

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
