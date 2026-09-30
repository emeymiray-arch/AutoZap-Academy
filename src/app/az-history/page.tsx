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
      title="История AZ"
      subtitle="Каждое изменение AZ сохраняется в ledger: действие, максимум, факт, качество, причина, правило."
    >
      <div className="mb-8">
        <AzProgressCard summary={summary} />
      </div>
      <AzHistoryList items={history} />
    </AppShell>
  );
}
