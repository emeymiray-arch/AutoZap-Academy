import { requireLoggedIn } from "@server/auth/session";
import { redirect } from "next/navigation";
import OnboardingForm from "@/components/auth/onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireLoggedIn();
  if (!user.consentAcceptedAt) redirect("/consent");
  if (!user.mustChangePassword) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <OnboardingForm defaultName={user.name} />
    </div>
  );
}
