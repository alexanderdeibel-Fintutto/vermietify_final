import { useState } from "react";
import { TenantLayout } from "@/components/tenant-portal/TenantLayout";
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
import { EmptyState } from "@/components/shared";
import {
  UserCog,
  Home,
  PawPrint,
  Car,
  Key,
  Paintbrush,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface RequestType {
  id: string;
  label: string;
  description: string;
  icon: typeof UserCog;
  color: string;
}

const REQUEST_TYPES: RequestType[] = [
  {
    id: "name_change",
    label: "Namensänderung",
    description: "Änderung des Namens im Mietvertrag",
    icon: UserCog,
    color: "text-blue-500 bg-blue-50",
  },
  {
    id: "subletting",
    label: "Untervermietung",
    description: "Genehmigung zur Untervermietung beantragen",
    icon: Home,
    color: "text-green-500 bg-green-50",
  },
  {
    id: "pet_request",
    label: "Haustieranfrage",
    description: "Genehmigung zur Tierhaltung beantragen",
    icon: PawPrint,
    color: "text-orange-500 bg-orange-50",
  },
  {
    id: "parking",
    label: "Parkplatz",
    description: "Stellplatz beantragen oder ändern",
    icon: Car,
    color: "text-purple-500 bg-purple-50",
  },
  {
    id: "key_copy",
    label: "Schlüsselkopie",
    description: "Zusätzlichen Schlüssel anfordern",
    icon: Key,
    color: "text-yellow-500 bg-yellow-50",
  },
  {
    id: "renovation",
    label: "Renovierung",
    description: "Genehmigung für Renovierungsarbeiten",
    icon: Paintbrush,
    color: "text-cyan-500 bg-cyan-50",
  },
];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Ausstehend", icon: Clock, className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Genehmigt", icon: CheckCircle, className: "bg-green-100 text-green-800" },
  rejected: { label: "Abgelehnt", icon: XCircle, className: "bg-red-100 text-red-800" },
  in_progress: { label: "In Bearbeitung", icon: Clock, className: "bg-blue-100 text-blue-800" },
};

// Placeholder existing requests
const existingRequests = [
  {
    id: "1",
    type: "pet_request",
    status: "approved",
    created_at: "2025-11-15T10:00:00Z",
    notes: "Anfrage für eine Katze",
  },
  {
    id: "2",
    type: "parking",
    status: "pending",
    created_at: "2026-01-20T14:30:00Z",
    notes: "Stellplatz in der Tiefgarage",
  },
  {
    id: "3",
    type: "key_copy",
    status: "rejected",
    created_at: "2025-12-05T09:15:00Z",
    notes: "Zusätzlicher Wohnungsschlüssel",
  },
];

export default function TenantSelfService() {
  const { toast } = useToast();
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [formNotes, setFormNotes] = useState("");
  const [formName, setFormName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenForm = (type: RequestType) => {
    setSelectedType(type);
    setFormNotes("");
    setFormName("");
    setShowFormDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Anfrage gesendet",
      description: `Ihre Anfrage "${selectedType.label}" wurde erfolgreich eingereicht.`,
    });
    setIsSubmitting(false);
    setShowFormDialog(false);
  };

  return (
    <TenantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Self-Service</h1>
          <p className="text-muted-foreground">
            Stellen Sie Anträge und Anfragen direkt online.
          </p>
        </div>

        {/* Request Type Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REQUEST_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleOpenForm(type)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${type.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{type.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Existing Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Meine Anfragen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingRequests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Keine Anfragen"
                description="Sie haben noch keine Anfragen gestellt."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Typ</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Datum</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Anmerkung</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingRequests.map((req) => {
                      const typeConfig = REQUEST_TYPES.find((t) => t.id === req.type);
                      const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                      const StatusIcon = statusConfig.icon;

                      return (
                        <tr key={req.id} className="border-b last:border-0">
                          <td className="py-3">
                            <span className="font-medium">{typeConfig?.label || req.type}</span>
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {format(new Date(req.created_at), "dd.MM.yyyy", { locale: de })}
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {req.notes}
                          </td>
                          <td className="py-3">
                            <Badge variant="outline" className={statusConfig.className}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedType?.label} - Anfrage stellen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedType?.id === "name_change" && (
              <div className="space-y-2">
                <Label>Neuer Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Neuer vollständiger Name"
                />
              </div>
            )}

            {selectedType?.id === "pet_request" && (
              <div className="space-y-2">
                <Label>Tierart & Rasse *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="z.B. Katze, Britisch Kurzhaar"
                />
              </div>
            )}

            {selectedType?.id === "subletting" && (
              <div className="space-y-2">
                <Label>Zeitraum der Untervermietung *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="z.B. 01.03.2026 - 31.08.2026"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Begründung / Anmerkungen</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Bitte beschreiben Sie Ihre Anfrage..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Anfrage senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TenantLayout>
  );
}
