 import { useState } from "react";
 import { MainLayout } from "@/components/layout/MainLayout";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Switch } from "@/components/ui/switch";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { DataTable } from "@/components/shared/DataTable";
import { Plus, Edit, Trash2, CheckCircle, PlayCircle } from "lucide-react";
import { useBanking, TransactionRule } from "@/hooks/useBanking";
import { ApplyRuleDialog } from "@/components/banking/ApplyRuleDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
 import { LoadingState } from "@/components/shared/LoadingState";
 import { ColumnDef } from "@tanstack/react-table";
 import { format } from "date-fns";
 import { de } from "date-fns/locale";
 
 const actionTypeLabels: Record<string, string> = {
   assign_tenant: "Mieter zuordnen",
   book_as: "Buchen als",
   ignore: "Ignorieren",
 };
 
 export default function MatchingRules() {
   const { rules, isLoading, createRule, updateRule, deleteRule } = useBanking();
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-simple'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('id, first_name, last_name');
      return data || [];
    },
  });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editRule, setEditRule] = useState<TransactionRule | null>(null);
    const [applyRule, setApplyRule] = useState<TransactionRule | null>(null);
   
   const [formData, setFormData] = useState<{
     name: string;
     conditions: Array<{ field: string; operator: string; value: string }>;
     action_type: string;
     action_config: Record<string, unknown>;
   }>({
     name: "",
     conditions: [{ field: "counterpart_name", operator: "contains", value: "" }],
     action_type: "assign_tenant",
     action_config: {},
   });
 
   const resetForm = () => {
     setFormData({
       name: "",
       conditions: [{ field: "counterpart_name", operator: "contains", value: "" }],
       action_type: "assign_tenant",
       action_config: {},
     });
     setEditRule(null);
   };
 
   const openEdit = (rule: TransactionRule) => {
     setEditRule(rule);
     setFormData({
       name: rule.name,
       conditions: rule.conditions,
       action_type: rule.action_type,
       action_config: rule.action_config,
     });
     setDialogOpen(true);
   };
 
   const handleSave = async () => {
     if (editRule) {
      await updateRule.mutateAsync({ 
        id: editRule.id, 
        ...formData,
        action_type: formData.action_type as 'assign_tenant' | 'book_as' | 'ignore',
      });
     } else {
      await createRule.mutateAsync({
        ...formData,
        action_type: formData.action_type as 'assign_tenant' | 'book_as' | 'ignore',
      });
     }
     setDialogOpen(false);
     resetForm();
   };
 
   const addCondition = () => {
     setFormData(prev => ({
       ...prev,
       conditions: [...prev.conditions, { field: "counterpart_name", operator: "contains", value: "" }],
     }));
   };
 
   const updateCondition = (index: number, updates: Partial<typeof formData.conditions[0]>) => {
     setFormData(prev => ({
       ...prev,
       conditions: prev.conditions.map((c, i) => i === index ? { ...c, ...updates } : c),
     }));
   };
 
   const removeCondition = (index: number) => {
     setFormData(prev => ({
       ...prev,
       conditions: prev.conditions.filter((_, i) => i !== index),
     }));
   };
 
   const columns: ColumnDef<TransactionRule>[] = [
     {
       accessorKey: "name",
       header: "Regel",
       cell: ({ row }) => (
         <div>
           <p className="font-medium">{row.original.name}</p>
           {row.original.description && (
             <p className="text-sm text-muted-foreground">{row.original.description}</p>
           )}
         </div>
       ),
     },
     {
       accessorKey: "conditions",
       header: "Bedingungen",
       cell: ({ row }) => (
         <div className="text-sm">
           {row.original.conditions.map((c, i) => (
             <div key={i} className="text-muted-foreground">
               {c.field} {c.operator} "{c.value}"
             </div>
           ))}
         </div>
       ),
     },
     {
       accessorKey: "action_type",
       header: "Aktion",
       cell: ({ row }) => (
         <Badge variant="secondary">
           {actionTypeLabels[row.original.action_type]}
         </Badge>
       ),
     },
     {
       accessorKey: "match_count",
       header: "Treffer",
       cell: ({ row }) => (
         <div className="flex items-center gap-1">
           <CheckCircle className="h-4 w-4 text-primary" />
           {row.original.match_count}
         </div>
       ),
     },
     {
       accessorKey: "is_active",
       header: "Aktiv",
       cell: ({ row }) => (
         <Switch
           checked={row.original.is_active}
           onCheckedChange={(checked) => 
             updateRule.mutate({ id: row.original.id, is_active: checked })
           }
         />
       ),
     },
     {
       accessorKey: "last_match_at",
       header: "Letzter Treffer",
       cell: ({ row }) => row.original.last_match_at 
         ? format(new Date(row.original.last_match_at), "dd.MM.yyyy", { locale: de })
         : "-",
     },
     {
        id: "actions",
        header: "Aktionen",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Rückwirkend anwenden"
              onClick={() => setApplyRule(row.original)}
            >
              <PlayCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => deleteRule.mutate(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
     },
   ];
 
   if (isLoading) return <MainLayout title="Regeln"><LoadingState /></MainLayout>;
 
   return (
     <MainLayout 
       title="Zuordnungsregeln"
       breadcrumbs={[
         { label: "Banking", href: "/banking" },
         { label: "Regeln" }
       ]}
     >
       <div className="space-y-6">
         <div className="flex justify-between items-center">
           <div>
             <h1 className="text-3xl font-bold tracking-tight">Zuordnungsregeln</h1>
             <p className="text-muted-foreground">Automatische Regeln für Transaktionszuordnung</p>
           </div>
           <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
             <DialogTrigger asChild>
               <Button>
                 <Plus className="h-4 w-4 mr-2" />
                 Neue Regel
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-lg">
               <DialogHeader>
                 <DialogTitle>{editRule ? "Regel bearbeiten" : "Neue Regel erstellen"}</DialogTitle>
               </DialogHeader>
               <div className="space-y-4">
                 <div>
                   <Label>Name</Label>
                   <Input
                     value={formData.name}
                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                     placeholder="z.B. Miete Max Müller"
                   />
                 </div>
 
                 <div>
                   <div className="flex items-center justify-between mb-2">
                     <Label>Bedingungen (UND-verknüpft)</Label>
                     <Button variant="outline" size="sm" onClick={addCondition}>
                       <Plus className="h-3 w-3 mr-1" />
                       Hinzufügen
                     </Button>
                   </div>
                   <div className="space-y-2">
                     {formData.conditions.map((condition, index) => (
                       <div key={index} className="flex gap-2 items-center">
                         <Select
                           value={condition.field}
                           onValueChange={(v) => updateCondition(index, { field: v })}
                         >
                           <SelectTrigger className="w-[140px]">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="counterpart_name">Name</SelectItem>
                             <SelectItem value="counterpart_iban">IBAN</SelectItem>
                             <SelectItem value="purpose">Verwendungszweck</SelectItem>
                             <SelectItem value="amount_cents">Betrag (Cent)</SelectItem>
                           </SelectContent>
                         </Select>
                         <Select
                           value={condition.operator}
                           onValueChange={(v) => updateCondition(index, { operator: v })}
                         >
                           <SelectTrigger className="w-[100px]">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="equals">ist</SelectItem>
                             <SelectItem value="contains">enthält</SelectItem>
                             <SelectItem value="starts_with">beginnt mit</SelectItem>
                           </SelectContent>
                         </Select>
                         <Input
                           value={condition.value}
                           onChange={(e) => updateCondition(index, { value: e.target.value })}
                           placeholder="Wert"
                           className="flex-1"
                         />
                         {formData.conditions.length > 1 && (
                           <Button 
                             variant="ghost" 
                             size="icon"
                             onClick={() => removeCondition(index)}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
 
                 <div>
                   <Label>Aktion</Label>
                   <Select
                     value={formData.action_type}
                     onValueChange={(v) => setFormData(prev => ({ 
                       ...prev, 
                       action_type: v,
                       action_config: {}
                     }))}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="assign_tenant">Mieter zuordnen</SelectItem>
                       <SelectItem value="book_as">Buchen als</SelectItem>
                       <SelectItem value="ignore">Ignorieren</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
 
                 {formData.action_type === 'assign_tenant' && (
                   <div>
                     <Label>Mieter</Label>
                     <Select
                       value={formData.action_config.tenant_id as string || ''}
                       onValueChange={(v) => setFormData(prev => ({ 
                         ...prev, 
                         action_config: { ...prev.action_config, tenant_id: v }
                       }))}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Mieter auswählen" />
                       </SelectTrigger>
                       <SelectContent>
                         {tenants.map(t => (
                           <SelectItem key={t.id} value={t.id}>
                             {t.first_name} {t.last_name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 )}
 
                 {formData.action_type === 'book_as' && (
                   <div>
                     <Label>Typ</Label>
                     <Select
                       value={formData.action_config.type as string || ''}
                       onValueChange={(v) => setFormData(prev => ({ 
                         ...prev, 
                         action_config: { ...prev.action_config, type: v }
                       }))}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Typ auswählen" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="rent">Miete</SelectItem>
                         <SelectItem value="deposit">Kaution</SelectItem>
                         <SelectItem value="utility">Nebenkosten</SelectItem>
                         <SelectItem value="maintenance">Instandhaltung</SelectItem>
                         <SelectItem value="other">Sonstiges</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 )}
 
                 <div className="flex justify-end gap-2">
                   <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                     Abbrechen
                   </Button>
                   <Button onClick={handleSave} disabled={!formData.name || formData.conditions.some(c => !c.value)}>
                     {editRule ? "Speichern" : "Erstellen"}
                   </Button>
                 </div>
               </div>
             </DialogContent>
           </Dialog>
         </div>
 
         <DataTable
           columns={columns}
           data={rules}
           searchable
           searchPlaceholder="Regeln suchen..."
           pagination
           pageSize={10}
         />
        </div>

        {applyRule && (
          <ApplyRuleDialog
            rule={applyRule}
            onClose={() => setApplyRule(null)}
          />
        )}
      </MainLayout>
    );
  }