import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { CheckSquare } from "lucide-react";

export default function TaskList() {
  return (
    <MainLayout 
      title="Aufgaben" 
      breadcrumbs={[{ label: "Aufgaben" }]}
    >
      <EmptyState
        icon={CheckSquare}
        title="Coming Soon"
        description="Die Aufgabenverwaltung wird bald verfügbar sein. Organisieren Sie hier alle anstehenden Aufgaben und Reparaturen."
      />
    </MainLayout>
  );
}
