import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useInsurance, INSURANCE_TYPE_LABELS, InsurancePolicy } from "@/hooks/useInsurance";
import {
  Shield,
  Plus,
  FileText,
  Euro,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const PREMIUM_INTERVAL_LABELS: Record<string, string> = {
  monthly: "Monatlich",
  quarterly: "Vierteljährlich",
  semi_annual: "Halbjährlich",
  yearly: "Jährlich",
};

export default function InsuranceDashboard() {
  const { data: policies = [], isLoading, createPolicy } = useInsurance();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    policy_number: "",
    provider: "",
    type: "building" as InsurancePolicy["type"],
    premium_cents: 0,
    premium_interval: "yearly" as InsurancePolicy["premium_interval"],
    start_date: "",
    end_date: "",
    deductible_cents: 0,
  });

  // KPI calculations
  const activePolicies = policies.filter(
    (p) => !p.end_date || new Date(p.end_date) > new Date()
  );
  const annualPremium = activePolicies.reduce((sum, p) => {
    const multiplier =
      p.premium_interval === "monthly" ? 12
      : p.premium_interval === "quarterly" ? 4
      : p.premium_interval === "semi_annual" ? 2
      : 1;
    return sum + (p.premium_cents * multiplier) / 100;
  }, 0);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await createPolicy.mutateAsync({
        ...formData,
        premium_cents: Math.round(formData.premium_cents * 100),
        deductible_cents: Math.round(formData.deductible_cents * 100),
        end_date: formData.end_date || null,
        auto_renew: true,
      });
      setShowNewDialog(false);
      setFormData({
        policy_number: "",
        provider: "",
        type: "building",
        premium_cents: 0,
        premium_interval: "yearly",
        start_date: "",
        end_date: "",
        deductible_cents: 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Versicherungen">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Versicherungen" breadcrumbs={[{ label: "Versicherungen" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Versicherungen"
          subtitle="Verwalten Sie alle Versicherungspolicen Ihrer Immobilien."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/versicherungen/schaeden">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Schadensfälle
                </Link>
              </Button>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Versicherung
              </Button>
            </div>
          }
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aktive Policen</p>
                  <p className="text-2xl font-bold">{activePolicies.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jahresprämie</p>
                  <p className="text-2xl font-bold">{annualPremium.toFixed(2)} €</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Offene Schadensfälle</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Policies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Versicherungspolicen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="Keine Versicherungen"
                description="Erstellen Sie Ihre erste Versicherungspolice."
                action={
                  <Button onClick={() => setShowNewDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Versicherung
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Typ</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Anbieter</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Policennr.</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Gebäude</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground text-right">Prämie</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Laufzeit</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((policy) => {
                      const isActive = !policy.end_date || new Date(policy.end_date) > new Date();
                      return (
                        <tr key={policy.id} className="border-b last:border-0">
                          <td className="py-3 text-sm font-medium">
                            {INSURANCE_TYPE_LABELS[policy.type] || policy.type}
                          </td>
                          <td className="py-3 text-sm">{policy.provider}</td>
                          <td className="py-3 text-sm font-mono text-muted-foreground">
                            {policy.policy_number}
                          </td>
                          <td className="py-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {policy.buildings?.name || "Alle"}
                            </div>
                          </td>
                          <td className="py-3 text-sm font-mono text-right">
                            {(policy.premium_cents / 100).toFixed(2)} € / {PREMIUM_INTERVAL_LABELS[policy.premium_interval]}
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {format(new Date(policy.start_date), "dd.MM.yyyy", { locale: de })}
                            {policy.end_date && (
                              <> - {format(new Date(policy.end_date), "dd.MM.yyyy", { locale: de })}</>
                            )}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant="outline"
                              className={isActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}
                            >
                              {isActive ? (
                                <><CheckCircle className="h-3 w-3 mr-1" />Aktiv</>
                              ) : (
                                <><Clock className="h-3 w-3 mr-1" />Abgelaufen</>
                              )}
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

      {/* New Policy Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neue Versicherungspolice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Versicherungsart *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, type: val as InsurancePolicy["type"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INSURANCE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Anbieter *</Label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData((prev) => ({ ...prev, provider: e.target.value }))}
                  placeholder="z.B. Allianz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Policennummer *</Label>
              <Input
                value={formData.policy_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, policy_number: e.target.value }))}
                placeholder="z.B. VN-2026-001"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prämie (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.premium_cents || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, premium_cents: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Zahlungsintervall</Label>
                <Select
                  value={formData.premium_interval}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, premium_interval: val as InsurancePolicy["premium_interval"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PREMIUM_INTERVAL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Beginn *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Ende (optional)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selbstbeteiligung (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.deductible_cents || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, deductible_cents: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !formData.policy_number || !formData.provider || !formData.start_date}
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
