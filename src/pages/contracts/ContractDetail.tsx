import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { FileSignature } from "lucide-react";

export default function ContractDetail() {
  const { id } = useParams();
  
  return (
    <MainLayout 
      title="Vertragsdetails" 
      breadcrumbs={[
        { label: "Verträge", href: "/vertraege" },
        { label: "Details" }
      ]}
    >
      <EmptyState
        icon={FileSignature}
        title="Coming Soon"
        description={`Die Detailansicht für Vertrag ${id} wird bald verfügbar sein.`}
      />
    </MainLayout>
  );
}
