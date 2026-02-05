import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calculator, Calendar, History, RefreshCw, AlertCircle } from "lucide-react";
import { useRentAdjustments, IndexAdjustmentCandidate } from "@/hooks/useRentAdjustments";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { LoadingState } from "@/components/shared/LoadingState";
import { IndexAdjustmentDialog } from "@/components/rent/IndexAdjustmentDialog";
import { StaffelRentTab } from "@/components/rent/StaffelRentTab";
import { RentIncreaseTab } from "@/components/rent/RentIncreaseTab";

export default function RentAdjustments() {
  const [activeTab, setActiveTab] = useState("index");
  const [selectedCandidate, setSelectedCandidate] = useState<IndexAdjustmentCandidate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { 
    useCurrentVPI, 
    useAdjustmentsList, 
    checkIndexAdjustments 
  } = useRentAdjustments();

  const { data: currentVPI, isLoading: vpiLoading } = useCurrentVPI();
  const { data: adjustments, isLoading: adjustmentsLoading } = useAdjustmentsList();
  const { 
    mutate: checkAdjustments, 
    data: eligibleData, 
    isPending: checking 
  } = checkIndexAdjustments;

  const indexColumns: ColumnDef<IndexAdjustmentCandidate>[] = [
    {
      accessorKey: "tenant",
      header: "Mieter",
    },
    {
      accessorKey: "unit",
      header: "Einheit",
    },
    {
      accessorKey: "lastAdjustmentDate",
      header: "Letzte Anpassung",
      cell: ({ row }) => format(new Date(row.original.lastAdjustmentDate), "dd.MM.yyyy", { locale: de }),
    },
    {
      accessorKey: "indexAtLastAdjustment",
      header: "Index damals",
      cell: ({ row }) => row.original.indexAtLastAdjustment.toFixed(1),
    },
    {
      accessorKey: "currentRentEuro",
      header: "Aktuelle Miete",
      cell: ({ row }) => `${row.original.currentRentEuro} €`,
    },
    {
      accessorKey: "newRentEuro",
      header: "Neue Miete",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{row.original.newRentEuro} €</span>
      ),
    },
    {
      accessorKey: "differenceEuro",
      header: "Differenz",
      cell: ({ row }) => (
        <span className="text-green-600">+{row.original.differenceEuro} €</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === "due" ? "default" : status === "recently_adjusted" ? "secondary" : "outline"}
            className={status === "due" ? "bg-orange-500" : ""}
          >
            {status === "due" ? "Fällig" : status === "recently_adjusted" ? "Kürzlich angepasst" : "Nicht berechtigt"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          onClick={() => {
            setSelectedCandidate(row.original);
            setDialogOpen(true);
          }}
          disabled={row.original.status !== "due"}
        >
          Anpassen
        </Button>
      ),
    },
  ];

  const historyColumns: ColumnDef<any>[] = [
    {
      accessorKey: "effective_date",
      header: "Datum",
      cell: ({ row }) => format(new Date(row.original.effective_date), "dd.MM.yyyy", { locale: de }),
    },
    {
      accessorKey: "type",
      header: "Typ",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <Badge variant="outline">
            {type === "index" ? "Index" : type === "staffel" ? "Staffel" : "Vergleichsmiete"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "leases",
      header: "Mieter / Einheit",
      cell: ({ row }) => {
        const lease = row.original.leases;
        if (!lease) return "-";
        const tenant = lease.tenants;
        const unit = lease.units;
        return (
          <div>
            <div className="font-medium">
              {tenant ? `${tenant.first_name} ${tenant.last_name}` : "-"}
            </div>
            <div className="text-sm text-muted-foreground">
              {unit ? `${unit.buildings?.name} - ${unit.unit_number}` : "-"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "old_rent_cents",
      header: "Alte Miete",
      cell: ({ row }) => `${(row.original.old_rent_cents / 100).toFixed(2)} €`,
    },
    {
      accessorKey: "new_rent_cents",
      header: "Neue Miete",
      cell: ({ row }) => `${(row.original.new_rent_cents / 100).toFixed(2)} €`,
    },
    {
      id: "difference",
      header: "Änderung",
      cell: ({ row }) => {
        const diff = row.original.new_rent_cents - row.original.old_rent_cents;
        const percent = ((diff / row.original.old_rent_cents) * 100).toFixed(1);
        return (
          <span className={diff > 0 ? "text-green-600" : "text-red-600"}>
            {diff > 0 ? "+" : ""}{(diff / 100).toFixed(2)} € ({percent}%)
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === "active" ? "default" : status === "announced" ? "secondary" : "outline"}
          >
            {status === "active" ? "Aktiv" : status === "announced" ? "Angekündigt" : status === "pending" ? "Ausstehend" : "Abgebrochen"}
          </Badge>
        );
      },
    },
  ];

  if (vpiLoading) {
    return <LoadingState />;
  }

  const yoyChange = currentVPI?.change_yoy_percent || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mietanpassungen"
        subtitle="Verwalten Sie Index-, Staffel- und Vergleichsmieterhöhungen"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Mietanpassungen" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="index" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Indexmieten
          </TabsTrigger>
          <TabsTrigger value="staffel" className="gap-2">
            <Calendar className="h-4 w-4" />
            Staffelmieten
          </TabsTrigger>
          <TabsTrigger value="increase" className="gap-2">
            <Calculator className="h-4 w-4" />
            Mieterhöhungen
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="index" className="space-y-6">
          {/* VPI Info Banner */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Aktueller Verbraucherpreisindex (Basis 2020 = 100)
                  </p>
                  <p className="text-2xl font-bold">
                    {currentVPI?.value.toFixed(1)}
                    <span className={`ml-2 text-lg ${yoyChange > 0 ? "text-red-500" : "text-green-500"}`}>
                      {yoyChange > 0 ? "+" : ""}{yoyChange.toFixed(1)}% zum Vorjahr
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stand: {currentVPI?.month}/{currentVPI?.year}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => checkAdjustments()}
                disabled={checking}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                Anpassungen prüfen
              </Button>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {eligibleData && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Indexverträge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{eligibleData.summary.totalIndexContracts}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Anpassungsberechtigt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{eligibleData.summary.eligibleForAdjustment}</p>
                </CardContent>
              </Card>
              <Card className="border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-600">
                    Jetzt fällig
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">{eligibleData.summary.dueNow}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">
                    Potenzielle Mehreinnahmen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    +{eligibleData.summary.totalPotentialIncreaseEuro} €/Monat
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Eligible Adjustments Table */}
          {eligibleData?.adjustments && eligibleData.adjustments.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Anpassungsberechtigte Verträge</CardTitle>
                    <CardDescription>
                      Verträge, bei denen eine Indexanpassung möglich ist
                    </CardDescription>
                  </div>
                  {eligibleData.summary.dueNow > 0 && (
                    <Button>
                      Alle fälligen anpassen ({eligibleData.summary.dueNow})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={indexColumns}
                  data={eligibleData.adjustments}
                  searchable
                  searchPlaceholder="Mieter oder Einheit suchen..."
                  pagination
                  pageSize={10}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Keine Indexverträge gefunden</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Klicken Sie auf "Anpassungen prüfen" um berechtigte Verträge zu finden
                </p>
                <Button onClick={() => checkAdjustments()} disabled={checking}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                  Jetzt prüfen
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="staffel">
          <StaffelRentTab />
        </TabsContent>

        <TabsContent value="increase">
          <RentIncreaseTab />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mietanpassungs-Historie</CardTitle>
              <CardDescription>
                Alle durchgeführten Mietanpassungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adjustmentsLoading ? (
                <LoadingState />
              ) : adjustments && adjustments.length > 0 ? (
                <DataTable
                  columns={historyColumns}
                  data={adjustments}
                  searchable
                  searchPlaceholder="Suchen..."
                  pagination
                  pageSize={15}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Noch keine Mietanpassungen vorhanden
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedCandidate && (
        <IndexAdjustmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          candidate={selectedCandidate}
          currentVPI={currentVPI}
        />
      )}
    </div>
  );
}