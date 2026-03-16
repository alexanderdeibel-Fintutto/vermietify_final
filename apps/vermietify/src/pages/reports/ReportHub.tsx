import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReportBuilder } from "@/hooks/useReportBuilder";
import { LoadingState } from "@/components/shared";
import {
  FileText,
  BarChart3,
  Home,
  Wrench,
  Calculator,
  LayoutDashboard,
  Plus,
  Clock,
  Download,
  Eye,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ReportTypeConfig {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const REPORT_TYPES: ReportTypeConfig[] = [
  {
    type: "financial",
    label: "Finanzbericht",
    description: "Einnahmen, Ausgaben, Rendite und Cashflow-Analysen",
    icon: Calculator,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    type: "occupancy",
    label: "Belegungsbericht",
    description: "Leerstandsquote, Fluktuationsrate und Mieterliste",
    icon: Home,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    type: "maintenance",
    label: "Instandhaltungsbericht",
    description: "Wartungsarbeiten, Kosten und geplante Maßnahmen",
    icon: Wrench,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    type: "tax",
    label: "Steuerbericht",
    description: "Anlage V, Abschreibungen, steuerlich relevante Daten",
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    type: "custom",
    label: "Benutzerdefiniert",
    description: "Eigene Berichte mit dem Report Builder erstellen",
    icon: LayoutDashboard,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

export default function ReportHub() {
  const { reports, savedReports } = useReportBuilder();
  const allReports = reports.data || [];
  const allSavedReports = savedReports.data || [];

  // Count saved reports per type
  const countByType = (type: string) =>
    allReports.filter((r) => r.report_type === type).length;

  // Recent saved reports
  const recentSaved = allSavedReports.slice(0, 6);

  if (reports.isLoading) {
    return (
      <MainLayout title="Berichte">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Berichte">
      <div className="space-y-6">
        <PageHeader
          title="Report Hub"
          subtitle="Berichte erstellen, verwalten und exportieren"
          breadcrumbs={[{ label: "Berichte" }]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/reports/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button asChild>
                <Link to="/reports/builder">
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Bericht
                </Link>
              </Button>
            </div>
          }
        />

        {/* Report Type Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map((rt) => {
            const Icon = rt.icon;
            const count = countByType(rt.type);
            return (
              <Card key={rt.type} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-3 ${rt.bgColor}`}>
                      <Icon className={`h-6 w-6 ${rt.color}`} />
                    </div>
                    {count > 0 && (
                      <Badge variant="secondary">{count} gespeichert</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3">{rt.label}</CardTitle>
                  <CardDescription>{rt.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" asChild>
                    <Link to={`/reports/builder?type=${rt.type}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Bericht erstellen
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Saved Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Zuletzt gespeicherte Berichte
                </CardTitle>
                <CardDescription>
                  Ihre neuesten generierten Berichte
                </CardDescription>
              </div>
              {allSavedReports.length > 6 && (
                <Button variant="ghost" size="sm">
                  Alle anzeigen
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentSaved.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Keine gespeicherten Berichte</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Erstellen Sie Ihren ersten Bericht mit dem Report Builder
                </p>
                <Button className="mt-4" variant="outline" asChild>
                  <Link to="/reports/builder">
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Bericht erstellen
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSaved.map((saved) => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{saved.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(saved.created_at), "dd.MM.yyyy HH:mm", {
                            locale: de,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allReports.length}</p>
                  <p className="text-sm text-muted-foreground">Berichtsvorlagen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allSavedReports.length}</p>
                  <p className="text-sm text-muted-foreground">Gespeicherte Berichte</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {allReports.filter((r) => r.is_template).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Vorlagen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
