import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { Receipt } from "lucide-react";

export default function OperatingCosts() {
  return (
    <MainLayout 
      title="Betriebskosten" 
      breadcrumbs={[{ label: "Betriebskosten" }]}
    >
      <EmptyState
        icon={Receipt}
        title="Coming Soon"
        description="Die Betriebskostenverwaltung wird bald verfügbar sein. Hier können Sie Nebenkostenabrechnungen erstellen und verwalten."
      />
    </MainLayout>
  );
}
