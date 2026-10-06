import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { prisma } from "@server/db";
import {
  createSessionToken,
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@server/auth/session-token";

export { SESSION_COOKIE, LEGACY_SESSION_COOKIE };

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
  | "sessionVersion"
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
  sessionVersion: true,
} as const;

export async function createUserSession(user: { id: string; sessionVersion: number }) {
  const token = await createSessionToken(user.id, user.sessionVersion);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
  jar.delete(LEGACY_SESSION_COOKIE);
}

export async function destroyUserSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(LEGACY_SESSION_COOKIE);
}

export async function bumpSessionVersion(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const payload = await verifySessionToken(raw);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: sessionSelect,
  });
  if (!user) return null;
  if (user.sessionVersion !== payload.v) return null;
  if (user.about?.startsWith("[ARCHIVED]")) return null;
  return user;
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
