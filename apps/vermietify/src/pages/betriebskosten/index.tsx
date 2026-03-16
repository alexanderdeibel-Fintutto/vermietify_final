 import { useState, useMemo } from "react";
 import { useNavigate } from "react-router-dom";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { StatCard, EmptyState, LoadingState } from "@/components/shared";
 import { DataTable } from "@/components/shared/DataTable";
 import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { useOperatingCosts, BillingStatus } from "@/hooks/useOperatingCosts";
 import { useBuildings } from "@/hooks/useBuildings";
 import { formatCurrency } from "@/lib/utils";
 import { PortalToolPromo } from "@/components/portal/PortalToolPromo";
 import {
   Plus,
   FileSpreadsheet,
   MoreHorizontal,
   Eye,
   Pencil,
   Trash2,
   FileText,
   Send,
   Calculator,
   Clock,
   Euro,
   TrendingDown,
 } from "lucide-react";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";

 const STATUS_CONFIG: Record<BillingStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
   draft: { label: "Entwurf", variant: "secondary" },
   calculated: { label: "Berechnet", variant: "outline" },
   sent: { label: "Versendet", variant: "default" },
   completed: { label: "Abgeschlossen", variant: "default" },
 };
 
 const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
 
 export default function OperatingCosts() {
   const navigate = useNavigate();
   const { useBillingsList, useBillingStats, deleteBilling } = useOperatingCosts();
   const { useBuildingsList } = useBuildings();
 
   const [yearFilter, setYearFilter] = useState<string>("all");
   const [buildingFilter, setBuildingFilter] = useState<string>("all");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [deleteTarget, setDeleteTarget] = useState<{ buildingId: string; year: number } | null>(null);
 
   const { data: billings, isLoading } = useBillingsList({
     year: yearFilter !== "all" ? parseInt(yearFilter) : undefined,
     buildingIds: buildingFilter !== "all" ? [buildingFilter] : undefined,
     status: statusFilter !== "all" ? (statusFilter as BillingStatus) : undefined,
   });
   const { data: stats, isLoading: statsLoading } = useBillingStats();
   const { data: buildingsData } = useBuildingsList();
   const buildings = buildingsData?.buildings || [];
 
   const filteredBillings = useMemo(() => {
     if (!billings) return [];
     return billings.filter((b) => {
       if (statusFilter !== "all" && b.status !== statusFilter) return false;
       return true;
     });
   }, [billings, statusFilter]);
 
   const handleDelete = (buildingId: string, year: number) => {
     setDeleteTarget({ buildingId, year });
   };
 
   const confirmDelete = async () => {
     if (deleteTarget) {
       await deleteBilling.mutateAsync(deleteTarget);
       setDeleteTarget(null);
     }
   };
 
   const columns: ColumnDef<any>[] = [
     {
       accessorKey: "building",
       header: "Gebäude",
       cell: ({ row }) => (
         <div>
           <p className="font-medium">{row.original.buildings?.name}</p>
           <p className="text-sm text-muted-foreground">
             {row.original.buildings?.address}
           </p>
         </div>
       ),
     },
     {
       accessorKey: "period",
       header: "Zeitraum",
       cell: ({ row }) => (
         <span>
           {format(new Date(row.original.period_start), "dd.MM.yyyy", { locale: de })} -{" "}
           {format(new Date(row.original.period_end), "dd.MM.yyyy", { locale: de })}
         </span>
       ),
     },
     {
       accessorKey: "unit_count",
       header: "Einheiten",
       cell: ({ row }) => (
         <span>{row.original.unit_count} Einheiten</span>
       ),
     },
     {
       accessorKey: "total_costs",
       header: "Gesamtkosten",
       cell: ({ row }) => (
         <span className="font-semibold">
           {formatCurrency(row.original.total_costs / 100)}
         </span>
       ),
     },
     {
       accessorKey: "status",
       header: "Status",
       cell: ({ row }) => {
         const config = STATUS_CONFIG[row.original.status as BillingStatus];
         return (
           <Badge variant={config?.variant || "secondary"}>
             {config?.label || row.original.status}
           </Badge>
         );
       },
     },
     {
       accessorKey: "created_at",
       header: "Erstellt",
       cell: ({ row }) =>
         format(new Date(row.original.created_at), "dd.MM.yyyy", { locale: de }),
     },
     {
       id: "actions",
       header: "Aktionen",
       cell: ({ row }) => (
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon">
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem
               onClick={() => navigate(`/betriebskosten/${row.original.id}`)}
             >
               <Eye className="h-4 w-4 mr-2" />
               Ansehen
             </DropdownMenuItem>
             <DropdownMenuItem
               onClick={() => navigate(`/betriebskosten/${row.original.id}/bearbeiten`)}
             >
               <Pencil className="h-4 w-4 mr-2" />
               Bearbeiten
             </DropdownMenuItem>
             <DropdownMenuItem>
               <FileText className="h-4 w-4 mr-2" />
               PDF exportieren
             </DropdownMenuItem>
             <DropdownMenuItem>
               <Send className="h-4 w-4 mr-2" />
               Versenden
             </DropdownMenuItem>
             <DropdownMenuItem
               className="text-destructive"
               onClick={() =>
                 handleDelete(row.original.building_id, row.original.billing_year)
               }
             >
               <Trash2 className="h-4 w-4 mr-2" />
               Löschen
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       ),
     },
   ];
 
  return (
    <MainLayout
      title="Betriebskostenabrechnung"
      breadcrumbs={[{ label: "Betriebskosten" }]}
      actions={
        <Button onClick={() => navigate("/betriebskosten/neu")}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Abrechnung
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-20 animate-pulse bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Abrechnungen gesamt"
                value={stats?.totalBillings || 0}
                icon={Calculator}
               />
              <StatCard
                title="Offen / In Bearbeitung"
                value={stats?.pendingBillings || 0}
                icon={Clock}
                description="Noch nicht abgeschlossen"
              />
              <StatCard
                title="Nachzahlungen gesamt"
                value={formatCurrency((stats?.totalPaymentsDue || 0) / 100)}
                icon={Euro}
              />
              <StatCard
                title="Guthaben gesamt"
                value={formatCurrency((stats?.totalCredits || 0) / 100)}
                icon={TrendingDown}
              />
            </>
          )}
        </div>
 
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Jahr" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Jahre</SelectItem>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
 
              <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Gebäude" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Gebäude</SelectItem>
                  {buildings.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
 
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="calculated">Berechnet</SelectItem>
                  <SelectItem value="sent">Versendet</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
 
        {/* Table or Empty State */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <LoadingState rows={5} />
            ) : !filteredBillings || filteredBillings.length === 0 ? (
              <EmptyState
                icon={FileSpreadsheet}
                title="Noch keine Betriebskostenabrechnungen"
                description="Erstellen Sie Ihre erste Abrechnung für ein Gebäude"
                action={
                  <Button onClick={() => navigate("/betriebskosten/neu")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Abrechnung
                  </Button>
                }
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredBillings}
                searchable
                searchPlaceholder="Gebäude suchen..."
                pagination
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>

        <PortalToolPromo maxTools={3} />
      </div>
 
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Abrechnung löschen"
        description="Möchten Sie diese Betriebskostenabrechnung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        onConfirm={confirmDelete}
        destructive
      />
    </MainLayout>
  );
}
