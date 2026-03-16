import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { DoorOpen } from "lucide-react";

export default function UnitDetail() {
  const { id } = useParams();
  
  return (
    <MainLayout 
      title="Einheitendetails" 
      breadcrumbs={[
        { label: "Immobilien", href: "/properties" },
        { label: "Einheiten" }
      ]}
    >
      <EmptyState
        icon={DoorOpen}
        title="Coming Soon"
        description={`Die Detailansicht für Einheit ${id} wird bald verfügbar sein.`}
      />
    </MainLayout>
  );
}
