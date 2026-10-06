import { AppShell } from "@/components/layout/app-shell";
import { AzHistoryList } from "@/components/az/az-history-list";
import { AzProgressCard } from "@/components/az/az-progress-card";
import { getStudentAzDashboard } from "@/app/actions/az";
import { requireUser } from "@server/auth/session";

export const dynamic = "force-dynamic";

export default async function AzHistoryPage() {
  const user = await requireUser();
  const { summary, history } = await getStudentAzDashboard(user.id);

  return (
    <AppShell
      user={user}
      title="История AZ"
      subtitle="Каждая операция: действие, максимум, факт, качество, причина, версия правила."
    >
      <div className="az-glass-strong mb-5 p-5">
        <AzProgressCard summary={summary} />
      </div>
      <div className="az-glass-strong p-5">
        <AzHistoryList items={history} />
      </div>
    </AppShell>
  );
}
