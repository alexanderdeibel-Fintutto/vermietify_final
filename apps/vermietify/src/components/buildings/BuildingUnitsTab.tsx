import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import type { Database } from "@/integrations/supabase/types";
import { BulkImportDialog } from "@/components/import/BulkImportDialog";

type BuildingRow = Database["public"]["Tables"]["buildings"]["Row"];
type UnitRow = Database["public"]["Tables"]["units"]["Row"];

interface BuildingWithUnits extends BuildingRow {
  units: UnitRow[];
}

interface BuildingUnitsTabProps {
  building: BuildingWithUnits;
  onAddUnit: () => void;
}

export function BuildingUnitsTab({ building, onAddUnit }: BuildingUnitsTabProps) {
  const navigate = useNavigate();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const units = building.units || [];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      rented: { label: "Vermietet", variant: "default" },
      vacant: { label: "Frei", variant: "secondary" },
      renovating: { label: "Wartung", variant: "outline" },
    };
    const { label, variant } = config[status] || { label: status, variant: "outline" };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatCurrency = (cents: number) => {
    return `${(cents / 100).toLocaleString("de-DE")} €`;
  };

  const columns: ColumnDef<UnitRow>[] = [
    {
      accessorKey: "unit_number",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.unit_number}</span>
      ),
    },
    {
      accessorKey: "floor",
      header: "Etage",
      cell: ({ row }) => {
        const floor = row.original.floor;
        if (floor === null || floor === undefined) return "-";
        if (floor === 0) return "EG";
        if (floor < 0) return `${floor}. UG`;
        return `${floor}. OG`;
      },
    },
    {
      accessorKey: "area",
      header: "m²",
      cell: ({ row }) => (
        <span>{row.original.area ? `${row.original.area} m²` : "-"}</span>
      ),
    },
    {
      accessorKey: "rooms",
      header: "Zimmer",
      cell: ({ row }) => (
        <span>{row.original.rooms || "-"}</span>
      ),
    },
    {
      accessorKey: "rent_amount",
      header: "Miete kalt",
      cell: ({ row }) => (
        <span>{formatCurrency(row.original.rent_amount)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: "tenant",
      header: "Mieter",
      cell: ({ row }) => {
        // TODO: Fetch tenant info from lease
        if (row.original.status === "rented") {
          return <span className="text-muted-foreground">Mieter vorhanden</span>;
        }
        return <span className="text-muted-foreground">-</span>;
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/einheiten/${row.original.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Anzeigen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/einheiten/${row.original.id}/bearbeiten`)}>
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Einheiten</h3>
          <p className="text-sm text-muted-foreground">
            {units.length} Einheiten in diesem Gebäude
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            PDF/CSV Import
          </Button>
          <Button onClick={onAddUnit}>
            <Plus className="h-4 w-4 mr-2" />
            Einheit hinzufügen
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={units}
        searchable
        searchPlaceholder="Einheiten durchsuchen..."
        pagination={units.length > 10}
        pageSize={10}
      />

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        type="units"
        buildingId={building.id}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
