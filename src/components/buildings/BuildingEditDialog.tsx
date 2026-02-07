import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useBuildings } from "@/hooks/useBuildings";
import type { Database } from "@/integrations/supabase/types";

type BuildingRow = Database["public"]["Tables"]["buildings"]["Row"];

interface BuildingEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: BuildingRow;
}

export function BuildingEditDialog({ open, onOpenChange, building }: BuildingEditDialogProps) {
  const { updateBuilding } = useBuildings();

  const [form, setForm] = useState({
    name: "",
    address: "",
    postal_code: "",
    city: "",
    building_type: "apartment",
    year_built: "",
    total_area: "",
    notes: "",
  });

  useEffect(() => {
    if (building && open) {
      setForm({
        name: building.name || "",
        address: building.address || "",
        postal_code: building.postal_code || "",
        city: building.city || "",
        building_type: building.building_type || "apartment",
        year_built: building.year_built?.toString() || "",
        total_area: building.total_area?.toString() || "",
        notes: building.notes || "",
      });
    }
  }, [building, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBuilding.mutate(
      {
        id: building.id,
        data: {
          name: form.name,
          street: form.address,
          zip: form.postal_code,
          city: form.city,
          building_type: form.building_type as "apartment" | "commercial" | "house" | "mixed",
          year_built: form.year_built ? parseInt(form.year_built) : undefined,
          total_area: form.total_area ? parseFloat(form.total_area) : undefined,
          notes: form.notes || undefined,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gebäude bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Informationen dieses Gebäudes
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Adresse *</Label>
              <Input
                id="edit-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-postal">PLZ *</Label>
                <Input
                  id="edit-postal"
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">Stadt *</Label>
                <Input
                  id="edit-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Gebäudetyp</Label>
              <Select
                value={form.building_type}
                onValueChange={(value) => setForm({ ...form, building_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Mehrfamilienhaus</SelectItem>
                  <SelectItem value="house">Einfamilienhaus</SelectItem>
                  <SelectItem value="commercial">Gewerbe</SelectItem>
                  <SelectItem value="mixed">Gemischt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-year">Baujahr</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={form.year_built}
                  onChange={(e) => setForm({ ...form, year_built: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-area">Gesamtfläche (m²)</Label>
                <Input
                  id="edit-area"
                  type="number"
                  step="0.01"
                  value={form.total_area}
                  onChange={(e) => setForm({ ...form, total_area: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notizen</Label>
              <Textarea
                id="edit-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={updateBuilding.isPending}>
              {updateBuilding.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
