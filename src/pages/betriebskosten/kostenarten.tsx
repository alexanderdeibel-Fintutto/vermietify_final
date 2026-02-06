 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { PageHeader, LoadingState, ConfirmDialog } from "@/components/shared";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { CostTypeDialog } from "@/components/operating-costs/CostTypeDialog";
 import { useCostTypes, CostType, CostTypeInsert } from "@/hooks/useCostTypes";
 import { Plus, MoreHorizontal, Pencil, Trash2, Check, X, Shield } from "lucide-react";
 
 const DISTRIBUTION_KEY_LABELS: Record<string, string> = {
   area: "Nach m²",
   persons: "Nach Personen",
   units: "Nach Einheiten",
   consumption: "Nach Verbrauch",
 };
 
 const CATEGORY_LABELS: Record<string, string> = {
   heating: "Heizung",
   water: "Wasser",
   cleaning: "Reinigung",
   insurance: "Versicherung",
   taxes: "Steuern",
   other: "Sonstiges",
 };
 
 export default function CostTypes() {
   const {
     costTypes,
     isLoading,
     createCostType,
     updateCostType,
     deleteCostType,
     isCreating,
     isUpdating,
     isDeleting,
   } = useCostTypes();
 
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editingCostType, setEditingCostType] = useState<CostType | null>(null);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [costTypeToDelete, setCostTypeToDelete] = useState<CostType | null>(null);
 
   const handleCreate = () => {
     setEditingCostType(null);
     setDialogOpen(true);
   };
 
   const handleEdit = (costType: CostType) => {
     setEditingCostType(costType);
     setDialogOpen(true);
   };
 
   const handleDelete = (costType: CostType) => {
     setCostTypeToDelete(costType);
     setDeleteDialogOpen(true);
   };
 
   const handleSave = (data: CostTypeInsert) => {
     if (editingCostType) {
       updateCostType(
         { id: editingCostType.id, updates: data },
         { onSuccess: () => setDialogOpen(false) }
       );
     } else {
       createCostType(data, { onSuccess: () => setDialogOpen(false) });
     }
   };
 
   const confirmDelete = () => {
     if (costTypeToDelete) {
       deleteCostType(costTypeToDelete.id, {
         onSuccess: () => {
           setDeleteDialogOpen(false);
           setCostTypeToDelete(null);
         },
       });
     }
   };
 
   return (
     <MainLayout
       title="Kostenarten"
       breadcrumbs={[
         { label: "Betriebskosten", href: "/betriebskosten" },
         { label: "Kostenarten" },
       ]}
     >
       <div className="space-y-6">
         <PageHeader
           title="Kostenarten"
          subtitle="Verwalten Sie die Kostenarten für Ihre Betriebskostenabrechnungen"
           actions={
             <Button onClick={handleCreate}>
               <Plus className="h-4 w-4 mr-2" />
               Neue Kostenart
             </Button>
           }
         />
 
         {isLoading ? (
           <LoadingState rows={10} />
         ) : (
           <div className="border rounded-lg">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Name</TableHead>
                   <TableHead>Beschreibung</TableHead>
                   <TableHead>Kategorie</TableHead>
                   <TableHead>Verteilerschlüssel</TableHead>
                   <TableHead>Umlagefähig</TableHead>
                   <TableHead className="w-[100px]">Aktionen</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {costTypes.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                       Keine Kostenarten vorhanden
                     </TableCell>
                   </TableRow>
                 ) : (
                   costTypes.map((costType) => (
                     <TableRow key={costType.id}>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <span className="font-medium">{costType.name}</span>
                           {costType.is_system && (
                             <Badge variant="secondary" className="text-xs">
                               <Shield className="h-3 w-3 mr-1" />
                               System
                             </Badge>
                           )}
                         </div>
                       </TableCell>
                       <TableCell className="text-muted-foreground max-w-[300px] truncate">
                         {costType.description || "–"}
                       </TableCell>
                       <TableCell>
                         <Badge variant="outline">
                           {CATEGORY_LABELS[costType.category]}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         {DISTRIBUTION_KEY_LABELS[costType.default_distribution_key]}
                       </TableCell>
                       <TableCell>
                         {costType.is_chargeable ? (
                           <Badge className="bg-primary/10 text-primary border-0">
                             <Check className="h-3 w-3 mr-1" />
                             Ja
                           </Badge>
                         ) : (
                           <Badge variant="secondary">
                             <X className="h-3 w-3 mr-1" />
                             Nein
                           </Badge>
                         )}
                       </TableCell>
                       <TableCell>
                         {!costType.is_system && (
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon">
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => handleEdit(costType)}>
                                 <Pencil className="h-4 w-4 mr-2" />
                                 Bearbeiten
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 className="text-destructive"
                                 onClick={() => handleDelete(costType)}
                               >
                                 <Trash2 className="h-4 w-4 mr-2" />
                                 Löschen
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         )}
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </div>
         )}
       </div>
 
       <CostTypeDialog
         open={dialogOpen}
         onOpenChange={setDialogOpen}
         costType={editingCostType}
         onSave={handleSave}
         isSaving={isCreating || isUpdating}
       />
 
       <ConfirmDialog
         open={deleteDialogOpen}
         onOpenChange={setDeleteDialogOpen}
         title="Kostenart löschen"
         description={`Möchten Sie die Kostenart "${costTypeToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
         onConfirm={confirmDelete}
        destructive
       />
     </MainLayout>
   );
 }