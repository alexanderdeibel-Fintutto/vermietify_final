 import { useState, useMemo } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { DataTable } from "@/components/shared/DataTable";
 import { usePayments } from "@/hooks/usePayments";
 import { useBuildings } from "@/hooks/useBuildings";
 import { formatCurrency } from "@/lib/utils";
 import { Download, Search } from "lucide-react";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { LoadingState } from "@/components/shared";
 
 const TRANSACTION_TYPE_LABELS: Record<string, string> = {
   rent: "Miete",
   deposit: "Kaution",
   utility: "Nebenkosten",
   repair: "Reparatur",
   insurance: "Versicherung",
   tax: "Steuern",
   other_income: "Sonstige Einnahmen",
   other_expense: "Sonstige Ausgaben",
 };
 
 export function PaymentHistoryTab() {
   const { usePaymentsList } = usePayments();
   const { useBuildingsList } = useBuildings();
   const { data: payments, isLoading } = usePaymentsList();
   const { data: buildingsData } = useBuildingsList();
   const buildings = buildingsData?.buildings || [];
 
   const [searchQuery, setSearchQuery] = useState("");
   const [buildingFilter, setBuildingFilter] = useState<string>("all");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [dateRange, setDateRange] = useState({ start: "", end: "" });
 
   const filteredPayments = useMemo(() => {
     if (!payments) return [];
 
     return payments.filter((payment: any) => {
       // Search filter
       if (searchQuery) {
         const tenant = payment.leases?.tenants;
         const unit = payment.leases?.units;
         const searchLower = searchQuery.toLowerCase();
         const matches =
           tenant?.first_name?.toLowerCase().includes(searchLower) ||
           tenant?.last_name?.toLowerCase().includes(searchLower) ||
           unit?.unit_number?.toLowerCase().includes(searchLower);
         if (!matches) return false;
       }
 
       // Building filter
       if (buildingFilter !== "all") {
         if (payment.leases?.units?.buildings?.id !== buildingFilter) return false;
       }
 
       // Date range filter
       if (dateRange.start && payment.transaction_date < dateRange.start) return false;
       if (dateRange.end && payment.transaction_date > dateRange.end) return false;
 
       return true;
     });
   }, [payments, searchQuery, buildingFilter, statusFilter, dateRange]);
 
   const handleExportCSV = () => {
     const headers = ["Datum", "Mieter", "Einheit", "Typ", "Betrag"];
     const rows = filteredPayments.map((p: any) => [
       p.transaction_date,
       `${p.leases?.tenants?.first_name || ""} ${p.leases?.tenants?.last_name || ""}`,
       p.leases?.units?.unit_number || "",
       TRANSACTION_TYPE_LABELS[p.transaction_type] || p.transaction_type,
       (p.amount / 100).toFixed(2),
     ]);
 
     const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = `zahlungen_${new Date().toISOString().split("T")[0]}.csv`;
     link.click();
   };
 
   const columns: ColumnDef<any>[] = [
     {
       accessorKey: "transaction_date",
       header: "Datum",
       cell: ({ row }) =>
         format(new Date(row.original.transaction_date), "dd.MM.yyyy", { locale: de }),
     },
     {
       accessorKey: "tenant",
       header: "Mieter",
       cell: ({ row }) => {
         const tenant = row.original.leases?.tenants;
         return tenant
           ? `${tenant.first_name} ${tenant.last_name}`
           : "-";
       },
     },
     {
       accessorKey: "unit",
       header: "Einheit",
       cell: ({ row }) => {
         const unit = row.original.leases?.units;
         return unit ? (
           <div>
             <p className="font-medium">{unit.unit_number}</p>
             <p className="text-sm text-muted-foreground">
               {unit.buildings?.name}
             </p>
           </div>
         ) : (
           "-"
         );
       },
     },
     {
       accessorKey: "transaction_type",
       header: "Typ",
       cell: ({ row }) => (
         <Badge variant="outline">
           {TRANSACTION_TYPE_LABELS[row.original.transaction_type] ||
             row.original.transaction_type}
         </Badge>
       ),
     },
     {
       accessorKey: "amount",
       header: "Betrag",
       cell: ({ row }) => (
         <span
           className={
             row.original.is_income ? "text-primary font-semibold" : "text-destructive"
           }
         >
           {row.original.is_income ? "+" : "-"}
           {formatCurrency(row.original.amount / 100)}
         </span>
       ),
     },
     {
       accessorKey: "description",
       header: "Referenz",
       cell: ({ row }) => (
         <span className="text-muted-foreground text-sm">
           {row.original.description || "-"}
         </span>
       ),
     },
   ];
 
   if (isLoading) {
     return <LoadingState rows={8} />;
   }
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle>Zahlungshistorie</CardTitle>
         <Button variant="outline" onClick={handleExportCSV}>
           <Download className="h-4 w-4 mr-2" />
           CSV Export
         </Button>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Filters */}
         <div className="flex flex-wrap gap-4">
           <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input
               placeholder="Mieter oder Einheit suchen..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9"
             />
           </div>
 
           <Select value={buildingFilter} onValueChange={setBuildingFilter}>
             <SelectTrigger className="w-[180px]">
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
 
           <div className="flex items-center gap-2">
             <Input
               type="date"
               value={dateRange.start}
               onChange={(e) =>
                 setDateRange((prev) => ({ ...prev, start: e.target.value }))
               }
               className="w-[150px]"
             />
             <span className="text-muted-foreground">bis</span>
             <Input
               type="date"
               value={dateRange.end}
               onChange={(e) =>
                 setDateRange((prev) => ({ ...prev, end: e.target.value }))
               }
               className="w-[150px]"
             />
           </div>
         </div>
 
         {/* Table */}
         <DataTable columns={columns} data={filteredPayments} pagination pageSize={15} />
       </CardContent>
     </Card>
   );
 }