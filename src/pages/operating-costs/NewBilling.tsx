import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { PlusCircle } from "lucide-react";

export default function NewBilling() {
  return (
    <MainLayout 
      title="Neue Abrechnung" 
      breadcrumbs={[
        { label: "Betriebskosten", href: "/betriebskosten" },
        { label: "Neue Abrechnung" }
      ]}
    >
      <EmptyState
        icon={PlusCircle}
        title="Coming Soon"
        description="Der Abrechnungsassistent wird bald verfügbar sein. Erstellen Sie hier neue Nebenkostenabrechnungen."
      />
    </MainLayout>
  );
}
