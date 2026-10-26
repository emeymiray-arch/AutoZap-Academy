import { redirect } from "next/navigation";
import { getCurrentUser } from "@server/auth/session";

/** Always land on a shareable area — never bounce guests into /admin/*. */
export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect("/dashboard");
}
