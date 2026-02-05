 import { useState } from "react";
 import { AdminLayout } from "@/components/admin/AdminLayout";
 import { DataTable } from "@/components/shared/DataTable";
 import { Card } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { useAdminData } from "@/hooks/useAdminData";
 import { useToast } from "@/hooks/use-toast";
 import { LoadingState } from "@/components/shared";
 import {
   MoreHorizontal,
   UserPlus,
   Edit,
   Trash2,
   LogIn,
   Ban,
 } from "lucide-react";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 import { ColumnDef } from "@tanstack/react-table";
 
 const roleLabels: Record<string, string> = {
   admin: "Admin",
   member: "Vermieter",
   tenant: "Mieter",
 };
 
 const roleColors: Record<string, string> = {
   admin: "bg-red-100 text-red-800",
   member: "bg-blue-100 text-blue-800",
   tenant: "bg-green-100 text-green-800",
 };
 
 export default function UserManagement() {
   const { toast } = useToast();
   const { useAllUsers, useAllOrganizations } = useAdminData();
   const { data: users = [], isLoading } = useAllUsers();
   const { data: organizations = [] } = useAllOrganizations();
 
   const [showDialog, setShowDialog] = useState(false);
   const [editingUser, setEditingUser] = useState<any>(null);
   const [filterRole, setFilterRole] = useState<string>("all");
 
   const filteredUsers = filterRole === "all"
     ? users
     : users.filter((u: any) => u.user_roles?.some((r: any) => r.role === filterRole));
 
   const columns: ColumnDef<any>[] = [
     {
       accessorKey: "name",
       header: "Name",
       cell: ({ row }) => (
         <div>
           <p className="font-medium">
             {row.original.first_name} {row.original.last_name}
           </p>
         </div>
       ),
     },
     {
       accessorKey: "organizations.name",
       header: "Organisation",
       cell: ({ row }) => row.original.organizations?.name || "-",
     },
     {
       accessorKey: "role",
       header: "Rolle",
       cell: ({ row }) => {
         const roles = row.original.user_roles || [];
         return (
           <div className="flex gap-1">
             {roles.length > 0 ? (
               roles.map((r: any, i: number) => (
                 <Badge key={i} variant="outline" className={roleColors[r.role]}>
                   {roleLabels[r.role] || r.role}
                 </Badge>
               ))
             ) : (
               <Badge variant="outline">Keine Rolle</Badge>
             )}
           </div>
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
       cell: ({ row }) => (
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon">
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={() => handleEdit(row.original)}>
               <Edit className="h-4 w-4 mr-2" />
               Bearbeiten
             </DropdownMenuItem>
             <DropdownMenuItem>
               <LogIn className="h-4 w-4 mr-2" />
               Als User einloggen
             </DropdownMenuItem>
             <DropdownMenuItem className="text-orange-600">
               <Ban className="h-4 w-4 mr-2" />
               Deaktivieren
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
 
   const handleEdit = (user: any) => {
     setEditingUser(user);
     setShowDialog(true);
   };
 
   const handleSave = () => {
     toast({ title: "Benutzer aktualisiert" });
     setShowDialog(false);
     setEditingUser(null);
   };
 
   if (isLoading) {
     return (
       <AdminLayout title="Benutzerverwaltung">
         <LoadingState />
       </AdminLayout>
     );
   }
 
   return (
     <AdminLayout title="Benutzerverwaltung">
       <div className="space-y-6">
         {/* Header */}
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Select value={filterRole} onValueChange={setFilterRole}>
               <SelectTrigger className="w-40">
                 <SelectValue placeholder="Alle Rollen" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Alle Rollen</SelectItem>
                 <SelectItem value="admin">Admin</SelectItem>
                 <SelectItem value="member">Vermieter</SelectItem>
                 <SelectItem value="tenant">Mieter</SelectItem>
               </SelectContent>
             </Select>
           </div>
           <Button onClick={() => setShowDialog(true)}>
             <UserPlus className="h-4 w-4 mr-2" />
             Neuer Benutzer
           </Button>
         </div>
 
         {/* Table */}
         <Card className="p-4">
           <DataTable
             columns={columns}
             data={filteredUsers}
             searchable
             searchPlaceholder="Benutzer suchen..."
             pagination
             pageSize={10}
           />
         </Card>
       </div>
 
       {/* Edit Dialog */}
       <Dialog open={showDialog} onOpenChange={setShowDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               {editingUser ? "Benutzer bearbeiten" : "Neuer Benutzer"}
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Vorname</Label>
                 <Input defaultValue={editingUser?.first_name} />
               </div>
               <div className="space-y-2">
                 <Label>Nachname</Label>
                 <Input defaultValue={editingUser?.last_name} />
               </div>
             </div>
             <div className="space-y-2">
               <Label>Rolle</Label>
               <Select defaultValue={editingUser?.user_roles?.[0]?.role || "member"}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="admin">Admin</SelectItem>
                   <SelectItem value="member">Vermieter</SelectItem>
                   <SelectItem value="tenant">Mieter</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Organisation</Label>
               <Select defaultValue={editingUser?.organization_id || ""}>
                 <SelectTrigger>
                   <SelectValue placeholder="Organisation wählen" />
                 </SelectTrigger>
                 <SelectContent>
                   {organizations.map((org: any) => (
                     <SelectItem key={org.id} value={org.id}>
                       {org.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowDialog(false)}>
               Abbrechen
             </Button>
             <Button onClick={handleSave}>Speichern</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </AdminLayout>
   );
 }