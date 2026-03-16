import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCompliance, ComplianceCheck } from "@/hooks/useCompliance";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/shared";
import {
  Shield,
  Lock,
  Building2,
  Flame,
  Leaf,
  FileText,
  Calculator,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { LucideIcon } from "lucide-react";

interface CategoryConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: "dsgvo", label: "DSGVO / Datenschutz", icon: Lock, color: "text-blue-600" },
  { key: "building", label: "Gebäudesicherheit", icon: Building2, color: "text-green-600" },
  { key: "fire_safety", label: "Brandschutz", icon: Flame, color: "text-red-600" },
  { key: "energy", label: "Energie & Umwelt", icon: Leaf, color: "text-emerald-600" },
  { key: "contract", label: "Verträge & Recht", icon: FileText, color: "text-purple-600" },
  { key: "tax", label: "Steuern & Finanzen", icon: Calculator, color: "text-orange-600" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  passed: { label: "Bestanden", color: "bg-green-100 text-green-800", icon: CheckCircle },
  warning: { label: "Warnung", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  failed: { label: "Fehlgeschlagen", color: "bg-red-100 text-red-800", icon: XCircle },
  pending: { label: "Ausstehend", color: "bg-gray-100 text-gray-800", icon: Clock },
  not_applicable: { label: "Nicht zutreffend", color: "bg-gray-50 text-gray-500", icon: Clock },
};

export default function ComplianceChecklist() {
  const { toast } = useToast();
  const { checks, updateCheck, complianceScore } = useCompliance();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    CATEGORIES.map((c) => c.key)
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const allChecks = checks.data || [];

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleMarkCompleted = (check: ComplianceCheck) => {
    updateCheck.mutate({
      id: check.id,
      status: check.status === "passed" ? "pending" : "passed",
      completed_at: check.status === "passed" ? null : new Date().toISOString(),
    });
  };

  // Filter checks
  const filteredChecks =
    statusFilter === "all"
      ? allChecks
      : allChecks.filter((c) => c.status === statusFilter);

  // Group by category
  const checksByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    checks: filteredChecks.filter((c) => c.category === cat.key),
    allCategoryChecks: allChecks.filter((c) => c.category === cat.key),
  }));

  const overallScore = complianceScore(allChecks);

  if (checks.isLoading) {
    return (
      <MainLayout title="Compliance-Checkliste">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Compliance-Checkliste">
      <div className="space-y-6">
        <PageHeader
          title="DACH Compliance-Checkliste"
          subtitle="Alle Compliance-Anforderungen für Deutschland, Österreich und die Schweiz"
          breadcrumbs={[
            { label: "Compliance", href: "/compliance" },
            { label: "Checkliste" },
          ]}
        />

        {/* Overall Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Gesamtfortschritt</h3>
                <p className="text-sm text-muted-foreground">
                  {allChecks.filter((c) => c.status === "passed").length} von{" "}
                  {allChecks.filter((c) => c.status !== "not_applicable").length} Prüfungen bestanden
                </p>
              </div>
              <span className="text-3xl font-bold">{overallScore}%</span>
            </div>
            <Progress value={overallScore} className="h-3" />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedCategories(CATEGORIES.map((c) => c.key))}
            >
              Alle aufklappen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedCategories([])}
            >
              Alle zuklappen
            </Button>
          </div>
        </div>

        {/* Checklist by Category */}
        <div className="space-y-4">
          {checksByCategory.map((cat) => {
            const Icon = cat.icon;
            const isExpanded = expandedCategories.includes(cat.key);
            const catScore = complianceScore(cat.allCategoryChecks);

            return (
              <Card key={cat.key}>
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(cat.key)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Icon className={`h-5 w-5 ${cat.color}`} />
                          <CardTitle className="text-base">{cat.label}</CardTitle>
                          <Badge variant="secondary">
                            {cat.allCategoryChecks.filter((c) => c.status === "passed").length}/
                            {cat.allCategoryChecks.length}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <Progress value={catScore} className="h-2" />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">
                            {catScore}%
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {cat.checks.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            {statusFilter === "all"
                              ? "Keine Prüfungen in dieser Kategorie"
                              : "Keine Prüfungen mit diesem Status"}
                          </p>
                        ) : (
                          cat.checks.map((check) => {
                            const status = STATUS_CONFIG[check.status];
                            const StatusIcon = status.icon;
                            return (
                              <div
                                key={check.id}
                                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                              >
                                <Checkbox
                                  checked={check.status === "passed"}
                                  onCheckedChange={() => handleMarkCompleted(check)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p
                                        className={`text-sm font-medium ${
                                          check.status === "passed"
                                            ? "line-through text-muted-foreground"
                                            : ""
                                        }`}
                                      >
                                        {check.description}
                                      </p>
                                      {check.buildings?.name && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          <Building2 className="h-3 w-3 inline mr-1" />
                                          {check.buildings.name}
                                        </p>
                                      )}
                                      {check.notes && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {check.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {check.due_date && (
                                        <Badge variant="outline" className="text-xs">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          {format(new Date(check.due_date), "dd.MM.yyyy", {
                                            locale: de,
                                          })}
                                        </Badge>
                                      )}
                                      <Badge className={status.color}>
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {status.label}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>

        {allChecks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Keine Compliance-Prüfungen</p>
              <p className="text-muted-foreground">
                Erstellen Sie Ihre erste Compliance-Prüfung, um den Status zu verfolgen.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
