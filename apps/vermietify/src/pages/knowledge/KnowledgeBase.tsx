import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  BookOpen,
  Scale,
  Receipt,
  Home,
  FileSignature,
  Zap,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

const CATEGORIES = [
  {
    id: "mietrecht",
    title: "Mietrecht",
    description: "Rechtliche Grundlagen rund um Mietverhältnisse, Kündigungsschutz und Mieterhöhungen.",
    icon: Scale,
    articleCount: 24,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    iconColor: "text-blue-600",
  },
  {
    id: "steuerrecht",
    title: "Steuerrecht",
    description: "Steuerliche Aspekte der Vermietung, AfA, Werbungskosten und Steuererklärungen.",
    icon: Receipt,
    articleCount: 18,
    color: "bg-green-50 text-green-700 border-green-200",
    iconColor: "text-green-600",
  },
  {
    id: "betriebskosten",
    title: "Betriebskosten",
    description: "Nebenkostenabrechnung, umlagefähige Kosten und Abrechnungsfristen.",
    icon: Home,
    articleCount: 15,
    color: "bg-orange-50 text-orange-700 border-orange-200",
    iconColor: "text-orange-600",
  },
  {
    id: "vertragsrecht",
    title: "Vertragsrecht",
    description: "Mietverträge, Klauseln, Sondervereinbarungen und Vertragsänderungen.",
    icon: FileSignature,
    articleCount: 21,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    iconColor: "text-purple-600",
  },
  {
    id: "energieausweis",
    title: "Energieausweis",
    description: "Energetische Anforderungen, Ausweispflicht und Sanierungsmaßnahmen.",
    icon: Zap,
    articleCount: 9,
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    iconColor: "text-yellow-600",
  },
];

const FAQ_ITEMS = [
  {
    question: "Wie hoch darf eine Mieterhöhung ausfallen?",
    answer:
      "Eine Mieterhöhung bis zur ortsüblichen Vergleichsmiete ist möglich, jedoch darf die Miete innerhalb von drei Jahren nicht um mehr als 20% (in angespannten Wohnungsmärkten 15%) steigen (Kappungsgrenze). Modernisierungsmieterhöhungen können bis zu 8% der Modernisierungskosten jährlich auf die Miete umgelegt werden.",
  },
  {
    question: "Welche Kündigungsfristen gelten für Vermieter?",
    answer:
      "Die Kündigungsfrist für Vermieter hängt von der Mietdauer ab: Bis 5 Jahre Mietdauer beträgt sie 3 Monate, bis 8 Jahre 6 Monate und ab 8 Jahren 9 Monate. Eine ordentliche Kündigung durch den Vermieter ist nur bei berechtigtem Interesse möglich (z.B. Eigenbedarf, erhebliche Pflichtverletzung).",
  },
  {
    question: "Welche Betriebskosten sind umlagefähig?",
    answer:
      "Umlagefähige Betriebskosten sind in der Betriebskostenverordnung (BetrKV) definiert. Dazu gehören u.a.: Grundsteuer, Wasserversorgung, Entwässerung, Heizkosten, Warmwasser, Aufzug, Straßenreinigung, Müllabfuhr, Gebäudereinigung, Gartenpflege, Beleuchtung, Schornsteinreinigung, Sach- und Haftpflichtversicherung, Hauswart und Gemeinschaftsantenne.",
  },
  {
    question: "Wann muss die Nebenkostenabrechnung vorliegen?",
    answer:
      "Die Nebenkostenabrechnung muss dem Mieter spätestens 12 Monate nach Ende des Abrechnungszeitraums zugehen. Wird diese Frist versäumt, kann der Vermieter keine Nachforderungen mehr geltend machen. Ein Guthaben des Mieters muss jedoch auch bei verspäteter Abrechnung ausgezahlt werden.",
  },
  {
    question: "Was muss ich beim Energieausweis beachten?",
    answer:
      "Bei Neuvermietung oder Verkauf ist ein gültiger Energieausweis Pflicht. Es gibt den Verbrauchsausweis (basierend auf tatsächlichem Verbrauch) und den Bedarfsausweis (basierend auf baulichen Eigenschaften). Für Gebäude mit weniger als 5 Wohneinheiten und Bauantrag vor 1977 ist der Bedarfsausweis vorgeschrieben. Der Ausweis ist 10 Jahre gültig.",
  },
  {
    question: "Welche steuerlichen Abschreibungen gibt es bei Vermietung?",
    answer:
      "Die lineare AfA für Wohngebäude beträgt 2% pro Jahr (bei Baujahr ab 1925) bzw. 2,5% (vor 1925). Für Neubauten ab 2023 gilt eine degressive AfA von 6% (ab 2025: 5%). Zusätzlich können Erhaltungsaufwendungen sofort abgesetzt oder auf 2-5 Jahre verteilt werden. Modernisierungskosten können unter bestimmten Voraussetzungen als Sonderabschreibung geltend gemacht werden.",
  },
];

const EXTERNAL_RESOURCES = [
  {
    title: "Deutscher Mieterbund",
    url: "https://www.mieterbund.de",
    description: "Informationen und Beratung rund um das Mietrecht.",
  },
  {
    title: "Haus & Grund Deutschland",
    url: "https://www.hausundgrund.de",
    description: "Verband der privaten Immobilieneigentümer.",
  },
  {
    title: "Bundesministerium der Justiz",
    url: "https://www.bmj.de",
    description: "Gesetzestexte und offizielle Informationen zum Mietrecht.",
  },
  {
    title: "Mietspiegel-Portal",
    url: "https://www.mietspiegel-online.de",
    description: "Aktuelle Mietspiegel für Städte und Gemeinden.",
  },
];

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = CATEGORIES.filter((cat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.title.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q)
    );
  });

  const filteredFaq = FAQ_ITEMS.filter((faq) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q)
    );
  });

  return (
    <MainLayout title="Wissensdatenbank" breadcrumbs={[{ label: "Wissensdatenbank" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Wissensdatenbank"
          subtitle="Informationen und Ratgeber rund um die Immobilienverwaltung."
        />

        {/* Search Bar */}
        <Card>
          <CardContent className="py-6">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Wissensdatenbank durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Cards */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Kategorien
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-md border ${category.color}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <Icon className={`h-6 w-6 ${category.iconColor}`} />
                      </div>
                      <Badge variant="outline">
                        {category.articleCount} Artikel
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <Button variant="ghost" size="sm" className="mt-3 -ml-2">
                      Artikel anzeigen
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {filteredCategories.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  Keine Kategorien zu "{searchQuery}" gefunden.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Häufig gestellte Fragen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFaq.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  Keine FAQ zu "{searchQuery}" gefunden.
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaq.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* External Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Externe Ressourcen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {EXTERNAL_RESOURCES.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-primary">{resource.title}</p>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Tipp: KI-Assistent nutzen</h3>
                <p className="text-sm text-muted-foreground">
                  Nutzen Sie unseren KI-Assistenten für spezifische Fragen rund um Mietrecht,
                  Steuern und Immobilienverwaltung. Er kann Ihnen schnelle Antworten auf
                  komplexe Fragestellungen liefern.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
