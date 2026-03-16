import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  Home,
  UserX,
  AlertTriangle,
  TrendingUp,
  Shield,
  ClipboardList,
  CreditCard,
  Handshake,
  Scale,
  Building2,
  KeyRound,
  FileCheck,
  ScrollText,
  Users,
  Ban,
  Receipt,
  Gauge,
} from "lucide-react";

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  path: string;
  isNew?: boolean;
}

const TEMPLATES: FormTemplate[] = [
  // Mietverträge
  { id: "mietvertrag", title: "Mietvertrag", description: "Standardmietvertrag für Wohnraum erstellen", category: "Verträge", icon: Home, path: "/formulare/mietvertrag" },
  { id: "gewerbemietvertrag", title: "Gewerbemietvertrag", description: "Mietvertrag für gewerbliche Nutzung", category: "Verträge", icon: Building2, path: "/formulare/gewerbemietvertrag" },
  { id: "staffelmietvertrag", title: "Staffelmietvertrag", description: "Mietvertrag mit gestaffelter Miete", category: "Verträge", icon: TrendingUp, path: "/formulare/staffelmietvertrag" },
  { id: "untermieterlaubnis", title: "Untermieterlaubnis", description: "Genehmigung zur Untervermietung", category: "Verträge", icon: Users, path: "/formulare/untermieterlaubnis" },
  { id: "nachtragsvereinbarung", title: "Nachtragsvereinbarung", description: "Ergänzung zum bestehenden Mietvertrag", category: "Verträge", icon: FileCheck, path: "/formulare/nachtragsvereinbarung" },
  { id: "mietaufhebung", title: "Mietaufhebungsvertrag", description: "Einvernehmliche Vertragsauflösung", category: "Verträge", icon: Handshake, path: "/formulare/mietaufhebung" },

  // Kündigungen & Mahnungen
  { id: "kuendigung", title: "Kündigung", description: "Ordentliche Kündigung des Mietvertrags", category: "Kündigung & Mahnung", icon: UserX, path: "/formulare/kuendigung" },
  { id: "eigenbedarf", title: "Eigenbedarfskündigung", description: "Kündigung wegen Eigenbedarf", category: "Kündigung & Mahnung", icon: Home, path: "/formulare/eigenbedarf" },
  { id: "abmahnung", title: "Abmahnung", description: "Abmahnung bei Vertragsverletzung", category: "Kündigung & Mahnung", icon: AlertTriangle, path: "/formulare/abmahnung" },
  { id: "mahnung", title: "Mahnung", description: "Zahlungserinnerung / Mahnung erstellen", category: "Kündigung & Mahnung", icon: Receipt, path: "/formulare/mahnung" },

  // Miete & Kosten
  { id: "mieterhoehung", title: "Mieterhöhung", description: "Mieterhöhungsverlangen erstellen", category: "Miete & Kosten", icon: TrendingUp, path: "/formulare/mieterhoehung" },
  { id: "mietminderung", title: "Mietminderung Reaktion", description: "Antwort auf Mietminderungsanzeige", category: "Miete & Kosten", icon: Ban, path: "/formulare/mietminderung" },
  { id: "indexmieten", title: "Indexmieten-Anpassung", description: "Indexmietanpassung berechnen & erstellen", category: "Miete & Kosten", icon: Gauge, path: "/formulare/indexmieten" },
  { id: "nebenkostenwiderspruch", title: "NK-Widerspruch Reaktion", description: "Antwort auf Nebenkostenwiderspruch", category: "Miete & Kosten", icon: Scale, path: "/formulare/nebenkostenwiderspruch" },

  // Dokumente & Bescheinigungen
  { id: "uebergabeprotokoll", title: "Übergabeprotokoll", description: "Wohnungsübergabeprotokoll erstellen", category: "Bescheinigungen", icon: ClipboardList, path: "/formulare/uebergabeprotokoll" },
  { id: "hausordnung", title: "Hausordnung", description: "Individuelle Hausordnung generieren", category: "Bescheinigungen", icon: ScrollText, path: "/formulare/hausordnung" },
  { id: "mieterselbstauskunft", title: "Mieterselbstauskunft", description: "Selbstauskunftsbogen für Mietinteressenten", category: "Bescheinigungen", icon: FileText, path: "/formulare/mieterselbstauskunft" },
  { id: "wohnungsgeberbestaetigung", title: "Wohnungsgeberbestätigung", description: "Bestätigung nach § 19 BMG", category: "Bescheinigungen", icon: FileCheck, path: "/formulare/wohnungsgeberbestaetigung" },
  { id: "mietschuldenfreiheit", title: "Mietschuldenfreiheit", description: "Bescheinigung über Mietschuldenfreiheit", category: "Bescheinigungen", icon: Shield, path: "/formulare/mietschuldenfreiheit" },

  // Zahlungsverkehr
  { id: "sepa", title: "SEPA-Lastschriftmandat", description: "SEPA-Einzugsermächtigung erstellen", category: "Zahlungsverkehr", icon: CreditCard, path: "/formulare/sepa" },
  { id: "kautionsrueckforderung", title: "Kautionsabrechnung", description: "Kautionsabrechnung mit Auflistung", category: "Zahlungsverkehr", icon: KeyRound, path: "/formulare/kautionsabrechnung" },
  { id: "zahlungsplan", title: "Zahlungsplanvereinbarung", description: "Ratenzahlungsvereinbarung erstellen", category: "Zahlungsverkehr", icon: Receipt, path: "/formulare/zahlungsplan" },

  // Prüftools
  { id: "mietpreisbremse", title: "Mietpreisbremse-Checker", description: "Prüfen ob Mietpreisbremse greift", category: "Prüftools", icon: Scale, path: "/formulare/mietpreisbremse", isNew: true },
];

const CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];

export default function FormularHub() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = TEMPLATES.filter((t) => {
    const matchSearch = search === "" ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !activeCategory || t.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const grouped = CATEGORIES.reduce<Record<string, FormTemplate[]>>((acc, cat) => {
    const items = filtered.filter((t) => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <MainLayout title="Formulare" breadcrumbs={[{ label: "Formulare" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Formulare & Vorlagen"
          subtitle={`${TEMPLATES.length} Rechtsformulare und Dokument-Generatoren für die Immobilienverwaltung.`}
        />

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Formular suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory(null)}
            >
              Alle
            </Badge>
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        {Object.entries(grouped).map(([category, templates]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold">{category}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <Link key={template.id} to={template.path}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            {template.isNew && (
                              <Badge variant="secondary" className="text-xs">Neu</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {template.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Keine Formulare gefunden.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
