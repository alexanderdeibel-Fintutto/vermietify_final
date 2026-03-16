import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingState } from "@/components/shared";
import { useOwners, Owner } from "@/hooks/useOwners";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  CreditCard,
  Receipt,
  Percent,
  StickyNote,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function OwnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: owners = [], isLoading, updateOwner } = useOwners();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const owner = owners.find((o) => o.id === id);

  const [formData, setFormData] = useState<Partial<Owner>>({});

  const openEditDialog = () => {
    if (!owner) return;
    setFormData({
      first_name: owner.first_name,
      last_name: owner.last_name,
      email: owner.email,
      phone: owner.phone,
      address: owner.address,
      tax_number: owner.tax_number,
      bank_iban: owner.bank_iban,
      bank_bic: owner.bank_bic,
      notes: owner.notes,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!owner || !formData.first_name || !formData.last_name) return;
    setIsSubmitting(true);
    try {
      await updateOwner.mutateAsync({ id: owner.id, ...formData });
      setShowEditDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    // Delete is not yet implemented in the hook, so we navigate back
    setShowDeleteDialog(false);
    navigate("/eigentuemer");
  };

  if (isLoading) {
    return (
      <MainLayout title="Eigentümer">
        <LoadingState />
      </MainLayout>
    );
  }

  if (!owner) {
    return (
      <MainLayout title="Eigentümer">
        <div className="space-y-6">
          <PageHeader
            title="Eigentümer nicht gefunden"
            subtitle="Der angeforderte Eigentümer konnte nicht gefunden werden."
            actions={
              <Button variant="outline" asChild>
                <Link to="/eigentuemer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zur Liste
                </Link>
              </Button>
            }
          />
        </div>
      </MainLayout>
    );
  }

  const buildings = owner.owner_buildings || [];

  return (
    <MainLayout
      title={`${owner.first_name} ${owner.last_name}`}
      breadcrumbs={[
        { label: "Eigentümer", href: "/eigentuemer" },
        { label: `${owner.first_name} ${owner.last_name}` },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title={`${owner.first_name} ${owner.last_name}`}
          subtitle={`Eigentümer seit ${format(new Date(owner.created_at), "MMMM yyyy", { locale: de })}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/eigentuemer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Link>
              </Button>
              <Button onClick={openEditDialog}>
                <Pencil className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
            </div>
          }
        />

        {/* Contact Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Kontaktdaten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-Mail</p>
                    <p className="font-medium">{owner.email || "Nicht hinterlegt"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium">{owner.phone || "Nicht hinterlegt"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium">{owner.address || "Nicht hinterlegt"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Steuernummer</p>
                    <p className="font-medium font-mono">
                      {owner.tax_number || "Nicht hinterlegt"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">IBAN</p>
                    <p className="font-medium font-mono">
                      {owner.bank_iban || "Nicht hinterlegt"}
                    </p>
                  </div>
                </div>
                {owner.bank_bic && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">BIC</p>
                      <p className="font-medium font-mono">{owner.bank_bic}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Associated Buildings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Zugewiesene Gebäude ({buildings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {buildings.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Keine Gebäude zugewiesen.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {buildings.map((building) => (
                  <div
                    key={building.building_id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {building.buildings?.name || building.building_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {building.share_percent}% Anteil
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/gebaeude/${building.building_id}`}>
                          Gebäude ansehen
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Notizen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {owner.notes ? (
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {owner.notes}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Keine Notizen vorhanden.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={openEditDialog}
                >
                  Notiz hinzufügen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Steuerinformationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Steuernummer</p>
                <p className="font-medium font-mono mt-1">
                  {owner.tax_number || "Nicht hinterlegt"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Anzahl Gebäude</p>
                <p className="font-medium mt-1">{buildings.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Gesamtanteil</p>
                <p className="font-medium mt-1">
                  {buildings.reduce((sum, b) => sum + b.share_percent, 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Owner Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Eigentümer bearbeiten</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vorname *</Label>
                <Input
                  value={formData.first_name || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nachname *</Label>
                <Input
                  value={formData.last_name || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={formData.address || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Steuernummer</Label>
                <Input
                  value={formData.tax_number || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tax_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  value={formData.bank_iban || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bank_iban: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>BIC</Label>
              <Input
                value={formData.bank_bic || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, bank_bic: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notizen zum Eigentümer..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting || !formData.first_name || !formData.last_name}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eigentümer löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Eigentümer{" "}
              <strong>
                {owner.first_name} {owner.last_name}
              </strong>{" "}
              wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
