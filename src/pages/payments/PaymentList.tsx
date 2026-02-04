import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { CreditCard } from "lucide-react";

export default function PaymentList() {
  return (
    <MainLayout 
      title="Zahlungen" 
      breadcrumbs={[{ label: "Zahlungen" }]}
    >
      <EmptyState
        icon={CreditCard}
        title="Coming Soon"
        description="Die Zahlungsübersicht wird bald verfügbar sein. Hier können Sie alle Mietzahlungen verfolgen und verwalten."
      />
    </MainLayout>
  );
}
