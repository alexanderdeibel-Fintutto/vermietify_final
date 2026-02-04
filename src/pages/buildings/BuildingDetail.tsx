import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { Building2 } from "lucide-react";

export default function BuildingDetail() {
  const { id } = useParams();
  
  return (
    <MainLayout 
      title="Gebäudedetails" 
      breadcrumbs={[
        { label: "Immobilien", href: "/properties" },
        { label: "Gebäude" }
      ]}
    >
      <EmptyState
        icon={Building2}
        title="Coming Soon"
        description={`Die Detailansicht für Gebäude ${id} wird bald verfügbar sein.`}
      />
    </MainLayout>
  );
}
