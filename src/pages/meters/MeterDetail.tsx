import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { Gauge } from "lucide-react";

export default function MeterDetail() {
  const { id } = useParams();
  
  return (
    <MainLayout 
      title="Zählerdetails" 
      breadcrumbs={[
        { label: "Zähler", href: "/zaehler" },
        { label: "Details" }
      ]}
    >
      <EmptyState
        icon={Gauge}
        title="Coming Soon"
        description={`Die Detailansicht für Zähler ${id} wird bald verfügbar sein.`}
      />
    </MainLayout>
  );
}
