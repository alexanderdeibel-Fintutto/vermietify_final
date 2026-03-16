import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCompliance, ComplianceCheck } from "@/hooks/useCompliance";
import { LoadingState } from "@/components/shared";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Building2,
  Flame,
  Leaf,
  FileText,
  Calculator,
  Calendar,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";

interface CategoryConfig {
  key: string;
  label: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: "dsgvo", label: "DSGVO", icon: Lock, color: "text-blue-600", bgColor: "bg-blue-100" },
  { key: "building", label: "Gebäude", icon: Building2, color: "text-green-600", bgColor: "bg-green-100" },
  { key: "fire_safety", label: "Brandschutz", icon: Flame, color: "text-red-600", bgColor: "bg-red-100" },
  { key: "energy", label: "Energie", icon: Leaf, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  { key: "contract", label: "Verträge", icon: FileText, color: "text-purple-600", bgColor: "bg-purple-100" },
  { key: "tax", label: "Steuern", icon: Calculator, color: "text-orange-600", bgColor: "bg-orange-100" },
];

const STATUS_STYLES: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  passed: { label: "Bestanden", color: "bg-green-100 text-green-800", icon: CheckCircle },
  warning: { label: "Warnung", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  failed: { label: "Fehlgeschlagen", color: "bg-red-100 text-red-800", icon: XCircle },
  pending: { label: "Ausstehend", color: "bg-gray-100 text-gray-800", icon: Clock },
  not_applicable: { label: "N/A", color: "bg-gray-50 text-gray-500", icon: Clock },
};

export default function ComplianceDashboard() {
  const { checks, complianceScore } = useCompliance();
  const allChecks = checks.data || [];
  const overallScore = complianceScore(allChecks);

  // Calculate score per category
  const categoryScores = CATEGORIES.map((cat) => {
    const catChecks = allChecks.filter((c) => c.category === cat.key);
    return {
      ...cat,
      score: complianceScore(catChecks),
      total: catChecks.length,
      passed: catChecks.filter((c) => c.status === "passed").length,
      warnings: catChecks.filter((c) => c.status === "warning").length,
      failed: catChecks.filter((c) => c.status === "failed").length,
    };
  });

  // Upcoming checks (pending with due date, sorted by date)
  const upcomingChecks = allChecks
    .filter((c) => c.status === "pending" && c.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 8);

  // Recent failed/warning checks
  const issueChecks = allChecks
    .filter((c) => c.status === "failed" || c.status === "warning")
    .slice(0, 5);

  if (checks.isLoading) {
    return (
      <MainLayout title="Compliance">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Compliance">
      <div className="space-y-6">
        <PageHeader
          title="Compliance-Dashboard"
          subtitle="Überblick über alle Compliance-Anforderungen und deren Status"
          breadcrumbs={[{ label: "Compliance" }]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/compliance/checkliste">
                  <FileText className="h-4 w-4 mr-2" />
                  Checkliste
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/compliance/audit">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Audit-Readiness
                </Link>
              </Button>
            </div>
          }
        />

        {/* Overall Score */}
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Circle */}
              <div className="relative inline-flex shrink-0">
                <svg className="w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="84"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="14"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="84"
                    fill="none"
                    stroke={
                      overallScore >= 80
                        ? "#10b981"
                        : overallScore >= 50
                        ? "#f59e0b"
                        : "#ef4444"
                    }
                    strokeWidth="14"
                    strokeDasharray={`${overallScore * 5.28} 528`}
                    strokeLinecap="round"
                    transform="rotate(-90 96 96)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold">{overallScore}</span>
                  <span className="text-sm text-muted-foreground">von 100</span>
                </div>
              </div>

              {/* Score Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">Compliance-Score</h3>
                  <p className="text-muted-foreground">
                    {overallScore >= 80
                      ? "Ihr Compliance-Status ist gut. Weiter so!"
                      : overallScore >= 50
                      ? "Einige Bereiche benötigen Aufmerksamkeit."
                      : "Dringender Handlungsbedarf bei mehreren Compliance-Bereichen."}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{allChecks.length}</p>
                    <p className="text-xs text-muted-foreground">Prüfungen gesamt</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-600">
                      {allChecks.filter((c) => c.status === "passed").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Bestanden</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-50">
                    <p className="text-2xl font-bold text-yellow-600">
                      {allChecks.filter((c) => c.status === "warning").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Warnungen</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50">
                    <p className="text-2xl font-bold text-red-600">
                      {allChecks.filter((c) => c.status === "failed").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Fehlgeschlagen</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoryScores.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${cat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${cat.color}`} />
                      </div>
                      <CardTitle className="text-sm">{cat.label}</CardTitle>
                    </div>
                    <span className="text-2xl font-bold">{cat.score}%</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={cat.score} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{cat.passed} bestanden</span>
                    {cat.warnings > 0 && (
                      <span className="text-yellow-600">{cat.warnings} Warnungen</span>
                    )}
                    {cat.failed > 0 && (
                      <span className="text-red-600">{cat.failed} fehlgeschlagen</span>
                    )}
                    <span>{cat.total} gesamt</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Anstehende Prüfungen
              </CardTitle>
              <CardDescription>Nächste fällige Compliance-Prüfungen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingChecks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine anstehenden Prüfungen
                  </p>
                ) : (
                  upcomingChecks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{check.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {check.buildings?.name || "Allgemein"} &middot;{" "}
                          {CATEGORIES.find((c) => c.key === check.category)?.label || check.category}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(check.due_date!), "dd.MM.yyyy", { locale: de })}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                Handlungsbedarf
              </CardTitle>
              <CardDescription>Prüfungen mit Warnungen oder Fehlern</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {issueChecks.length === 0 ? (
                  <div className="text-center py-4">
                    <ShieldCheck className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Keine offenen Probleme</p>
                  </div>
                ) : (
                  issueChecks.map((check) => {
                    const status = STATUS_STYLES[check.status];
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={check.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon
                            className={`h-4 w-4 ${
                              check.status === "failed" ? "text-red-500" : "text-yellow-500"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium">{check.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {CATEGORIES.find((c) => c.key === check.category)?.label ||
                                check.category}
                            </p>
                          </div>
                        </div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    );
                  })
                )}
                {issueChecks.length > 0 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/compliance/checkliste">
                      Alle anzeigen
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
