/** Shared validation helpers for user-controlled strings. */

const AVATAR_DATA_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
const MAX_AVATAR_CHARS = 400_000;

export function sanitizeAvatarUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.length > MAX_AVATAR_CHARS) return null;

  if (AVATAR_DATA_RE.test(value)) return value;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

export function sanitizeInternalHref(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  if (value.length > 500) return null;
  return value;
}
