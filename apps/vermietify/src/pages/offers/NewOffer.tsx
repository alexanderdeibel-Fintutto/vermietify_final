import { MainLayout } from "@/components/layout/MainLayout";
import { OfferWizard } from "@/components/offers/OfferWizard";

export default function NewOffer() {
  return (
    <MainLayout
      title="Neues Mietangebot"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Mietangebote", href: "/angebote" },
        { label: "Neues Angebot" },
      ]}
    >
      <OfferWizard />
    </MainLayout>
  );
}
