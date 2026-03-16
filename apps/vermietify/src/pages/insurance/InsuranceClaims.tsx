import { useState } from "react";
import { Link } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState, EmptyState } from "@/components/shared";
import { useInsurance, INSURANCE_TYPE_LABELS } from "@/hooks/useInsurance";
import {
  AlertTriangle,
  Plus,
  FileSearch,
  CheckCircle,
  Clock,
  XCircle,
  Gavel,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const CLAIM_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  reported: { label: "Gemeldet", className: "bg-blue-100 text-blue-800" },
  in_review: { label: "In Prüfung", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Genehmigt", className: "bg-green-100 text-green-800" },
  rejected: { label: "Abgelehnt", className: "bg-red-100 text-red-800" },
  settled: { label: "Reguliert", className: "bg-emerald-100 text-emerald-800" },
};

// Placeholder claims data
const placeholderClaims = [
  {
    id: "1",
    claim_number: "SCH-2026-001",
    policy_type: "water",
    policy_number: "VP-2024-003",
    incident_date: "2026-01-15",
    status: "in_review",
    description: "Wasserschaden durch defekte Waschmaschine in EG links",
    claimed_amount_cents: 350000,
    settled_amount_cents: null,
    created_at: "2026-01-16T08:00:00Z",
  },
  {
    id: "2",
    claim_number: "SCH-2025-008",
    policy_type: "building",
    policy_number: "VP-2024-001",
    incident_date: "2025-11-20",
    status: "settled",
    description: "Sturmschaden am Dach - mehrere Ziegel beschädigt",
    claimed_amount_cents: 820000,
    settled_amount_cents: 750000,
    created_at: "2025-11-21T10:00:00Z",
  },
  {
    id: "3",
    claim_number: "SCH-2025-005",
    policy_type: "glass",
    policy_number: "VP-2024-005",
    incident_date: "2025-09-03",
    status: "approved",
    description: "Einbruchversuch - Fensterscheibe im 2. OG beschädigt",
    claimed_amount_cents: 180000,
    settled_amount_cents: null,
    created_at: "2025-09-04T14:00:00Z",
  },
  {
    id: "4",
    claim_number: "SCH-2025-002",
    policy_type: "liability",
    policy_number: "VP-2024-002",
    incident_date: "2025-06-10",
    status: "rejected",
    description: "Mieter stürzt auf glatter Treppe - Eigenverschulden festgestellt",
    claimed_amount_cents: 500000,
    settled_amount_cents: 0,
    created_at: "2025-06-11T09:00:00Z",
  },
];

export default function InsuranceClaims() {
  const { data: policies = [], isLoading, createClaim } = useInsurance();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    policy_id: "",
    incident_date: "",
    description: "",
    claimed_amount_cents: 0,
  });

  const handleCreateClaim = async () => {
    if (!formData.policy_id || !formData.incident_date || !formData.description) return;
    setIsSubmitting(true);
    try {
      await createClaim.mutateAsync({
        policy_id: formData.policy_id,
        incident_date: formData.incident_date,
        description: formData.description,
        claimed_amount_cents: Math.round(formData.claimed_amount_cents * 100),
        status: "reported",
      });
      setShowNewDialog(false);
      setFormData({ policy_id: "", incident_date: "", description: "", claimed_amount_cents: 0 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Schadensfälle">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Schadensfälle"
      breadcrumbs={[
        { label: "Versicherungen", href: "/versicherungen" },
        { label: "Schadensfälle" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Schadensfälle"
          subtitle="Übersicht und Verwaltung aller Versicherungsschäden."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/versicherungen">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Link>
              </Button>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schaden melden
              </Button>
            </div>
          }
        />

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Gemeldete Schadensfälle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {placeholderClaims.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Keine Schadensfälle"
                description="Aktuell gibt es keine gemeldeten Schadensfälle."
                action={
                  <Button onClick={() => setShowNewDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schaden melden
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Schadennr.</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Versicherung</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Vorfallsdatum</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Beschreibung</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground text-right">Gefordert</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground text-right">Reguliert</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placeholderClaims.map((claim) => {
                      const statusConfig = CLAIM_STATUS_CONFIG[claim.status] || CLAIM_STATUS_CONFIG.reported;
                      return (
                        <tr key={claim.id} className="border-b last:border-0">
                          <td className="py-3 text-sm font-mono font-medium">
                            {claim.claim_number}
                          </td>
                          <td className="py-3 text-sm">
                            <div>
                              <span>{INSURANCE_TYPE_LABELS[claim.policy_type] || claim.policy_type}</span>
                              <p className="text-xs text-muted-foreground">{claim.policy_number}</p>
                            </div>
                          </td>
                          <td className="py-3 text-sm">
                            {format(new Date(claim.incident_date), "dd.MM.yyyy", { locale: de })}
                          </td>
                          <td className="py-3 text-sm max-w-[250px] truncate text-muted-foreground">
                            {claim.description}
                          </td>
                          <td className="py-3 text-sm font-mono text-right">
                            {claim.claimed_amount_cents
                              ? `${(claim.claimed_amount_cents / 100).toFixed(2)} €`
                              : "-"}
                          </td>
                          <td className="py-3 text-sm font-mono text-right">
                            {claim.settled_amount_cents !== null
                              ? `${(claim.settled_amount_cents / 100).toFixed(2)} €`
                              : "-"}
                          </td>
                          <td className="py-3">
                            <Badge variant="outline" className={statusConfig.className}>
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

      {/* New Claim Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schadensfall melden</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Versicherungspolice *</Label>
              <Select
                value={formData.policy_id}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, policy_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Police auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {INSURANCE_TYPE_LABELS[policy.type]} - {policy.policy_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vorfallsdatum *</Label>
              <Input
                type="date"
                value={formData.incident_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, incident_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Beschreibung *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Beschreiben Sie den Schadensfall detailliert..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Geschätzter Schaden (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.claimed_amount_cents || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, claimed_amount_cents: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateClaim}
              disabled={isSubmitting || !formData.policy_id || !formData.incident_date || !formData.description}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schaden melden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
