import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Calculator, AlertTriangle, FileText, TrendingUp, Info } from "lucide-react";
import { useRentAdjustments } from "@/hooks/useRentAdjustments";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { LoadingState } from "@/components/shared/LoadingState";

interface VergleichsmieteCandidate {
  leaseId: string;
  tenant: string;
  unit: string;
  currentRent: number;
  marketRent: number;
  potentialIncrease: number;
  increasePercent: number;
  cappedIncrease: number;
  cappedPercent: number;
  threeYearIncreasePercent: number;
  cappingApplied: boolean;
}

export function RentIncreaseTab() {
  const { useLeasesWithSettings, useAdjustmentsList } = useRentAdjustments();
  const { data: leases, isLoading } = useLeasesWithSettings();
  const { data: adjustments } = useAdjustmentsList({ type: "vergleichsmiete" });

  // Filter to contracts eligible for Vergleichsmiete (no index or staffel)
  const eligibleContracts = (leases || [])
    .filter((l: any) => 
      !l.lease_rent_settings || 
      l.lease_rent_settings.rent_type === "vergleichsmiete"
    );

  // Calculate mock market comparison (in real app, would use Mietspiegel data)
  const candidates: VergleichsmieteCandidate[] = eligibleContracts.map((lease: any) => {
    const currentRent = lease.rent_amount;
    // Simulated market rent (typically 10-30% above current for older contracts)
    const marketRent = currentRent * (1.1 + Math.random() * 0.2);
    const potentialIncrease = marketRent - currentRent;
    const increasePercent = (potentialIncrease / currentRent) * 100;
    
    // Calculate 3-year increase (check adjustment history)
    const leaseAdjustments = (adjustments || []).filter(
      (a: any) => a.lease_id === lease.id && 
        new Date(a.effective_date) > new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)
    );
    const threeYearIncrease = leaseAdjustments.reduce(
      (sum: number, a: any) => sum + ((a.new_rent_cents - a.old_rent_cents) / a.old_rent_cents) * 100,
      0
    );
    
    // Apply Kappungsgrenze (15-20% in 3 years depending on region)
    const kappungsgrenze = 15; // Use 15% for tight housing markets
    const remainingCap = Math.max(0, kappungsgrenze - threeYearIncrease);
    const cappedPercent = Math.min(increasePercent, remainingCap);
    const cappedIncrease = currentRent * (cappedPercent / 100);
    const cappingApplied = cappedPercent < increasePercent;

    return {
      leaseId: lease.id,
      tenant: lease.tenants ? `${lease.tenants.first_name} ${lease.tenants.last_name}` : "Unbekannt",
      unit: lease.units ? `${lease.units.buildings?.name} - ${lease.units.unit_number}` : "Unbekannt",
      currentRent,
      marketRent: parseFloat(marketRent.toFixed(2)),
      potentialIncrease: parseFloat(potentialIncrease.toFixed(2)),
      increasePercent: parseFloat(increasePercent.toFixed(1)),
      cappedIncrease: parseFloat(cappedIncrease.toFixed(2)),
      cappedPercent: parseFloat(cappedPercent.toFixed(1)),
      threeYearIncreasePercent: parseFloat(threeYearIncrease.toFixed(1)),
      cappingApplied,
    };
  });

  const columns: ColumnDef<VergleichsmieteCandidate>[] = [
    {
      accessorKey: "tenant",
      header: "Mieter",
    },
    {
      accessorKey: "unit",
      header: "Einheit",
    },
    {
      accessorKey: "currentRent",
      header: "Aktuelle Miete",
      cell: ({ row }) => `${row.original.currentRent.toFixed(2)} €`,
    },
    {
      accessorKey: "marketRent",
      header: "Ortsübliche Miete",
      cell: ({ row }) => `${row.original.marketRent.toFixed(2)} €`,
    },
    {
      accessorKey: "threeYearIncreasePercent",
      header: "3-Jahres-Erhöhung",
      cell: ({ row }) => {
        const percent = row.original.threeYearIncreasePercent;
        const isHigh = percent >= 10;
        return (
          <span className={isHigh ? "text-orange-600" : ""}>
            {percent.toFixed(1)}%
          </span>
        );
      },
    },
    {
      accessorKey: "cappedPercent",
      header: "Mögliche Erhöhung",
      cell: ({ row }) => {
        const { cappedPercent, cappedIncrease, cappingApplied } = row.original;
        return (
          <div>
            <span className="font-semibold text-green-600">
              +{cappedIncrease.toFixed(2)} € ({cappedPercent.toFixed(1)}%)
            </span>
            {cappingApplied && (
              <Badge variant="outline" className="ml-2 text-xs">
                Gekappt
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <FileText className="h-4 w-4 mr-1" />
            Begründung
          </Button>
          <Button size="sm" disabled={row.original.cappedPercent <= 0}>
            Erhöhen
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingState />;
  }

  const totalPotential = candidates.reduce((sum, c) => sum + c.cappedIncrease, 0);
  const eligibleCount = candidates.filter(c => c.cappedPercent > 0).length;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Mieterhöhung nach Vergleichsmiete (§ 558 BGB)</strong>
          <br />
          Die Miete kann bis zur ortsüblichen Vergleichsmiete erhöht werden. Dabei gilt die Kappungsgrenze: 
          In Gebieten mit angespanntem Wohnungsmarkt maximal 15% in 3 Jahren, sonst 20%.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verträge ohne Index/Staffel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{eligibleContracts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Erhöhung möglich
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{eligibleCount}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              Kappungsgrenze erreicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {candidates.filter(c => c.cappingApplied).length}
            </p>
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
              +{totalPotential.toFixed(2)} €/Monat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kappungsgrenze Explanation */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Kappungsgrenze beachten
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                In angespannten Wohnungsmärkten darf die Miete innerhalb von 3 Jahren um maximal 15% steigen.
                Die Berechnung berücksichtigt bereits erfolgte Erhöhungen in den letzten 3 Jahren.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mieterhöhungspotenzial</CardTitle>
          <CardDescription>
            Verträge mit möglicher Anpassung an die ortsübliche Vergleichsmiete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length > 0 ? (
            <DataTable
              columns={columns}
              data={candidates}
              searchable
              searchPlaceholder="Mieter oder Einheit suchen..."
              pagination
              pageSize={10}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Keine Verträge für Vergleichsmieterhöhung gefunden
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}