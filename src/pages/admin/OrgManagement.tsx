 import { useState } from "react";
 import { AdminLayout } from "@/components/admin/AdminLayout";
 import { DataTable } from "@/components/shared/DataTable";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { useAdminData } from "@/hooks/useAdminData";
 import { LoadingState } from "@/components/shared";
 import {
   MoreHorizontal,
   Eye,
   CreditCard,
   Ban,
   Users,
   Building2,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { ColumnDef } from "@tanstack/react-table";
 
 export default function OrgManagement() {
   const { useAllOrganizations } = useAdminData();
   const { data: organizations = [], isLoading } = useAllOrganizations();
 
   const [selectedOrg, setSelectedOrg] = useState<any>(null);
 
   const columns: ColumnDef<any>[] = [
     {
       accessorKey: "name",
       header: "Name",
       cell: ({ row }) => (
         <div>
           <p className="font-medium">{row.original.name}</p>
           {row.original.is_personal && (
             <Badge variant="outline" className="text-xs">Persönlich</Badge>
           )}
         </div>
       ),
     },
     {
       accessorKey: "userCount",
       header: "Benutzer",
       cell: ({ row }) => (
         <div className="flex items-center gap-1">
           <Users className="h-4 w-4 text-muted-foreground" />
           {row.original.userCount}
         </div>
       ),
     },
     {
       accessorKey: "buildingCount",
       header: "Gebäude",
       cell: ({ row }) => (
         <div className="flex items-center gap-1">
           <Building2 className="h-4 w-4 text-muted-foreground" />
           {row.original.buildingCount}
         </div>
       ),
     },
     {
       accessorKey: "created_at",
       header: "Erstellt",
       cell: ({ row }) =>
         format(new Date(row.original.created_at), "dd.MM.yyyy", { locale: de }),
     },
     {
       id: "actions",
       cell: ({ row }) => (
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon">
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={() => setSelectedOrg(row.original)}>
               <Eye className="h-4 w-4 mr-2" />
               Details
             </DropdownMenuItem>
             <DropdownMenuItem>
               <CreditCard className="h-4 w-4 mr-2" />
               Plan ändern
             </DropdownMenuItem>
             <DropdownMenuItem className="text-destructive">
               <Ban className="h-4 w-4 mr-2" />
               Deaktivieren
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       ),
     },
   ];
 
   if (isLoading) {
     return (
       <AdminLayout title="Organisationen">
         <LoadingState />
       </AdminLayout>
     );
   }
 
   return (
     <AdminLayout title="Organisationen">
       <div className="space-y-6">
         <Card className="p-4">
           <DataTable
             columns={columns}
             data={organizations}
             searchable
             searchPlaceholder="Organisation suchen..."
             pagination
             pageSize={10}
           />
         </Card>
       </div>
 
       {/* Detail Dialog */}
       <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>{selectedOrg?.name}</DialogTitle>
           </DialogHeader>
           {selectedOrg && (
             <div className="space-y-6">
               <div className="grid gap-4 md:grid-cols-3">
                 <Card>
                   <CardContent className="pt-6">
                     <div className="text-center">
                       <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                       <p className="text-2xl font-bold">{selectedOrg.userCount}</p>
                       <p className="text-sm text-muted-foreground">Benutzer</p>
                     </div>
                   </CardContent>
                 </Card>
                 <Card>
                   <CardContent className="pt-6">
                     <div className="text-center">
                       <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                       <p className="text-2xl font-bold">{selectedOrg.buildingCount}</p>
                       <p className="text-sm text-muted-foreground">Gebäude</p>
                     </div>
                   </CardContent>
                 </Card>
                 <Card>
                   <CardContent className="pt-6">
                     <div className="text-center">
                       <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                       <p className="text-2xl font-bold">Free</p>
                       <p className="text-sm text-muted-foreground">Plan</p>
                     </div>
                   </CardContent>
                 </Card>
               </div>
 
               <Card>
                 <CardHeader>
                   <CardTitle>Details</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-2">
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Erstellt</span>
                     <span>{format(new Date(selectedOrg.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Adresse</span>
                     <span>{selectedOrg.address || "-"}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Stadt</span>
                     <span>{selectedOrg.city || "-"}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-muted-foreground">Email</span>
                     <span>{selectedOrg.email || "-"}</span>
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}
         </DialogContent>
       </Dialog>
     </AdminLayout>
   );
 }