import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { CheckSquare } from "lucide-react";

export default function TaskDetail() {
  const { id } = useParams();
  
  return (
    <MainLayout 
      title="Aufgabendetails" 
      breadcrumbs={[
        { label: "Aufgaben", href: "/aufgaben" },
        { label: "Details" }
      ]}
    >
      <EmptyState
        icon={CheckSquare}
        title="Coming Soon"
        description={`Die Detailansicht für Aufgabe ${id} wird bald verfügbar sein.`}
      />
    </MainLayout>
  );
}
