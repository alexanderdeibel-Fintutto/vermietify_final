import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, StatCard, DataTable, EmptyState, LoadingState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building,
  Calculator,
  TrendingDown,
  Users,
  MoreHorizontal,
  FileText,
  Trash2,
  Info,
  AlertCircle,
  Leaf,
} from "lucide-react";
import { useCO2, getStageColor } from "@/hooks/useCO2";
import { CO2Calculator } from "@/components/co2/CO2Calculator";
import { ColumnDef } from "@tanstack/react-table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface BuildingWithCO2 {
  id: string;
  name: string;
  address: string;
  total_area: number | null;
  latestCalculation: {
    id: string;
    co2_per_sqm_year: number;
    stage: number;
    landlord_share_percent: number;
    tenant_share_percent: number;
    period_start: string;
    period_end: string;
    total_co2_cost_cents: number;
    landlord_cost_cents: number;
    tenant_cost_cents: number;
  } | null;
  certificate: {
    id: string;
    certificate_type: string;
    energy_source: string;
    valid_until: string | null;
  } | null;
}

export default function CO2Dashboard() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const { buildingsWithCO2, buildingsLoading, stats, deleteCalculation } = useCO2();

  const handleOpenCalculator = (buildingId?: string) => {
    setSelectedBuildingId(buildingId);
    setCalculatorOpen(true);
  };

  const handleDelete = () => {
    if (deleteDialog.id) {
      deleteCalculation.mutate(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
    }
  };

  const columns: ColumnDef<BuildingWithCO2>[] = [
    {
      accessorKey: "name",
      header: "Gebäude",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.address}</div>
        </div>
      ),
    },
    {
      accessorKey: "certificate",
      header: "Energieausweis",
      cell: ({ row }) => {
        const cert = row.original.certificate;
        if (!cert) {
          return <Badge variant="outline" className="text-muted-foreground">Nicht vorhanden</Badge>;
        }
        return (
          <Badge variant="secondary">
            {cert.certificate_type === "bedarfsausweis" ? "Bedarfsausweis" : "Verbrauchsausweis"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "co2_per_sqm_year",
      header: "CO2-Ausstoß",
      cell: ({ row }) => {
        const calc = row.original.latestCalculation;
        if (!calc) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="font-medium">
            {calc.co2_per_sqm_year.toFixed(1)} kg/m²/a
          </div>
        );
      },
    },
    {
      accessorKey: "stage",
      header: "Stufe",
      cell: ({ row }) => {
        const calc = row.original.latestCalculation;
        if (!calc) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <Badge className={`${getStageColor(calc.stage)} text-primary-foreground`}>
            Stufe {calc.stage}
          </Badge>
        );
      },
    },
    {
      accessorKey: "landlord_share",
      header: "Vermieter-Anteil",
      cell: ({ row }) => {
        const calc = row.original.latestCalculation;
        if (!calc) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="text-destructive font-medium">{calc.landlord_share_percent}%</div>
        );
      },
    },
    {
      accessorKey: "tenant_share",
      header: "Mieter-Anteil",
      cell: ({ row }) => {
        const calc = row.original.latestCalculation;
        if (!calc) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="text-primary font-medium">{calc.tenant_share_percent}%</div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const calc = row.original.latestCalculation;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenCalculator(row.original.id)}>
                <Calculator className="mr-2 h-4 w-4" />
                {calc ? "Neu berechnen" : "Berechnen"}
              </DropdownMenuItem>
              {calc && (
                <>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    PDF-Nachweis
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialog({ open: true, id: calc.id })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Berechnung löschen
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (buildingsLoading) {
    return (
      <MainLayout title="CO2-Kostenaufteilung">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="CO2-Kostenaufteilung">
      <div className="space-y-6">
        <PageHeader
          title="CO2-Kostenaufteilung"
          subtitle="Aufteilung der CO2-Kosten nach CO2KostAufG"
          actions={
            <Button onClick={() => handleOpenCalculator()}>
              <Calculator className="mr-2 h-4 w-4" />
              Neue Berechnung
            </Button>
          }
        />

        {/* Info Banner */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>CO2-Kostenaufteilungsgesetz (CO2KostAufG)</AlertTitle>
          <AlertDescription>
            Seit 2023 müssen CO2-Kosten zwischen Vermieter und Mieter aufgeteilt werden. Die
            Aufteilung richtet sich nach der energetischen Qualität des Gebäudes: Je schlechter die
            CO2-Bilanz, desto mehr trägt der Vermieter.
          </AlertDescription>
        </Alert>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Gebäude mit CO2-Daten"
            value={`${stats.buildingsWithData} / ${stats.totalBuildings}`}
            icon={Building}
            description="Berechnungen vorhanden"
          />
          <StatCard
            title="Ø Effizienz"
            value={
              stats.averageEfficiency > 0
                ? `${stats.averageEfficiency.toFixed(1)} kg/m²/a`
                : "-"
            }
            icon={Leaf}
            description="CO2-Ausstoß Durchschnitt"
          />
          <StatCard
            title="Ø Vermieter-Anteil"
            value={
              stats.averageLandlordShare > 0
                ? `${stats.averageLandlordShare.toFixed(0)}%`
                : "-"
            }
            icon={Users}
            description="Durchschnittliche Beteiligung"
          />
          <StatCard
            title="Einspar-Potenzial"
            value={
              stats.buildingsWithData > 0 && stats.averageEfficiency > 12
                ? "Vorhanden"
                : "-"
            }
            icon={TrendingDown}
            description="Durch energetische Sanierung"
          />
        </div>

        {/* Stufen-Übersicht */}
        <Card className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Stufenmodell nach CO2KostAufG
          </h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {[
              { stage: 1, kg: "<12", landlord: 0 },
              { stage: 2, kg: "12-17", landlord: 10 },
              { stage: 3, kg: "17-22", landlord: 20 },
              { stage: 4, kg: "22-27", landlord: 30 },
              { stage: 5, kg: "27-32", landlord: 40 },
              { stage: 6, kg: "32-37", landlord: 50 },
              { stage: 7, kg: "37-42", landlord: 60 },
              { stage: 8, kg: "42-47", landlord: 70 },
              { stage: 9, kg: "47-52", landlord: 80 },
              { stage: 10, kg: ">52", landlord: 95 },
            ].map((s) => (
              <div
                key={s.stage}
                className={`p-2 rounded text-center text-primary-foreground ${getStageColor(s.stage)}`}
              >
                <div className="text-xs font-bold">Stufe {s.stage}</div>
                <div className="text-[10px] opacity-80">{s.kg}</div>
                <div className="text-xs mt-1">{s.landlord}%</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Angaben: kg CO2/m²/Jahr | Vermieter-Anteil an CO2-Kosten
          </p>
        </Card>

        {/* Buildings Table */}
        {buildingsWithCO2.length === 0 ? (
          <EmptyState
            icon={Building}
            title="Keine Gebäude vorhanden"
            description="Erstellen Sie zuerst ein Gebäude, um CO2-Berechnungen durchzuführen."
            action={
              <Button variant="outline" asChild>
                <a href="/properties">Zu den Immobilien</a>
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={buildingsWithCO2 as BuildingWithCO2[]}
            searchable
            searchPlaceholder="Gebäude suchen..."
          />
        )}
      </div>

      <CO2Calculator
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        preselectedBuildingId={selectedBuildingId}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Berechnung löschen?"
        description="Diese CO2-Berechnung wird unwiderruflich gelöscht."
        onConfirm={handleDelete}
        confirmLabel="Löschen"
        destructive
      />
    </MainLayout>
  );
}
