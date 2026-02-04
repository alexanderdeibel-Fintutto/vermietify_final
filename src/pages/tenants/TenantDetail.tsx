import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { User } from "lucide-react";

export default function TenantDetail() {
  const { id } = useParams();
  
  return (
    <MainLayout 
      title="Mieterdetails" 
      breadcrumbs={[
        { label: "Mieter", href: "/tenants" },
        { label: "Details" }
      ]}
    >
      <EmptyState
        icon={User}
        title="Coming Soon"
        description={`Die Detailansicht für Mieter ${id} wird bald verfügbar sein.`}
      />
    </MainLayout>
  );
}
