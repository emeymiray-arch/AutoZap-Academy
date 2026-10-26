import { NextResponse } from "next/server";
import { prisma } from "@server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Cheap wake-up for Neon + serverless so login/dashboard don't cold-start from zero. */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ms: Date.now() - started });
  } catch {
    return NextResponse.json({ ok: false, ms: Date.now() - started }, { status: 503 });
  }
}
