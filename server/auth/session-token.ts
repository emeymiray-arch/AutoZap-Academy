/**
 * HMAC-signed session tokens (Edge + Node compatible via Web Crypto).
 * Format: v1.<base64url(payloadJson)>.<base64url(hmacSha256)>
 */

export const SESSION_COOKIE = "az_session";
/** Legacy unsigned cookie — cleared on login/logout */
export const LEGACY_SESSION_COOKIE = "az_session_user";

const SESSION_DAYS = 7;

export type SessionPayload = {
  sub: string;
  v: number;
  exp: number;
};

function getSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") return null;
  return "dev-only-insecure-session-secret-min-32-chars!";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function textToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function hmacSha256(message: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

export function sessionMaxAgeSeconds(): number {
  return SESSION_DAYS * 24 * 60 * 60;
}

export async function createSessionToken(userId: string, sessionVersion: number): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error("SESSION_SECRET must be set (min 32 chars) in production");
  }
  const payload: SessionPayload = {
    sub: userId,
    v: sessionVersion,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds(),
  };
  const body = textToBase64Url(JSON.stringify(payload));
  const sig = bytesToBase64Url(await hmacSha256(`v1.${body}`, secret));
  return `v1.${body}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    if (!secret) return null;

    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "v1") return null;
    const [, body, sig] = parts;
    if (!body || !sig) return null;

    const expected = await hmacSha256(`v1.${body}`, secret);
    const actual = base64UrlToBytes(sig);
    if (!timingSafeEqual(expected, actual)) return null;

    const json = new TextDecoder().decode(base64UrlToBytes(body));
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload?.sub || typeof payload.v !== "number" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionMaxAgeSeconds(),
    secure,
  };
}
