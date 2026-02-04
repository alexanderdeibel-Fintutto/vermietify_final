import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { Gauge } from "lucide-react";

export default function MeterDashboard() {
  return (
    <MainLayout 
      title="Zähler" 
      breadcrumbs={[{ label: "Zähler" }]}
    >
      <EmptyState
        icon={Gauge}
        title="Coming Soon"
        description="Die Zählerverwaltung wird bald verfügbar sein. Erfassen und verwalten Sie hier alle Zählerstände."
      />
    </MainLayout>
  );
}
