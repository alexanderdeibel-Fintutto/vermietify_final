import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/shared";
import { PlusCircle } from "lucide-react";

export default function NewTask() {
  return (
    <MainLayout 
      title="Neue Aufgabe" 
      breadcrumbs={[
        { label: "Aufgaben", href: "/aufgaben" },
        { label: "Neue Aufgabe" }
      ]}
    >
      <EmptyState
        icon={PlusCircle}
        title="Coming Soon"
        description="Das Formular für neue Aufgaben wird bald verfügbar sein."
      />
    </MainLayout>
  );
}
