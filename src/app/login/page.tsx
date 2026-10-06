import { getCurrentUser } from "@server/auth/session";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const current = await getCurrentUser();
  if (current) {
    if (!current.consentAcceptedAt) redirect("/consent");
    if (current.mustChangePassword) redirect("/onboarding");
    redirect(current.role === "ADMIN" ? "/admin/participants" : "/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
