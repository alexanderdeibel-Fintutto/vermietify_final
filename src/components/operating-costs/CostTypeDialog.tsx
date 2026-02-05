 import { useState, useEffect } from "react";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Checkbox } from "@/components/ui/checkbox";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { CostType, CostTypeInsert } from "@/hooks/useCostTypes";
 import { useAuth } from "@/hooks/useAuth";
 import { Loader2 } from "lucide-react";
 
 const DISTRIBUTION_KEYS = [
   { value: "area", label: "Nach Fläche (m²)" },
   { value: "persons", label: "Nach Personenzahl" },
   { value: "units", label: "Nach Einheiten" },
   { value: "consumption", label: "Nach Verbrauch" },
 ] as const;
 
 const CATEGORIES = [
   { value: "heating", label: "Heizung" },
   { value: "water", label: "Wasser" },
   { value: "cleaning", label: "Reinigung" },
   { value: "insurance", label: "Versicherung" },
   { value: "taxes", label: "Steuern" },
   { value: "other", label: "Sonstiges" },
 ] as const;
 
 interface CostTypeDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   costType?: CostType | null;
   onSave: (data: CostTypeInsert) => void;
   isSaving: boolean;
 }
 
 export function CostTypeDialog({
   open,
   onOpenChange,
   costType,
   onSave,
   isSaving,
 }: CostTypeDialogProps) {
   const { profile } = useAuth();
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [distributionKey, setDistributionKey] = useState<CostTypeInsert["default_distribution_key"]>("area");
   const [isChargeable, setIsChargeable] = useState(true);
   const [category, setCategory] = useState<CostTypeInsert["category"]>("other");
 
   const isEditing = !!costType;
 
   useEffect(() => {
     if (costType) {
       setName(costType.name);
       setDescription(costType.description || "");
       setDistributionKey(costType.default_distribution_key);
       setIsChargeable(costType.is_chargeable);
       setCategory(costType.category);
     } else {
       setName("");
       setDescription("");
       setDistributionKey("area");
       setIsChargeable(true);
       setCategory("other");
     }
   }, [costType, open]);
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!name.trim() || !profile?.organization_id) return;
 
     onSave({
       organization_id: profile.organization_id,
       name: name.trim(),
       description: description.trim() || null,
       default_distribution_key: distributionKey,
       is_chargeable: isChargeable,
       category,
     });
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
         <form onSubmit={handleSubmit}>
           <DialogHeader>
             <DialogTitle>
               {isEditing ? "Kostenart bearbeiten" : "Neue Kostenart erstellen"}
             </DialogTitle>
             <DialogDescription>
               {isEditing
                 ? "Bearbeiten Sie die Details der Kostenart"
                 : "Erstellen Sie eine neue benutzerdefinierte Kostenart"}
             </DialogDescription>
           </DialogHeader>
 
           <div className="grid gap-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="name">Name *</Label>
               <Input
                 id="name"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="z.B. Kabelanschluss"
                 required
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="description">Beschreibung</Label>
               <Textarea
                 id="description"
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Optionale Beschreibung der Kostenart..."
                 rows={2}
               />
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="distributionKey">Standard-Verteilerschlüssel</Label>
               <Select value={distributionKey} onValueChange={(v) => setDistributionKey(v as any)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {DISTRIBUTION_KEYS.map((key) => (
                     <SelectItem key={key.value} value={key.value}>
                       {key.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="category">Kategorie</Label>
               <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {CATEGORIES.map((cat) => (
                     <SelectItem key={cat.value} value={cat.value}>
                       {cat.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             <div className="flex items-center space-x-3 pt-2">
               <Checkbox
                 id="isChargeable"
                 checked={isChargeable}
                 onCheckedChange={(checked) => setIsChargeable(checked as boolean)}
               />
               <Label htmlFor="isChargeable" className="cursor-pointer">
                 Umlagefähig auf Mieter
               </Label>
             </div>
           </div>
 
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Abbrechen
             </Button>
             <Button type="submit" disabled={!name.trim() || isSaving}>
               {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               {isEditing ? "Speichern" : "Erstellen"}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }