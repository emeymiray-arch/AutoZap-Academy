export function displayName(user: { name: string; nickname?: string | null }) {
  return user.nickname?.trim() || user.name;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function chatPairKey(a: string, b: string) {
  return [a, b].sort().join(":");
}
