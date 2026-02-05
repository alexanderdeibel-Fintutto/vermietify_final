import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader, LoadingState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Clock,
  Users,
  Building,
  Mail,
  Eye,
  Search,
  X,
  CheckCircle,
} from "lucide-react";
import { useEmailTemplates, EmailTemplate, EMAIL_CATEGORIES } from "@/hooks/useEmailTemplates";
import { useTenants } from "@/hooks/useTenants";
import { useBuildings } from "@/hooks/useBuildings";
import { toast } from "@/hooks/use-toast";

interface RecipientTenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  unit_number?: string;
  building_name?: string;
}

export default function ComposeEmail() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [recipientMode, setRecipientMode] = useState<"single" | "multiple" | "building" | "all">("single");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [previewRecipient, setPreviewRecipient] = useState<RecipientTenant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { templates, templatesLoading, sendEmail, replacePlaceholders } = useEmailTemplates();
  const { useTenantsList } = useTenants();
  const { data: tenants = [], isLoading: tenantsLoading } = useTenantsList();
  const { useBuildingsList } = useBuildings();
  const { data: buildingsData } = useBuildingsList(1, 100);
  const buildings = buildingsData?.buildings || [];

  // Map tenants to recipients with unit info
  const recipients: RecipientTenant[] = tenants
    .filter((t) => t.email)
    .map((t) => ({
      id: t.id,
      first_name: t.first_name,
      last_name: t.last_name,
      email: t.email!,
      unit_number: t.leases?.[0]?.units?.unit_number,
      building_name: t.leases?.[0]?.units?.buildings?.name,
    }));

  // Filter recipients by search
  const filteredRecipients = recipients.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.first_name.toLowerCase().includes(term) ||
      r.last_name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term)
    );
  });

  // Get recipients by building
  const recipientsByBuilding = selectedBuilding
    ? recipients.filter((r) => {
        const tenant = tenants.find((t) => t.id === r.id);
        return tenant?.leases?.some((l) => l.units?.buildings?.id === selectedBuilding);
      })
    : [];

  // Calculate final recipients
  const getFinalRecipients = (): string[] => {
    switch (recipientMode) {
      case "single":
      case "multiple":
        return selectedRecipients;
      case "building":
        return recipientsByBuilding.map((r) => r.id);
      case "all":
        return recipients.map((r) => r.id);
      default:
        return [];
    }
  };

  // Load template
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (template) {
        setSubject(template.subject);
        setBodyHtml(template.body_html);
      }
    }
  }, [selectedTemplate, templates]);

  // Set first recipient as preview
  useEffect(() => {
    const finalRecipients = getFinalRecipients();
    if (finalRecipients.length > 0) {
      const first = recipients.find((r) => r.id === finalRecipients[0]);
      setPreviewRecipient(first || null);
    } else {
      setPreviewRecipient(null);
    }
  }, [selectedRecipients, recipientMode, selectedBuilding]);

  const handleSend = () => {
    const finalRecipients = getFinalRecipients();
    if (finalRecipients.length === 0) {
      toast({ title: "Keine Empfänger ausgewählt", variant: "destructive" });
      return;
    }
    if (!subject.trim()) {
      toast({ title: "Betreff fehlt", variant: "destructive" });
      return;
    }
    if (!bodyHtml.trim()) {
      toast({ title: "Inhalt fehlt", variant: "destructive" });
      return;
    }

    sendEmail.mutate({
      templateId: selectedTemplate || undefined,
      recipientIds: finalRecipients,
      subject,
      body_html: bodyHtml,
      scheduledFor: scheduledFor || undefined,
    });
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const getPreviewContent = () => {
    if (!previewRecipient) return bodyHtml;
    return replacePlaceholders(bodyHtml, {
      tenant: {
        first_name: previewRecipient.first_name,
        last_name: previewRecipient.last_name,
        salutation: "",
      },
      unit: {
        unit_number: previewRecipient.unit_number || "",
      },
      building: {
        name: previewRecipient.building_name || "",
      },
    });
  };

  const finalRecipientCount = getFinalRecipients().length;

  if (templatesLoading || tenantsLoading) {
    return (
      <MainLayout title="E-Mail verfassen">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="E-Mail verfassen">
      <div className="space-y-6">
        <PageHeader
          title="E-Mail verfassen"
          subtitle="Senden Sie personalisierte E-Mails an Ihre Mieter"
          breadcrumbs={[
            { label: "Kommunikation", href: "/kommunikation" },
            { label: "Senden" },
          ]}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Compose Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Vorlage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vorlage auswählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine Vorlage</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          {t.name}
                          <Badge variant="outline" className="text-xs">
                            {EMAIL_CATEGORIES[t.category]}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Recipients */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Empfänger
                  {finalRecipientCount > 0 && (
                    <Badge>{finalRecipientCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={recipientMode} onValueChange={(v) => {
                  setRecipientMode(v as typeof recipientMode);
                  setSelectedRecipients([]);
                  setSelectedBuilding("");
                }}>
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="single">Einzeln</TabsTrigger>
                    <TabsTrigger value="multiple">Mehrere</TabsTrigger>
                    <TabsTrigger value="building">Gebäude</TabsTrigger>
                    <TabsTrigger value="all">Alle</TabsTrigger>
                  </TabsList>

                  <TabsContent value="single" className="space-y-3">
                    <Select
                      value={selectedRecipients[0] || ""}
                      onValueChange={(v) => setSelectedRecipients(v ? [v] : [])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mieter auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.first_name} {r.last_name} ({r.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>

                  <TabsContent value="multiple" className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Mieter suchen..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-48 border rounded-md p-2">
                      {filteredRecipients.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                          onClick={() => toggleRecipient(r.id)}
                        >
                          <Checkbox checked={selectedRecipients.includes(r.id)} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {r.first_name} {r.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{r.email}</p>
                          </div>
                          {r.unit_number && (
                            <Badge variant="outline" className="text-xs">
                              {r.unit_number}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                    {selectedRecipients.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedRecipients.map((id) => {
                          const r = recipients.find((r) => r.id === id);
                          return r ? (
                            <Badge key={id} variant="secondary" className="gap-1">
                              {r.first_name} {r.last_name}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => toggleRecipient(id)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="building" className="space-y-3">
                    <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                      <SelectTrigger>
                        <SelectValue placeholder="Gebäude auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            <span className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {b.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedBuilding && (
                      <p className="text-sm text-muted-foreground">
                        {recipientsByBuilding.length} Mieter in diesem Gebäude
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="all">
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-medium">{recipients.length} Mieter</p>
                      <p className="text-sm text-muted-foreground">
                        Alle Mieter mit E-Mail-Adresse
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Email Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inhalt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Betreff</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="E-Mail-Betreff..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nachricht</Label>
                  <Textarea
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder="<p>E-Mail-Inhalt...</p>"
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Send */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Geplanter Versand (optional)
                    </Label>
                    <Input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleSend}
                      disabled={finalRecipientCount === 0 || sendEmail.isPending}
                      className="w-full sm:w-auto"
                    >
                      {sendEmail.isPending ? (
                        <>Senden...</>
                      ) : scheduledFor ? (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Planen
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Jetzt senden ({finalRecipientCount})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Vorschau
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewRecipient ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">An:</p>
                      <p className="text-sm font-medium">
                        {previewRecipient.first_name} {previewRecipient.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {previewRecipient.email}
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-1">Betreff:</p>
                      <p className="font-medium text-sm mb-4">{subject || "(kein Betreff)"}</p>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                      />
                    </div>
                    {finalRecipientCount > 1 && (
                      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                        Vorschau für 1 von {finalRecipientCount} Empfängern
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Wählen Sie Empfänger aus</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
