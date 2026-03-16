import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  TrendingDown,
  Clock,
  Globe,
  Building2,
  Euro,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Calculator,
  Shield,
  BarChart3,
} from "lucide-react";

interface OptimizationSuggestion {
  id: string;
  category: "afa" | "deductions" | "timing" | "cross_border";
  title: string;
  description: string;
  potentialSavings: number;
  priority: "high" | "medium" | "low";
  implemented: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Lightbulb; color: string }> = {
  afa: { label: "AfA-Optimierung", icon: Building2, color: "bg-violet-100 text-violet-800" },
  deductions: { label: "Absetzungsmoglichkeiten", icon: TrendingDown, color: "bg-green-100 text-green-800" },
  timing: { label: "Timing-Strategien", icon: Clock, color: "bg-blue-100 text-blue-800" },
  cross_border: { label: "Grenzuberschreitend", icon: Globe, color: "bg-orange-100 text-orange-800" },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-800",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
};

const MOCK_SUGGESTIONS: OptimizationSuggestion[] = [
  {
    id: "1",
    category: "afa",
    title: "Sonderabschreibung nach § 7b EStG prufen",
    description: "Fur Neubauten mit Bauantrag nach dem 31.12.2022 konnen Sie 5% Sonder-AfA im ersten Jahr geltend machen. Dies kann bei einem Kaufpreis von 300.000 € zu einer zusatzlichen Absetzung von 15.000 € fuhren.",
    potentialSavings: 450000,
    priority: "high",
    implemented: false,
  },
  {
    id: "2",
    category: "afa",
    title: "Anschaffungsnahe Herstellungskosten abgrenzen",
    description: "Renovierungskosten innerhalb von 3 Jahren nach Kauf, die 15% des Gebaeudewertes ubersteigen, mussen aktiviert werden. Prufen Sie, ob eine Verteilung auf mehrere Jahre gunstiger ist.",
    potentialSavings: 280000,
    priority: "medium",
    implemented: false,
  },
  {
    id: "3",
    category: "deductions",
    title: "Arbeitszimmer als Werbungskosten",
    description: "Nutzen Sie ein haeusliches Arbeitszimmer fur die Verwaltung Ihrer Immobilien? Seit 2023 konnen Sie die Homeoffice-Pauschale (1.260 €/Jahr) oder anteilige Kosten absetzen.",
    potentialSavings: 126000,
    priority: "medium",
    implemented: false,
  },
  {
    id: "4",
    category: "deductions",
    title: "Fahrtkosten zu Mietobjekten",
    description: "Dokumentieren Sie alle Fahrten zu Ihren Mietobjekten. Pro Kilometer konnen 0,30 € angesetzt werden. Bei regelmaessigen Besuchen summiert sich dies schnell.",
    potentialSavings: 85000,
    priority: "low",
    implemented: true,
  },
  {
    id: "5",
    category: "timing",
    title: "Reparaturen ins aktuelle Jahr vorziehen",
    description: "Falls Sie ein hoheres Einkommen als im Vorjahr haben, lohnt es sich, geplante Reparaturen und Instandhaltungen vorzuziehen, um die Steuerlast im aktuellen Jahr zu senken.",
    potentialSavings: 350000,
    priority: "high",
    implemented: false,
  },
  {
    id: "6",
    category: "timing",
    title: "Vorauszahlungen optimieren",
    description: "Passen Sie Ihre Steuervorauszahlungen an die aktuelle Einkommenssituation an. Zu hohe Vorauszahlungen binden unnotig Liquiditat.",
    potentialSavings: 200000,
    priority: "medium",
    implemented: false,
  },
  {
    id: "7",
    category: "cross_border",
    title: "DBA-Pruefung fur osterreichische Immobilien",
    description: "Bei Immobilien in Osterreich greift das Doppelbesteuerungsabkommen. Prufen Sie, ob die Freistellungsmethode oder Anrechnungsmethode gunstiger ist.",
    potentialSavings: 420000,
    priority: "high",
    implemented: false,
  },
  {
    id: "8",
    category: "cross_border",
    title: "Schweizer Quellensteuer anrechnen",
    description: "In der Schweiz gezahlte Quellensteuer kann auf die deutsche Steuerschuld angerechnet werden. Stellen Sie sicher, dass alle Nachweise vorliegen.",
    potentialSavings: 180000,
    priority: "low",
    implemented: false,
  },
];

export default function TaxOptimization() {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>(MOCK_SUGGESTIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filtered = selectedCategory === "all"
    ? suggestions
    : suggestions.filter((s) => s.category === selectedCategory);

  const totalPotentialSavings = suggestions
    .filter((s) => !s.implemented)
    .reduce((sum, s) => sum + s.potentialSavings, 0);

  const implementedSavings = suggestions
    .filter((s) => s.implemented)
    .reduce((sum, s) => sum + s.potentialSavings, 0);

  const toggleImplemented = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, implemented: !s.implemented } : s))
    );
  };

  return (
    <MainLayout title="Steueroptimierung">
      <div className="space-y-6">
        <PageHeader
          title="KI-Steueroptimierung"
          subtitle="Intelligente Vorschlage zur Reduzierung Ihrer Steuerlast"
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Optimierung" },
          ]}
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Euro className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {(totalPotentialSavings / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </p>
                  <p className="text-sm text-muted-foreground">Mogliches Sparpotenzial</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {(implementedSavings / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                  </p>
                  <p className="text-sm text-muted-foreground">Bereits umgesetzt</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {suggestions.filter((s) => !s.implemented).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Offene Vorschlage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            Alle
          </Button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const CategoryIcon = config.icon;
            return (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
              >
                <CategoryIcon className="h-4 w-4 mr-1" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {/* Suggestions */}
        <div className="space-y-4">
          {filtered.map((suggestion) => {
            const config = CATEGORY_CONFIG[suggestion.category];
            const CategoryIcon = config?.icon || Lightbulb;

            return (
              <Card
                key={suggestion.id}
                className={suggestion.implemented ? "opacity-60" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 mt-0.5 ${config?.color || "bg-muted"}`}>
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {suggestion.implemented && (
                            <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-600" />
                          )}
                          {suggestion.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={config?.color}>
                            {config?.label}
                          </Badge>
                          <Badge variant="outline" className={PRIORITY_COLORS[suggestion.priority]}>
                            Prioritat: {PRIORITY_LABELS[suggestion.priority]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +{(suggestion.potentialSavings / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                      </p>
                      <p className="text-xs text-muted-foreground">Sparpotenzial</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={suggestion.implemented ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleImplemented(suggestion.id)}
                    >
                      {suggestion.implemented ? "Als offen markieren" : "Als umgesetzt markieren"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
