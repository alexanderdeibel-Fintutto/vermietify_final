import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Search, Mail, Phone, Home, Loader2, Upload, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { tenantSchema } from "@/lib/validationSchemas";
import { sanitizeErrorMessage } from "@/lib/errorHandler";
import { BulkImportDialog } from "@/components/import/BulkImportDialog";
import { TenantAppInviteDialog } from "@/components/tenants/TenantAppInviteDialog";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  created_at: string;
}

export default function Tenants() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteDialogTenant, setInviteDialogTenant] = useState<{ id: string; name: string; email: string | null } | null>(null);

  const [newTenant, setNewTenant] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchTenants();
    }
  }, [profile?.organization_id]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('last_name');

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: "Fehler",
        description: "Mieter konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate input data
    const validationResult = tenantSchema.safeParse(newTenant);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validierungsfehler",
        description: firstError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const validatedData = validationResult.data;
      const { error } = await supabase
        .from('tenants')
        .insert({
          organization_id: profile?.organization_id,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          city: validatedData.city || null,
          postal_code: validatedData.postal_code || null,
        });

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Der Mieter wurde erfolgreich angelegt.",
      });

      // Offer to send app invite if email was provided
      if (validatedData.email) {
        // We need the new tenant's ID - fetch the latest
        const { data: newTenants } = await supabase
          .from("tenants")
          .select("id")
          .eq("organization_id", profile?.organization_id)
          .eq("email", validatedData.email)
          .order("created_at", { ascending: false })
          .limit(1);

        if (newTenants?.[0]) {
          setInviteDialogTenant({
            id: newTenants[0].id,
            name: `${validatedData.first_name} ${validatedData.last_name}`,
            email: validatedData.email,
          });
        }
      }

      setIsDialogOpen(false);
      setNewTenant({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postal_code: "",
      });
      fetchTenants();
    } catch (error: unknown) {
      toast({
        title: "Fehler",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      `${tenant.first_name} ${tenant.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  };

  return (
    <MainLayout title="Mieter">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mieter</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Mieterdatenbank
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              PDF/CSV Import
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Mieter hinzufügen
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleCreateTenant}>
                <DialogHeader>
                  <DialogTitle>Neuen Mieter anlegen</DialogTitle>
                  <DialogDescription>
                    Fügen Sie einen neuen Mieter zu Ihrer Datenbank hinzu
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Vorname *</Label>
                      <Input
                        id="first_name"
                        placeholder="Max"
                        value={newTenant.first_name}
                        onChange={(e) => setNewTenant({ ...newTenant, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nachname *</Label>
                      <Input
                        id="last_name"
                        placeholder="Mustermann"
                        value={newTenant.last_name}
                        onChange={(e) => setNewTenant({ ...newTenant, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="max@beispiel.de"
                      value={newTenant.email}
                      onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+49 123 456789"
                      value={newTenant.phone}
                      onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      placeholder="Musterstraße 123"
                      value={newTenant.address}
                      onChange={(e) => setNewTenant({ ...newTenant, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">PLZ</Label>
                      <Input
                        id="postal_code"
                        placeholder="12345"
                        value={newTenant.postal_code}
                        onChange={(e) => setNewTenant({ ...newTenant, postal_code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Stadt</Label>
                      <Input
                        id="city"
                        placeholder="Berlin"
                        value={newTenant.city}
                        onChange={(e) => setNewTenant({ ...newTenant, city: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Anlegen
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mieter suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mieterliste</CardTitle>
            <CardDescription>
              {filteredTenants.length} Mieter gefunden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "Keine Mieter gefunden" : "Noch keine Mieter"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "Versuchen Sie einen anderen Suchbegriff"
                    : "Fügen Sie Ihren ersten Mieter hinzu"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Mieter hinzufügen
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mieter</TableHead>
                    <TableHead>Kontakt</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(tenant.first_name, tenant.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {tenant.first_name} {tenant.last_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {tenant.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {tenant.email}
                            </div>
                          )}
                          {tenant.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {tenant.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.address ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Home className="h-3 w-3" />
                            {tenant.address}, {tenant.postal_code} {tenant.city}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Aktiv</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/mieter/${tenant.id}`}>Details</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInviteDialogTenant({
                            id: tenant.id,
                            name: `${tenant.first_name} ${tenant.last_name}`,
                            email: tenant.email,
                          })}
                          disabled={!tenant.email}
                          title={!tenant.email ? "Keine E-Mail hinterlegt" : "Mieter-App Einladung senden"}
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <BulkImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        type="tenants"
        organizationId={profile?.organization_id}
        onSuccess={() => fetchTenants()}
      />

      {inviteDialogTenant && (
        <TenantAppInviteDialog
          open={!!inviteDialogTenant}
          onOpenChange={(o) => !o && setInviteDialogTenant(null)}
          tenantId={inviteDialogTenant.id}
          tenantName={inviteDialogTenant.name}
          tenantEmail={inviteDialogTenant.email}
        />
      )}
    </MainLayout>
  );
}
