import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LoadingState, EmptyState } from "@/components/shared";
import { useOwners } from "@/hooks/useOwners";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function OwnerList() {
  const { data: owners = [], isLoading, createOwner } = useOwners();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    tax_number: "",
    bank_iban: "",
  });

  const filteredOwners = useMemo(() => {
    if (!searchQuery) return owners;
    const query = searchQuery.toLowerCase();
    return owners.filter(
      (owner) =>
        owner.first_name.toLowerCase().includes(query) ||
        owner.last_name.toLowerCase().includes(query) ||
        (owner.email?.toLowerCase().includes(query) ?? false) ||
        (owner.phone?.toLowerCase().includes(query) ?? false)
    );
  }, [owners, searchQuery]);

  const handleCreate = async () => {
    if (!formData.first_name || !formData.last_name) return;
    setIsSubmitting(true);
    try {
      await createOwner.mutateAsync({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        tax_number: formData.tax_number || null,
        bank_iban: formData.bank_iban || null,
      });
      setShowCreateDialog(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        tax_number: "",
        bank_iban: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Eigentümer">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Eigentümer" breadcrumbs={[{ label: "Eigentümer" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Eigentümer"
          subtitle="Verwalten Sie alle Immobilieneigentümer."
          actions={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Eigentümer
            </Button>
          }
        />

        {/* Search */}
        <Card>
          <CardContent className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Eigentümer suchen (Name, E-Mail, Telefon)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Owners Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Eigentümerliste ({filteredOwners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOwners.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Keine Eigentümer"
                description={
                  owners.length === 0
                    ? "Erstellen Sie Ihren ersten Eigentümer."
                    : "Keine Eigentümer entsprechen den Suchkriterien."
                }
                action={
                  owners.length === 0 && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Neuer Eigentümer
                    </Button>
                  )
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Gebäude</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners.map((owner) => {
                    const buildingCount = owner.owner_buildings?.length || 0;
                    return (
                      <TableRow key={owner.id}>
                        <TableCell className="font-medium">
                          {owner.first_name} {owner.last_name}
                        </TableCell>
                        <TableCell>
                          {owner.email ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {owner.email}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {owner.phone ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {owner.phone}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <Building2 className="h-3 w-3 mr-1" />
                            {buildingCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(owner.created_at), "dd.MM.yyyy", { locale: de })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/eigentuemer/${owner.id}`}>
                              Details
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Owner Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuer Eigentümer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vorname *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Max"
                />
              </div>
              <div className="space-y-2">
                <Label>Nachname *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="max@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+49 170 1234567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Musterstraße 1, 10115 Berlin"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Steuernummer</Label>
                <Input
                  value={formData.tax_number}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tax_number: e.target.value }))}
                  placeholder="12/345/67890"
                />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  value={formData.bank_iban}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bank_iban: e.target.value }))}
                  placeholder="DE89 3704 0044 0532 0130 00"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !formData.first_name || !formData.last_name}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
