import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { FileSignature } from "lucide-react";

export default function ContractList() {
  return (
    <MainLayout 
      title="Verträge" 
      breadcrumbs={[{ label: "Verträge" }]}
    >
      <EmptyState
        icon={FileSignature}
        title="Coming Soon"
        description="Die Vertragsverwaltung wird bald verfügbar sein. Hier können Sie alle Mietverträge einsehen und verwalten."
      />
    </MainLayout>
  );
}
