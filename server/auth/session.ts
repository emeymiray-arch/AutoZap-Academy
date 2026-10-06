import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { prisma } from "@server/db";

export const SESSION_COOKIE = "az_session_user";

export type SessionUser = Pick<
  User,
  | "id"
  | "email"
  | "name"
  | "nickname"
  | "role"
  | "avatarUrl"
  | "about"
  | "consentAcceptedAt"
  | "mustChangePassword"
>;

const sessionSelect = {
  id: true,
  email: true,
  name: true,
  nickname: true,
  role: true,
  avatarUrl: true,
  about: true,
  consentAcceptedAt: true,
  mustChangePassword: true,
} as const;

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: sessionSelect,
  });
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.consentAcceptedAt) redirect("/consent");
  if (user.mustChangePassword) redirect("/onboarding");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/** Soft gate for consent/onboarding pages themselves */
export async function requireLoggedIn(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function isAdmin(role: Role) {
  return role === "ADMIN";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
