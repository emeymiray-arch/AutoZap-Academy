import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";

/** Static HTML from the CDN — no serverless / Neon wait on first open. */
export const dynamic = "force-static";
export const revalidate = false;

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
