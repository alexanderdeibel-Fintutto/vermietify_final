import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useRentalOffers } from "@/hooks/useRentalOffers";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Calculator } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function KduRatesManagement() {
  const { profile } = useAuth();
  const { useKduRates, createKduRate, deleteKduRate } = useRentalOffers();
  const { data: rates, isLoading } = useKduRates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    municipality: "",
    postal_code: "",
    household_size: 1,
    max_rent_cents: 0,
    max_utilities_cents: 0,
    max_heating_cents: 0,
    source: "",
  });

  const handleSave = async () => {
    if (!profile?.organization_id || !form.municipality) return;
    await createKduRate.mutateAsync({
      organization_id: profile.organization_id,
      municipality: form.municipality,
      postal_code: form.postal_code || undefined,
      household_size: form.household_size,
      max_rent_cents: form.max_rent_cents,
      max_utilities_cents: form.max_utilities_cents,
      max_heating_cents: form.max_heating_cents,
      max_total_cents: form.max_rent_cents + form.max_utilities_cents + form.max_heating_cents,
      source: form.source || undefined,
    });
    setIsDialogOpen(false);
    setForm({ municipality: "", postal_code: "", household_size: 1, max_rent_cents: 0, max_utilities_cents: 0, max_heating_cents: 0, source: "" });
  };

  const columns: ColumnDef<any>[] = [
    { accessorKey: "municipality", header: "Kommune" },
    { accessorKey: "household_size", header: "Haushaltsgr.", cell: ({ row }) => `${row.original.household_size} Pers.` },
    { accessorKey: "max_rent_cents", header: "Max. Kaltmiete", cell: ({ row }) => formatCurrency(row.original.max_rent_cents / 100) },
    { accessorKey: "max_utilities_cents", header: "Max. NK", cell: ({ row }) => formatCurrency(row.original.max_utilities_cents / 100) },
    { accessorKey: "max_heating_cents", header: "Max. Heizung", cell: ({ row }) => formatCurrency(row.original.max_heating_cents / 100) },
    { accessorKey: "max_total_cents", header: "Max. Gesamt", cell: ({ row }) => <span className="font-bold">{formatCurrency(row.original.max_total_cents / 100)}</span> },
    { accessorKey: "source", header: "Quelle" },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <MainLayout title="KdU-Richtwerte"><LoadingState /></MainLayout>;

  return (
    <MainLayout title="KdU-Richtwerte" breadcrumbs={[{ label: "Einstellungen", href: "/settings" }, { label: "KdU-Richtwerte" }]}>
      <div className="space-y-6">
        <PageHeader
          title="KdU-Richtwerte"
          actions={<Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Neuer Richtwert</Button>}
        />

        {!rates?.length ? (
          <Card><CardContent className="py-8">
            <EmptyState
              icon={Calculator}
              title="Keine KdU-Richtwerte"
              description="Hinterlegen Sie die Kosten der Unterkunft für Ihre Kommunen."
              action={<Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Richtwert anlegen</Button>}
            />
          </CardContent></Card>
        ) : (
          <Card><CardContent className="p-0">
            <DataTable columns={columns} data={rates} pagination pageSize={20} />
          </CardContent></Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neuer KdU-Richtwert</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Kommune *</Label>
                <Input value={form.municipality} onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))} placeholder="z.B. Berlin" />
              </div>
              <div className="space-y-2">
                <Label>PLZ</Label>
                <Input value={form.postal_code} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))} placeholder="12345" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Haushaltsgröße</Label>
              <Select value={String(form.household_size)} onValueChange={(v) => setForm((f) => ({ ...f, household_size: parseInt(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6].map((n) => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "Person" : "Personen"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Max. Kaltmiete (€)</Label>
                <Input type="number" step="0.01" value={form.max_rent_cents ? (form.max_rent_cents / 100).toFixed(2) : ""} onChange={(e) => setForm((f) => ({ ...f, max_rent_cents: Math.round(parseFloat(e.target.value || "0") * 100) }))} />
              </div>
              <div className="space-y-2">
                <Label>Max. Nebenkosten (€)</Label>
                <Input type="number" step="0.01" value={form.max_utilities_cents ? (form.max_utilities_cents / 100).toFixed(2) : ""} onChange={(e) => setForm((f) => ({ ...f, max_utilities_cents: Math.round(parseFloat(e.target.value || "0") * 100) }))} />
              </div>
              <div className="space-y-2">
                <Label>Max. Heizkosten (€)</Label>
                <Input type="number" step="0.01" value={form.max_heating_cents ? (form.max_heating_cents / 100).toFixed(2) : ""} onChange={(e) => setForm((f) => ({ ...f, max_heating_cents: Math.round(parseFloat(e.target.value || "0") * 100) }))} />
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded text-sm">
              <strong>Max. Gesamt:</strong> {formatCurrency((form.max_rent_cents + form.max_utilities_cents + form.max_heating_cents) / 100)}
            </div>
            <div className="space-y-2">
              <Label>Quelle</Label>
              <Input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} placeholder="z.B. Wohngeldtabelle 2024" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!form.municipality || createKduRate.isPending}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="KdU-Richtwert löschen?"
        description="Dieser Richtwert wird unwiderruflich gelöscht."
        onConfirm={async () => {
          if (deleteId) await deleteKduRate.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />
    </MainLayout>
  );
}
