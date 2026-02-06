import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Download,
  Trash2,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface GDPRRequest {
  id: string;
  request_type: "export" | "delete" | "anonymize";
  tenant_id: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  notes: string | null;
  result_file_path: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Consent {
  id: string;
  tenant_id: string;
  consent_type: string;
  consent_given: boolean;
  consent_date: string | null;
  revoked_date: string | null;
}

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Ausstehend", variant: "secondary" },
  processing: { label: "In Bearbeitung", variant: "default" },
  completed: { label: "Abgeschlossen", variant: "outline" },
  failed: { label: "Fehlgeschlagen", variant: "destructive" },
};

const REQUEST_TYPES = {
  export: { label: "Datenexport", icon: Download },
  delete: { label: "Datenlöschung", icon: Trash2 },
  anonymize: { label: "Anonymisierung", icon: User },
};

const CONSENT_TYPES = [
  { id: "marketing_email", label: "Marketing E-Mails", description: "Werbliche Informationen per E-Mail" },
  { id: "data_processing", label: "Datenverarbeitung", description: "Verarbeitung personenbezogener Daten" },
  { id: "third_party", label: "Drittanbieter", description: "Weitergabe an Drittanbieter" },
  { id: "analytics", label: "Analyse", description: "Nutzungsanalyse und Statistiken" },
];

export default function PrivacySettings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [requestType, setRequestType] = useState<"export" | "delete" | "anonymize">("export");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch GDPR requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["gdpr-requests", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("gdpr_requests")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GDPRRequest[];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch tenants
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-for-gdpr", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("tenants")
        .select("id, first_name, last_name, email")
        .eq("organization_id", profile.organization_id)
        .order("last_name");

      if (error) throw error;
      return data as Tenant[];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch consents
  const { data: consents = [], isLoading: consentsLoading } = useQuery({
    queryKey: ["consent-records", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("consent_records")
        .select("*")
        .eq("organization_id", profile.organization_id);

      if (error) throw error;
      return data as Consent[];
    },
    enabled: !!profile?.organization_id,
  });

  // Create GDPR request
  const createRequest = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id || !user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("gdpr_requests")
        .insert({
          organization_id: profile.organization_id,
          request_type: requestType,
          tenant_id: selectedTenant || null,
          requester_id: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gdpr-requests"] });
      setIsDialogOpen(false);
      setSelectedTenant("");
      toast({
        title: "Anfrage erstellt",
        description: "Die DSGVO-Anfrage wurde erfolgreich erstellt und wird bearbeitet.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return "Alle Mieter";
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : "Unbekannt";
  };

  const getConsentForTenant = (tenantId: string, consentType: string) => {
    return consents.find((c) => c.tenant_id === tenantId && c.consent_type === consentType);
  };

  return (
    <MainLayout
      title="Datenschutz"
      breadcrumbs={[
        { label: "Einstellungen", href: "/einstellungen" },
        { label: "Datenschutz" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Datenschutz (DSGVO)
            </h1>
            <p className="text-muted-foreground">
              Verwalten Sie Datenexporte, Löschungen und Einwilligungen
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                Neue Anfrage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>DSGVO-Anfrage erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Datenschutz-Anfrage für einen Mieter.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Anfragetyp</Label>
                  <Select value={requestType} onValueChange={(v) => setRequestType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="export">
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Datenexport
                        </div>
                      </SelectItem>
                      <SelectItem value="delete">
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Datenlöschung
                        </div>
                      </SelectItem>
                      <SelectItem value="anonymize">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Anonymisierung
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mieter</Label>
                  <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mieter auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.first_name} {tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requestType === "delete" && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">Achtung</p>
                        <p className="text-sm text-muted-foreground">
                          Die Löschung ist unwiderruflich. Stellen Sie sicher, dass alle
                          gesetzlichen Aufbewahrungsfristen eingehalten wurden.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={() => createRequest.mutate()}
                  disabled={!selectedTenant || createRequest.isPending}
                >
                  {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Anfrage erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests">
              <FileCheck className="h-4 w-4 mr-2" />
              Anfragen
            </TabsTrigger>
            <TabsTrigger value="consents">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Einwilligungen
            </TabsTrigger>
            <TabsTrigger value="retention">
              <Clock className="h-4 w-4 mr-2" />
              Löschfristen
            </TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>DSGVO-Anfragen</CardTitle>
                <CardDescription>
                  Übersicht aller Datenexport- und Löschanfragen
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Mieter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Abgeschlossen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Laden...
                        </TableCell>
                      </TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <FileCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">Keine Anfragen vorhanden</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            {format(new Date(request.created_at), "dd.MM.yyyy", { locale: de })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const Icon = REQUEST_TYPES[request.request_type].icon;
                                return Icon ? <Icon className="h-4 w-4" /> : null;
                              })()}
                              {REQUEST_TYPES[request.request_type].label}
                            </div>
                          </TableCell>
                          <TableCell>{getTenantName(request.tenant_id)}</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGES[request.status].variant}>
                              {STATUS_BADGES[request.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.completed_at
                              ? format(new Date(request.completed_at), "dd.MM.yyyy", { locale: de })
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consents Tab */}
          <TabsContent value="consents">
            <Card>
              <CardHeader>
                <CardTitle>Einwilligungen verwalten</CardTitle>
                <CardDescription>
                  Übersicht der Einwilligungen Ihrer Mieter
                </CardDescription>
              </CardHeader>
              <CardContent>
                {consentsLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Laden...</p>
                ) : tenants.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Keine Mieter vorhanden
                  </p>
                ) : (
                  <div className="space-y-6">
                    {tenants.slice(0, 10).map((tenant) => (
                      <div key={tenant.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">
                          {tenant.first_name} {tenant.last_name}
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {CONSENT_TYPES.map((type) => {
                            const consent = getConsentForTenant(tenant.id, type.id);
                            return (
                              <div
                                key={type.id}
                                className="flex items-center justify-between p-2 rounded bg-muted/50"
                              >
                                <div>
                                  <p className="text-sm font-medium">{type.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {type.description}
                                  </p>
                                </div>
                                {consent?.consent_given ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retention Tab */}
          <TabsContent value="retention">
            <Card>
              <CardHeader>
                <CardTitle>Automatische Löschfristen</CardTitle>
                <CardDescription>
                  Konfigurieren Sie, wann Daten automatisch gelöscht werden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "Aktivitätsprotokolle", retention: "2 Jahre", description: "Audit-Logs werden nach 2 Jahren gelöscht" },
                    { type: "Benachrichtigungen", retention: "90 Tage", description: "Gelesene Benachrichtigungen werden nach 90 Tagen gelöscht" },
                    { type: "Ehemalige Mieter", retention: "10 Jahre", description: "Mieterdaten werden 10 Jahre nach Vertragsende aufbewahrt" },
                    { type: "Zahlungsbelege", retention: "10 Jahre", description: "Aufbewahrung gemäß steuerlicher Vorschriften" },
                  ].map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.type}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="secondary">{item.retention}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
