"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@server/db";
import {
  createUserSession,
  destroyUserSession,
  requireAdmin,
  requireLoggedIn,
  requireUser,
} from "@server/auth/session";
import { assertLoginAllowed, clearLoginFailures } from "@server/auth/rate-limit";
import { generateTempPassword, hashPassword, verifyPassword } from "@server/auth/password";
import { createAZService } from "@server/az/az-service";
import { sanitizeAvatarUrl } from "@/lib/sanitize";

export type AuthState = { error?: string; ok?: boolean; tempPassword?: string };

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const limited = assertLoginAllowed(`login:${email}`);
  if (!limited.ok) {
    return { error: `Слишком много попыток. Подождите ${limited.retryAfterSec} сек.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: "Неверный email или пароль" };
  }

  if (user.about?.startsWith("[ARCHIVED]")) {
    return { error: "Аккаунт отключён. Обратитесь к администратору." };
  }

  clearLoginFailures(`login:${email}`);
  try {
    await createUserSession(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("SESSION_SECRET")) {
      return { error: "Сервер не настроен (SESSION_SECRET). Попробуйте позже." };
    }
    throw err;
  }

  if (!user.consentAcceptedAt) redirect("/consent");
  if (user.mustChangePassword) redirect("/onboarding");
  redirect(user.role === "ADMIN" ? "/admin/participants" : "/dashboard");
}

export async function logoutAction() {
  await destroyUserSession();
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

    const avatarUrl = sanitizeAvatarUrl(parsed.avatarUrl);
    if (parsed.avatarUrl && !avatarUrl) {
      return { error: "Некорректный аватар (только изображение PNG/JPEG/WebP или HTTPS URL)" };
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.name,
        nickname: parsed.nickname,
        passwordHash: hashPassword(parsed.password),
        mustChangePassword: false,
        avatarUrl: avatarUrl || user.avatarUrl,
        sessionVersion: { increment: 1 },
      },
    });

    await createUserSession(updated);
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

    const avatarUrl = sanitizeAvatarUrl(parsed.avatarUrl);
    if (parsed.avatarUrl && !avatarUrl) {
      return { error: "Некорректный аватар (только изображение PNG/JPEG/WebP или HTTPS URL)" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.name,
        nickname: parsed.nickname,
        about: parsed.about ?? null,
        avatarUrl,
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
      sessionVersion: { increment: 1 },
    },
  });

  revalidatePath("/admin/participants");
}
