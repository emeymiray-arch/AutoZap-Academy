import LoginForm from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

/**
 * Do not call the database here. Middleware already redirects logged-in users
 * away from /login using the JWT cookie. Hitting Neon on every login open
 * caused a white screen + stuck browser progress bar while the DB woke up.
 */
export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
