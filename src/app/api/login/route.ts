import { NextResponse } from "next/server";
import { prisma, withDbRetry } from "@server/db";
import { assertLoginAllowed, clearLoginFailures } from "@server/auth/rate-limit";
import { verifyPassword } from "@server/auth/password";
import {
  createSessionToken,
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@server/auth/session-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

function redirectTo(req: Request, path: string) {
  return NextResponse.redirect(new URL(path, req.url), 303);
}

/** Classic form POST — works even if React/JS is slow on a phone. */
export async function POST(req: Request) {
  let email = "";
  let password = "";
  try {
    const form = await req.formData();
    email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    password = String(form.get("password") ?? "");
  } catch {
    return redirectTo(req, "/login?e=form");
  }

  if (!email || !password) {
    return redirectTo(req, "/login?e=empty");
  }

  const limited = assertLoginAllowed(`login:${email}`);
  if (!limited.ok) {
    return redirectTo(req, "/login?e=rate");
  }

  let user;
  try {
    user = await withDbRetry(() => prisma.user.findUnique({ where: { email } }));
  } catch {
    return redirectTo(req, "/login?e=db");
  }

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return redirectTo(req, "/login?e=auth");
  }

  if (user.about?.startsWith("[ARCHIVED]")) {
    return redirectTo(req, "/login?e=arch");
  }

  clearLoginFailures(`login:${email}`);

  let token: string;
  try {
    token = await createSessionToken(user.id, user.sessionVersion);
  } catch {
    return redirectTo(req, "/login?e=cfg");
  }

  const next =
    !user.consentAcceptedAt ? "/consent" : user.mustChangePassword ? "/onboarding" : "/dashboard";

  const res = redirectTo(req, next);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  res.cookies.delete(LEGACY_SESSION_COOKIE);
  return res;
}
