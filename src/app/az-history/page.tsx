import { AppShell } from "@/components/layout/app-shell";
import { AzHistoryList } from "@/components/az/az-history-list";
import { AzProgressCard } from "@/components/az/az-progress-card";
import { getStudentAzDashboard } from "@/app/actions/az";

export const dynamic = "force-dynamic";

export default async function AzHistoryPage() {
  const studentId = process.env.DEMO_STUDENT_ID ?? "student-demo-001";
  const { summary, history } = await getStudentAzDashboard(studentId);

  return (
    <AppShell
      eyebrow="Ledger"
      title="История AZ"
      subtitle="Каждая операция сохраняется: действие, максимум, факт, качество, причина, версия правила."
    >
      <AzProgressCard summary={summary} />
      <div className="mt-12">
        <AzHistoryList items={history} />
      </div>
    </AppShell>
  );
}
