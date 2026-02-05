 import { MainLayout } from "@/components/layout/MainLayout";
 import { ContractWizard } from "@/components/contracts/ContractWizard";
 
 export default function NewContract() {
   return (
     <MainLayout
       title="Neuer Mietvertrag"
       breadcrumbs={[
         { label: "Dashboard", href: "/" },
         { label: "Mietverträge", href: "/vertraege" },
         { label: "Neuer Vertrag" },
       ]}
     >
       <ContractWizard />
     </MainLayout>
   );
 }