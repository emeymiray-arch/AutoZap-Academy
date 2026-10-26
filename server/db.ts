import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const TRANSIENT_DB =
  /Can't reach database server|P1001|P1017|Connection|ECONNREFUSED|ETIMEDOUT|timed out|Server has closed|Connection terminated|remaining connection slots|too many clients/i;

/** Neon pooler + serverless: tiny Prisma pool, longer waits, pgbouncer flag when using -pooler host. */
function datasourceUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    const isPooler = u.hostname.includes("-pooler.");
    if (isPooler && !u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    // Serverless: one connection per isolate avoids exhausting Neon free compute.
    if (!u.searchParams.has("connection_limit")) {
      u.searchParams.set("connection_limit", isPooler ? "1" : "3");
    }
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", "20");
    return u.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: datasourceUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Retry when Neon compute is waking / briefly unreachable (common cause of “не грузит”). */
export async function withDbRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!TRANSIENT_DB.test(message) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw last;
}
