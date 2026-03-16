import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Users,
  Building2,
  Mail,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Printer,
  Globe,
  UserCheck,
  MessageSquare,
  History,
  Filter,
} from "lucide-react";

export default function BulkMessaging() {
  const [recipientMode, setRecipientMode] = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const recipientCount = recipientMode === "all" ? 48
    : recipientMode === "building" && selectedBuilding ? 12
    : recipientMode === "status" && selectedStatus ? 35
    : 0;

  const templates = [
    { id: "mietanpassung", name: "Mietanpassung", category: "Vertrag" },
    { id: "nebenkostenabrechnung", name: "Nebenkostenabrechnung", category: "Abrechnung" },
    { id: "wartungsankuendigung", name: "Wartungsankündigung", category: "Instandhaltung" },
    { id: "allgemeine-info", name: "Allgemeine Information", category: "Allgemein" },
    { id: "saisonale-hinweise", name: "Saisonale Hinweise", category: "Allgemein" },
  ];

  const messageHistory = [
    { id: 1, subject: "Nebenkostenabrechnung 2025", recipients: 48, channel: "Email", status: "sent", date: "10.02.2026", openRate: "82%" },
    { id: 2, subject: "Wartungsarbeiten Heizung", recipients: 12, channel: "Email", status: "sent", date: "05.02.2026", openRate: "91%" },
    { id: 3, subject: "Mietanpassung ab April", recipients: 35, channel: "Brief", status: "sent", date: "01.02.2026", openRate: "-" },
    { id: 4, subject: "Winterdienst Information", recipients: 48, channel: "Portal", status: "sent", date: "15.01.2026", openRate: "67%" },
    { id: 5, subject: "Rauchmelder-Prüfung", recipients: 24, channel: "Email", status: "failed", date: "10.01.2026", openRate: "-" },
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.name);
      setBody(`Sehr geehrte Mieterinnen und Mieter,\n\nwir möchten Sie hiermit über ${template.name.toLowerCase()} informieren.\n\n[Hier Nachrichtentext einfügen]\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`);
    }
  };

  const handleSend = () => {
    console.log("Sending bulk message", {
      recipientMode,
      selectedBuilding,
      selectedStatus,
      channel: selectedChannel,
      subject,
      body,
      recipientCount,
    });
  };

  return (
    <MainLayout title="Massenversand">
      <div className="space-y-6">
        <PageHeader
          title="Massenversand"
          subtitle="Senden Sie Nachrichten an mehrere Mieter gleichzeitig"
          breadcrumbs={[
            { label: "Kommunikation", href: "/kommunikation" },
            { label: "Massenversand" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Compose */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipient Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Empfänger auswählen
                  {recipientCount > 0 && (
                    <Badge>{recipientCount} Empfänger</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      recipientMode === "all"
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setRecipientMode("all")}
                  >
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">Alle Mieter</span>
                    <span className="text-xs text-muted-foreground">48 Mieter</span>
                  </div>
                  <div
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      recipientMode === "building"
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setRecipientMode("building")}
                  >
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">Nach Gebäude</span>
                    <span className="text-xs text-muted-foreground">Filtern</span>
                  </div>
                  <div
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      recipientMode === "status"
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setRecipientMode("status")}
                  >
                    <Filter className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">Nach Status</span>
                    <span className="text-xs text-muted-foreground">Filtern</span>
                  </div>
                </div>

                {recipientMode === "building" && (
                  <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gebäude auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hauptstrasse">Hauptstraße 1 (12 Mieter)</SelectItem>
                      <SelectItem value="parkweg">Parkweg 5 (8 Mieter)</SelectItem>
                      <SelectItem value="seestrasse">Seestraße 12 (16 Mieter)</SelectItem>
                      <SelectItem value="bergallee">Bergallee 3 (6 Mieter)</SelectItem>
                      <SelectItem value="waldring">Waldring 7 (6 Mieter)</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {recipientMode === "status" && (
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktive Mieter (35)</SelectItem>
                      <SelectItem value="overdue">Mit Zahlungsrückstand (8)</SelectItem>
                      <SelectItem value="expiring">Vertrag läuft aus (5)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Template & Channel Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Vorlage und Kanal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vorlage</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vorlage auswählen (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <span className="flex items-center gap-2">
                              {t.name}
                              <Badge variant="outline" className="text-xs">{t.category}</Badge>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Versandkanal</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "email", label: "Email", icon: Mail },
                        { value: "brief", label: "Brief", icon: Printer },
                        { value: "portal", label: "Portal", icon: Globe },
                      ].map((channel) => (
                        <Button
                          key={channel.value}
                          variant={selectedChannel === channel.value ? "default" : "outline"}
                          className="flex items-center gap-1"
                          onClick={() => setSelectedChannel(channel.value)}
                        >
                          <channel.icon className="h-4 w-4" />
                          {channel.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Composer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Nachricht verfassen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Betreff</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Betreff der Nachricht..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nachricht</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Nachrichtentext eingeben..."
                    className="min-h-[200px]"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Verfügbare Platzhalter: {"{{vorname}}"}, {"{{nachname}}"}, {"{{einheit}}"}, {"{{gebaeude}}"}, {"{{miete}}"}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? "Vorschau schließen" : "Vorschau"}
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={!subject.trim() || !body.trim() || recipientCount === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    An {recipientCount} Empfänger senden
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview & Info */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" />
                  Vorschau
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subject || body ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">An:</p>
                      <p className="text-sm font-medium">
                        {recipientMode === "all"
                          ? "Alle Mieter (48)"
                          : recipientMode === "building"
                          ? `Mieter in ${selectedBuilding || "..."}`
                          : `Mieter mit Status: ${selectedStatus || "..."}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Kanal: {selectedChannel === "email" ? "E-Mail" : selectedChannel === "brief" ? "Brief" : "Portal"}
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-xs text-muted-foreground mb-1">Betreff:</p>
                      <p className="font-medium text-sm mb-3">{subject || "(kein Betreff)"}</p>
                      <p className="text-xs text-muted-foreground mb-1">Nachricht:</p>
                      <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {body || "(kein Inhalt)"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Verfassen Sie eine Nachricht</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCheck className="h-4 w-4" />
                  Zusammenfassung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Empfänger</span>
                    <span className="text-sm font-medium">{recipientCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Kanal</span>
                    <Badge variant="outline">
                      {selectedChannel === "email" ? "E-Mail" : selectedChannel === "brief" ? "Brief" : "Portal"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vorlage</span>
                    <span className="text-sm font-medium">
                      {selectedTemplate
                        ? templates.find((t) => t.id === selectedTemplate)?.name
                        : "Keine"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Betreff</span>
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {subject || "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Message History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Versandverlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Betreff</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Empfänger</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Kanal</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Öffnungsrate</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {messageHistory.map((msg) => (
                    <tr key={msg.id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">{msg.subject}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{msg.recipients}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{msg.channel}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {msg.status === "sent" ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Gesendet
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Fehlgeschlagen
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{msg.openRate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">{msg.date}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
