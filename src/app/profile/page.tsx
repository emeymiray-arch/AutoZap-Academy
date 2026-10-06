import { AppShell } from "@/components/layout/app-shell";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { getStudentAzDashboard } from "@/app/actions/az";
import { requireUser } from "@server/auth/session";
import { formatAz } from "@/lib/utils";
import { displayName, initials } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const summary = isAdmin ? null : (await getStudentAzDashboard(user.id)).summary;

  return (
    <AppShell user={user} title="Мой профиль">
      <div className="md:mx-auto md:max-w-xl">
        <div className="mb-3 flex flex-wrap items-center gap-3 py-1 md:mb-5">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover md:h-16 md:w-16" />
          ) : (
            <span className="az-brand-grad grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-white md:h-16 md:w-16">
              {initials(displayName(user))}
            </span>
          )}
          <div>
            <h2 className="text-lg font-extrabold text-white md:text-xl">{displayName(user)}</h2>
            <p className="text-xs text-[var(--muted)] md:text-sm">{user.email}</p>
          </div>
        </div>

        {!isAdmin && summary ? (
          <div className="mb-3 grid grid-cols-3 gap-2 md:mb-5 md:flex md:gap-3">
            <div className="az-glass az-tile flex aspect-square flex-col items-center justify-center p-2 text-center md:aspect-auto md:flex-1 md:flex-row md:justify-between md:gap-3 md:px-4 md:py-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)] md:text-xs">
                Уровень
              </p>
              <p className="mt-1 text-xl font-extrabold md:mt-0 md:text-lg">
                {summary.level?.name ?? "—"}
              </p>
            </div>
            <div className="az-glass az-tile flex aspect-square flex-col items-center justify-center p-2 text-center md:aspect-auto md:flex-1 md:flex-row md:justify-between md:gap-3 md:px-4 md:py-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)] md:text-xs">
                AZ
              </p>
              <p className="mt-1 text-xl font-extrabold tabular-nums md:mt-0 md:text-xl">
                {formatAz(summary.balance)}
              </p>
            </div>
            <div className="az-glass az-tile flex aspect-square flex-col items-center justify-center p-2 text-center md:aspect-auto md:flex-1 md:flex-row md:justify-between md:gap-3 md:px-4 md:py-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)] md:text-xs">
                Статус
              </p>
              <p className="mt-1 text-sm font-extrabold md:mt-0 md:text-base">Участник</p>
            </div>
          </div>
        ) : null}

        <ProfileEditForm
          name={user.name}
          nickname={user.nickname ?? ""}
          about={user.about?.replace(/^\[ARCHIVED\]\s*/, "") ?? ""}
          avatarUrl={user.avatarUrl ?? ""}
        />
      </div>
    </AppShell>
  );
}
