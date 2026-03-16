import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReportBuilder, ReportWidget } from "@/hooks/useReportBuilder";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  BarChart3,
  Save,
  Download,
  Eye,
  Plus,
  GripVertical,
  LayoutDashboard,
  Table2,
  Type,
  TrendingUp,
  Trash2,
  Calendar,
  Home,
  Wrench,
  Calculator,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface WidgetPaletteItem {
  type: ReportWidget["type"];
  label: string;
  icon: LucideIcon;
  description: string;
}

const WIDGET_PALETTE: WidgetPaletteItem[] = [
  { type: "chart", label: "Diagramm", icon: BarChart3, description: "Balken-, Linien- oder Kreisdiagramm" },
  { type: "table", label: "Tabelle", icon: Table2, description: "Daten in Tabellenform" },
  { type: "kpi", label: "KPI-Karte", icon: TrendingUp, description: "Einzelner Kennwert mit Trend" },
  { type: "text", label: "Textblock", icon: Type, description: "Freitext, Überschrift oder Notiz" },
];

const REPORT_TYPE_OPTIONS = [
  { value: "financial", label: "Finanzbericht", icon: Calculator },
  { value: "occupancy", label: "Belegungsbericht", icon: Home },
  { value: "maintenance", label: "Instandhaltungsbericht", icon: Wrench },
  { value: "tax", label: "Steuerbericht", icon: FileText },
  { value: "custom", label: "Benutzerdefiniert", icon: LayoutDashboard },
];

const DATA_SOURCES = [
  { value: "revenue", label: "Einnahmen" },
  { value: "expenses", label: "Ausgaben" },
  { value: "occupancy_rate", label: "Belegungsquote" },
  { value: "rent_overview", label: "Mietübersicht" },
  { value: "maintenance_costs", label: "Instandhaltungskosten" },
  { value: "tenant_list", label: "Mieterliste" },
  { value: "payment_status", label: "Zahlungsstatus" },
  { value: "building_overview", label: "Gebäudeübersicht" },
];

export default function ReportBuilder() {
  const { toast } = useToast();
  const { createReport, saveReport } = useReportBuilder();

  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState<string>("custom");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const addWidget = (type: ReportWidget["type"]) => {
    const newWidget: ReportWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: `Neues ${WIDGET_PALETTE.find((w) => w.type === type)?.label || "Widget"}`,
      data_source: "revenue",
      config: {},
      position: { x: 0, y: widgets.length, w: 6, h: 4 },
    };
    setWidgets((prev) => [...prev, newWidget]);
  };

  const updateWidget = (id: string, updates: Partial<ReportWidget>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleSave = () => {
    if (!reportName.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Berichtsnamen ein", variant: "destructive" });
      return;
    }
    createReport.mutate({
      name: reportName,
      report_type: reportType as any,
      config: {
        widgets,
        date_range: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
      },
    });
  };

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    toast({ title: `Export als ${format.toUpperCase()}`, description: "Der Bericht wird generiert..." });
  };

  return (
    <MainLayout title="Report Builder">
      <div className="space-y-6">
        <PageHeader
          title="Report Builder"
          subtitle="Benutzerdefinierte Berichte erstellen und konfigurieren"
          breadcrumbs={[
            { label: "Berichte", href: "/reports" },
            { label: "Builder" },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Bearbeiten" : "Vorschau"}
              </Button>
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
              <Button onClick={handleSave} disabled={createReport.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left: Widget Palette & Settings */}
          <div className="space-y-4">
            {/* Report Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Berichtseinstellungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Berichtsname</Label>
                  <Input
                    placeholder="Mein Bericht"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Berichtstyp</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Zeitraum</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="Von"
                    />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      placeholder="Bis"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget Palette */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Widgets hinzufügen</CardTitle>
                <CardDescription className="text-xs">
                  Klicken Sie, um ein Widget zur Berichtsfläche hinzuzufügen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {WIDGET_PALETTE.map((wp) => {
                  const Icon = wp.icon;
                  return (
                    <Button
                      key={wp.type}
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => addWidget(wp.type)}
                    >
                      <Icon className="h-4 w-4 mr-3 shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{wp.label}</p>
                        <p className="text-xs text-muted-foreground">{wp.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Exportieren</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExport("pdf")}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExport("excel")}>
                  <Table2 className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExport("csv")}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview Area */}
          <div className="space-y-4">
            {widgets.length === 0 ? (
              <Card className="min-h-[500px]">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[500px]">
                  <LayoutDashboard className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Berichtsfläche leer</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-2">
                    Fügen Sie Widgets aus der linken Seitenleiste hinzu, um Ihren Bericht zu
                    gestalten.
                  </p>
                  <Button className="mt-6" variant="outline" onClick={() => addWidget("chart")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Erstes Widget hinzufügen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              widgets.map((widget) => {
                const paletteItem = WIDGET_PALETTE.find((w) => w.type === widget.type);
                const PaletteIcon = paletteItem?.icon || BarChart3;
                return (
                  <Card key={widget.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <Badge variant="outline" className="text-xs">
                            <PaletteIcon className="h-3 w-3 mr-1" />
                            {paletteItem?.label}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWidget(widget.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Titel</Label>
                          <Input
                            value={widget.title}
                            onChange={(e) =>
                              updateWidget(widget.id, { title: e.target.value })
                            }
                            placeholder="Widget-Titel"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Datenquelle</Label>
                          <Select
                            value={widget.data_source}
                            onValueChange={(val) =>
                              updateWidget(widget.id, { data_source: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DATA_SOURCES.map((ds) => (
                                <SelectItem key={ds.value} value={ds.value}>
                                  {ds.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Widget Preview Placeholder */}
                      {showPreview && (
                        <div className="rounded-lg border-2 border-dashed border-muted p-8 text-center">
                          <PaletteIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {widget.title} - Vorschau
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Daten: {DATA_SOURCES.find((d) => d.value === widget.data_source)?.label}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
