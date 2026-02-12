import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, LoadingState, EmptyState } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useBuildings } from "@/hooks/useBuildings";
import { UnitFormDialog } from "@/components/buildings/UnitFormDialog";
import { BuildingEditDialog } from "@/components/buildings/BuildingEditDialog";
import { BuildingOverviewTab } from "@/components/buildings/BuildingOverviewTab";
import { BuildingUnitsTab } from "@/components/buildings/BuildingUnitsTab";
import { BuildingDocumentsTab } from "@/components/buildings/BuildingDocumentsTab";
import { BuildingFinancesTab } from "@/components/buildings/BuildingFinancesTab";
import { Building2, Edit, Plus, AlertCircle, Gauge } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BuildingMetersTab } from "@/components/buildings/BuildingMetersTab";

export default function BuildingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useBuilding } = useBuildings();
  const { data: building, isLoading, error } = useBuilding(id);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <MainLayout
        title="Gebäude lädt..."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Immobilien", href: "/properties" },
          { label: "Lädt..." },
        ]}
      >
        <LoadingState rows={6} />
      </MainLayout>
    );
  }

  if (error || !building) {
    return (
      <MainLayout
        title="Fehler"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Immobilien", href: "/properties" },
          { label: "Fehler" },
        ]}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler beim Laden</AlertTitle>
          <AlertDescription>
            {error?.message || "Das Gebäude konnte nicht gefunden werden."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/properties")}>
            Zurück zur Übersicht
          </Button>
        </div>
      </MainLayout>
    );
  }

  const fullAddress = `${building.address}, ${building.postal_code} ${building.city}`;

  return (
    <MainLayout
      title={building.name}
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Immobilien", href: "/properties" },
        { label: building.name },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title={building.name}
          subtitle={fullAddress}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              <Button onClick={() => setUnitDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Einheit hinzufügen
              </Button>
            </div>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="units">Einheiten</TabsTrigger>
            <TabsTrigger value="meters">
              <Gauge className="h-4 w-4 mr-1" />
              Zähler
            </TabsTrigger>
            <TabsTrigger value="documents">Dokumente</TabsTrigger>
            <TabsTrigger value="finances">Finanzen</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <BuildingOverviewTab building={building} />
          </TabsContent>

          <TabsContent value="units" className="mt-6">
            <BuildingUnitsTab 
              building={building} 
              onAddUnit={() => setUnitDialogOpen(true)} 
            />
          </TabsContent>

          <TabsContent value="meters" className="mt-6">
            <BuildingMetersTab
              buildingId={building.id}
              units={(building as any).units?.map((u: any) => ({ id: u.id, unit_number: u.unit_number })) || []}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <BuildingDocumentsTab buildingId={building.id} />
          </TabsContent>

          <TabsContent value="finances" className="mt-6">
            <BuildingFinancesTab building={building} />
          </TabsContent>
        </Tabs>
      </div>

      <UnitFormDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        buildingId={building.id}
      />

      <BuildingEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        building={building}
      />
    </MainLayout>
  );
}
