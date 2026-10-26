import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@server/auth/session-token";

/**
 * Never touch Neon here. Guests and share links must land instantly.
 * JWT presence is enough to send someone toward the dashboard; requireUser
 * there will bounce bad sessions to /login without blocking `/`.
 */
export default async function HomePage() {
  const jar = await cookies();
  if (jar.get(SESSION_COOKIE)?.value) redirect("/dashboard");
  redirect("/login");
}
