import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCompliance } from "@/hooks/useCompliance";
import { LoadingState } from "@/components/shared";
import {
  ShieldCheck,
  ClipboardCheck,
  FileText,
  Lock,
  Building2,
  Calculator,
  Leaf,
  Flame,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Lightbulb,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface AuditArea {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const AUDIT_AREAS: AuditArea[] = [
  {
    key: "dsgvo",
    label: "Datenschutz (DSGVO)",
    icon: Lock,
    description: "Verarbeitungsverzeichnis, Einwilligungen, Löschkonzept, Datenschutzbeauftragter",
  },
  {
    key: "building",
    label: "Gebäudesicherheit",
    icon: Building2,
    description: "Verkehrssicherung, Winterdienst, Spielplatzprüfung, Aufzugswartung",
  },
  {
    key: "fire_safety",
    label: "Brandschutz",
    icon: Flame,
    description: "Feuerlöscher, Rauchmelder, Fluchtpläne, Brandschutzordnung",
  },
  {
    key: "energy",
    label: "Energieeffizienz",
    icon: Leaf,
    description: "Energieausweis, Heizkostenverordnung, CO2-Abgabe, Sanierungspflichten",
  },
  {
    key: "contract",
    label: "Vertragsmanagement",
    icon: FileText,
    description: "Mietverträge, Indexklauseln, Kündigungsfristen, Schönheitsreparaturen",
  },
  {
    key: "tax",
    label: "Steuer-Compliance",
    icon: Calculator,
    description: "Umsatzsteuer, Grundsteuer, Anlage V, Abschreibungen, Betriebskostenabrechnung",
  },
];

type TrafficLight = "green" | "yellow" | "red";

function getTrafficLight(score: number): TrafficLight {
  if (score >= 80) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

const TRAFFIC_STYLES: Record<TrafficLight, { bg: string; text: string; border: string; label: string }> = {
  green: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", label: "Bereit" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", label: "Teilweise bereit" },
  red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", label: "Nicht bereit" },
};

const TRAFFIC_ICONS: Record<TrafficLight, LucideIcon> = {
  green: CheckCircle,
  yellow: AlertTriangle,
  red: XCircle,
};

// Recommendations per area
const RECOMMENDATIONS: Record<string, string[]> = {
  dsgvo: [
    "Verarbeitungsverzeichnis aktualisieren und alle Datenverarbeitungsvorgänge dokumentieren",
    "Einwilligungserklärungen der Mieter prüfen und ggf. erneuern",
    "Löschkonzept implementieren und automatische Löschfristen einrichten",
    "Auftragsverarbeitungsverträge mit Dienstleistern abschließen",
  ],
  building: [
    "Jährliche Verkehrssicherungsprüfung durchführen und dokumentieren",
    "Winterdienstplan erstellen und Zuständigkeiten festlegen",
    "Spielplatzgeräte gemäß DIN EN 1176 prüfen lassen",
    "Aufzugswartungsvertrag überprüfen und Prüftermine einhalten",
  ],
  fire_safety: [
    "Alle Feuerlöscher auf Funktionsfähigkeit prüfen (alle 2 Jahre)",
    "Rauchmelder in allen Wohnungen gemäß Landesbauordnung installieren",
    "Flucht- und Rettungspläne aktualisieren und aushängen",
    "Brandschutzordnung nach DIN 14096 erstellen/aktualisieren",
  ],
  energy: [
    "Energieausweise für alle Gebäude erstellen oder erneuern",
    "Heizkostenabrechnung nach HeizKV prüfen",
    "CO2-Kostenaufteilung gemäß CO2KostAufG berechnen",
    "Sanierungspflichten nach GEG prüfen und Maßnahmen planen",
  ],
  contract: [
    "Alle aktiven Mietverträge auf aktuelle Rechtsprechung prüfen",
    "Indexklauseln und Staffelmietvereinbarungen verifizieren",
    "Kündigungsfristen und Sonderkündigungsrechte dokumentieren",
    "Schönheitsreparaturklauseln auf Wirksamkeit prüfen",
  ],
  tax: [
    "Anlage V für alle Mietobjekte vorbereiten und prüfen",
    "Grundsteuererklärungen fristgerecht einreichen",
    "Abschreibungstabellen (AfA) aktualisieren",
    "Betriebskostenabrechnungen fristgerecht erstellen und versenden",
  ],
};

export default function AuditReadiness() {
  const { checks, complianceScore } = useCompliance();
  const allChecks = checks.data || [];

  // Calculate scores per area
  const areaScores = AUDIT_AREAS.map((area) => {
    const areaChecks = allChecks.filter((c) => c.category === area.key);
    const score = complianceScore(areaChecks);
    const traffic = getTrafficLight(score);
    return {
      ...area,
      score,
      traffic,
      total: areaChecks.length,
      passed: areaChecks.filter((c) => c.status === "passed").length,
      recommendations: RECOMMENDATIONS[area.key] || [],
    };
  });

  const overallScore = complianceScore(allChecks);
  const overallTraffic = getTrafficLight(overallScore);
  const greenCount = areaScores.filter((a) => a.traffic === "green").length;
  const yellowCount = areaScores.filter((a) => a.traffic === "yellow").length;
  const redCount = areaScores.filter((a) => a.traffic === "red").length;

  if (checks.isLoading) {
    return (
      <MainLayout title="Audit-Readiness">
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Audit-Readiness">
      <div className="space-y-6">
        <PageHeader
          title="Audit-Readiness"
          subtitle="Bewertung Ihrer Audit-Bereitschaft mit Verbesserungsvorschlägen"
          breadcrumbs={[
            { label: "Compliance", href: "/compliance" },
            { label: "Audit-Readiness" },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Bericht exportieren
              </Button>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Neu bewerten
              </Button>
            </div>
          }
        />

        {/* Overall Assessment */}
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Traffic Light Indicator */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="flex flex-col gap-2">
                  <div
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                      overallTraffic === "red"
                        ? "bg-red-500 border-red-600"
                        : "bg-red-200 border-red-300"
                    }`}
                  >
                    {overallTraffic === "red" && <XCircle className="h-8 w-8 text-white" />}
                  </div>
                  <div
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                      overallTraffic === "yellow"
                        ? "bg-yellow-500 border-yellow-600"
                        : "bg-yellow-200 border-yellow-300"
                    }`}
                  >
                    {overallTraffic === "yellow" && (
                      <AlertTriangle className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div
                    className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                      overallTraffic === "green"
                        ? "bg-green-500 border-green-600"
                        : "bg-green-200 border-green-300"
                    }`}
                  >
                    {overallTraffic === "green" && (
                      <CheckCircle className="h-8 w-8 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Assessment Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Gesamt-Audit-Bereitschaft: {overallScore}%
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {overallTraffic === "green"
                      ? "Ihre Organisation ist gut auf ein Audit vorbereitet. Halten Sie den aktuellen Stand bei."
                      : overallTraffic === "yellow"
                      ? "Einige Bereiche benötigen noch Aufmerksamkeit, bevor ein Audit durchgeführt werden kann."
                      : "Mehrere kritische Bereiche erfordern sofortige Maßnahmen zur Audit-Vorbereitung."}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-2xl font-bold text-green-700">{greenCount}</p>
                    <p className="text-xs text-green-600">Bereit</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-2xl font-bold text-yellow-700">{yellowCount}</p>
                    <p className="text-xs text-yellow-600">Teilweise bereit</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-2xl font-bold text-red-700">{redCount}</p>
                    <p className="text-xs text-red-600">Nicht bereit</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Area Assessments */}
        <div className="space-y-4">
          {areaScores.map((area) => {
            const Icon = area.icon;
            const traffic = TRAFFIC_STYLES[area.traffic];
            const TrafficIcon = TRAFFIC_ICONS[area.traffic];

            return (
              <Card key={area.key}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{area.label}</CardTitle>
                        <CardDescription>{area.description}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={`${traffic.bg} ${traffic.text} border ${traffic.border} flex items-center gap-1`}
                    >
                      <TrafficIcon className="h-3 w-3" />
                      {traffic.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Bar */}
                  <div className="flex items-center gap-4">
                    <Progress value={area.score} className="h-3 flex-1" />
                    <span className="text-lg font-bold w-14 text-right">{area.score}%</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{area.passed} von {area.total} Prüfungen bestanden</span>
                  </div>

                  {/* Recommendations */}
                  {area.traffic !== "green" && area.recommendations.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <h4 className="text-sm font-semibold">Verbesserungsvorschläge</h4>
                      </div>
                      <ul className="space-y-2">
                        {area.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {area.traffic === "green" && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Dieser Bereich ist vollständig audit-bereit
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Nächste Schritte
            </CardTitle>
            <CardDescription>
              Priorisierte Maßnahmen zur Verbesserung Ihrer Audit-Bereitschaft
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {areaScores
                .filter((a) => a.traffic !== "green")
                .sort((a, b) => a.score - b.score)
                .map((area) => {
                  const Icon = area.icon;
                  const traffic = TRAFFIC_STYLES[area.traffic];
                  return (
                    <div
                      key={area.key}
                      className={`flex items-center justify-between p-4 rounded-lg border ${traffic.border} ${traffic.bg}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${traffic.text}`} />
                        <div>
                          <p className={`text-sm font-medium ${traffic.text}`}>{area.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {area.total - area.passed} offene Prüfungen
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/compliance/checkliste">
                          Prüfen
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              {areaScores.every((a) => a.traffic === "green") && (
                <div className="text-center py-6">
                  <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="font-medium text-green-700">Alle Bereiche sind audit-bereit!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Führen Sie regelmäßige Überprüfungen durch, um den Status beizubehalten.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
