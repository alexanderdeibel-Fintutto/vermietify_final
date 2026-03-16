import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCompliance, ComplianceCheck } from "@/hooks/useCompliance";
import { LoadingState, EmptyState } from "@/components/shared";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MinusCircle,
  RefreshCw,
  Building2,
  Filter,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
  passed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100 text-green-800",
    label: "Bestanden",
  },
  pending: {
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-100 text-blue-800",
    label: "Ausstehend",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-100 text-orange-800",
    label: "Warnung",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100 text-red-800",
    label: "Fehlgeschlagen",
  },
  not_applicable: {
    icon: MinusCircle,
    color: "text-gray-400",
    bgColor: "bg-gray-100 text-gray-800",
    label: "Nicht zutreffend",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  dsgvo: "Datenschutz (DSGVO)",
  tax: "Steuerrecht",
  building: "Baurecht",
  contract: "Vertragsrecht",
  energy: "Energierecht",
  fire_safety: "Brandschutz",
  accessibility: "Barrierefreiheit",
};

const CATEGORY_COLORS: Record<string, string> = {
  dsgvo: "bg-blue-100 text-blue-800",
  tax: "bg-violet-100 text-violet-800",
  building: "bg-orange-100 text-orange-800",
  contract: "bg-green-100 text-green-800",
  energy: "bg-yellow-100 text-yellow-800",
  fire_safety: "bg-red-100 text-red-800",
  accessibility: "bg-cyan-100 text-cyan-800",
};

export default function TaxComplianceChecker() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { checks, updateCheck, complianceScore } = useCompliance();
  const { data: checksList = [], isLoading } = checks;

  const filteredChecks = selectedCategory === "all"
    ? checksList
    : (checksList as ComplianceCheck[]).filter((c) => c.category === selectedCategory);

  const score = complianceScore(checksList as ComplianceCheck[]);

  const statusCounts = {
    passed: (checksList as ComplianceCheck[]).filter((c) => c.status === "passed").length,
    pending: (checksList as ComplianceCheck[]).filter((c) => c.status === "pending").length,
    warning: (checksList as ComplianceCheck[]).filter((c) => c.status === "warning").length,
    failed: (checksList as ComplianceCheck[]).filter((c) => c.status === "failed").length,
  };

  const handleUpdateStatus = (id: string, status: ComplianceCheck["status"]) => {
    updateCheck.mutate({ id, status });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <MainLayout title="Compliance">
      <div className="space-y-6">
        <PageHeader
          title="Compliance-Prufung"
          subtitle="Ubersicht aller regulatorischen Anforderungen"
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Compliance" },
          ]}
        />

        {/* Compliance Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-primary/10 p-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Compliance-Score</h3>
                  <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${getProgressColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {Object.entries(statusCounts).map(([status, count]) => {
                    const config = STATUS_CONFIG[status];
                    if (!config) return null;
                    const StatusIcon = config.icon;
                    return (
                      <div key={status} className="flex items-center gap-1 text-sm">
                        <StatusIcon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-muted-foreground">
                          {count} {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            Alle
          </Button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Compliance Checks List */}
        {isLoading ? (
          <LoadingState />
        ) : (filteredChecks as ComplianceCheck[]).length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Keine Prufungen"
            description="Es wurden noch keine Compliance-Prufungen durchgefuhrt"
          />
        ) : (
          <div className="space-y-3">
            {(filteredChecks as ComplianceCheck[]).map((check) => {
              const config = STATUS_CONFIG[check.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;

              return (
                <Card key={check.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <StatusIcon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                        <div>
                          <p className="font-medium">{check.check_type}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {check.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={CATEGORY_COLORS[check.category]}>
                              {CATEGORY_LABELS[check.category] || check.category}
                            </Badge>
                            {check.buildings?.name && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {check.buildings.name}
                              </span>
                            )}
                            {check.due_date && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Fallig: {new Date(check.due_date).toLocaleDateString("de-DE")}
                              </span>
                            )}
                          </div>
                          {check.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {check.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={config.bgColor}>
                          {config.label}
                        </Badge>
                        {check.status !== "passed" && check.status !== "not_applicable" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(check.id, "passed")}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Bestanden
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
