import { AppShell } from "@/components/layout/app-shell";
import { AzSpeedStats } from "@/components/az/az-speed-stats";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { loadStudentAzDashboard } from "@server/az/queries";
import { requireUser } from "@server/auth/session";
import { displayName, initials } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const summary = isAdmin ? null : (await loadStudentAzDashboard(user.id)).summary;
  const label = displayName(user);

  return (
    <AppShell user={user} title="Мой профиль">
      <div className="md:mx-auto md:max-w-xl">
        <div className="mb-3 py-1 md:mb-4">
          <h2 className="text-lg font-extrabold text-[var(--text)] md:text-xl">{label}</h2>
          <p className="text-xs text-[var(--muted)] md:text-sm">{user.email}</p>
        </div>

        {!isAdmin && summary ? (
          <AzSpeedStats
            balance={summary.balance}
            maxAvailableAz={summary.maxAvailableAz}
            levelName={summary.level?.name ?? "—"}
            progressPercent={summary.progressToNextLevelPercent}
          />
        ) : null}

        <ProfileEditForm
          name={user.name}
          nickname={user.nickname ?? ""}
          about={user.about?.replace(/^\[ARCHIVED\]\s*/, "") ?? ""}
          avatarUrl={user.avatarUrl ?? ""}
          initials={initials(label)}
        />
      </div>
    </AppShell>
  );
}
