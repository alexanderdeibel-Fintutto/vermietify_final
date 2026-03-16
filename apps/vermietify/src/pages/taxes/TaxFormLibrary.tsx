import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  ArrowRight,
  Building2,
  Euro,
  Receipt,
  Scale,
  TrendingUp,
  Landmark,
  ClipboardList,
} from "lucide-react";

interface TaxForm {
  id: string;
  type: string;
  name: string;
  fullName: string;
  description: string;
  icon: typeof FileText;
  status: "available" | "in_progress" | "completed" | "not_required";
  link: string;
  category: string;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Verfugbar",
  in_progress: "In Bearbeitung",
  completed: "Abgeschlossen",
  not_required: "Nicht erforderlich",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  not_required: "bg-gray-100 text-gray-800",
};

const TAX_FORMS: TaxForm[] = [
  {
    id: "anlage_v",
    type: "Anlage V",
    name: "Vermietung und Verpachtung",
    fullName: "Anlage V - Einkunfte aus Vermietung und Verpachtung",
    description: "Erfassung aller Einkunfte aus Vermietung und Verpachtung. Hier tragen Sie Mieteinnahmen, Werbungskosten, AfA und sonstige Ausgaben fur Ihre Mietobjekte ein.",
    icon: Building2,
    status: "available",
    link: "/steuern/anlage-v",
    category: "Einkunfte",
  },
  {
    id: "anlage_kap",
    type: "Anlage KAP",
    name: "Kapitalertrage",
    fullName: "Anlage KAP - Einkunfte aus Kapitalvermogen",
    description: "Dividenden, Zinsen und andere Kapitalertrage. Relevant fur Erlose aus Immobilienfonds, REITs oder Festgeld, das mit der Immobilienfinanzierung zusammenhangt.",
    icon: Euro,
    status: "available",
    link: "/steuern/anlage-kap",
    category: "Einkunfte",
  },
  {
    id: "anlage_so",
    type: "Anlage SO",
    name: "Sonstige Einkunfte",
    fullName: "Anlage SO - Sonstige Einkunfte",
    description: "Private Verausserungsgeschafte, Spekulationsgewinne aus Immobilienverkaufen innerhalb von 10 Jahren und sonstige Einkunfte.",
    icon: Receipt,
    status: "available",
    link: "/steuern/anlage-so",
    category: "Einkunfte",
  },
  {
    id: "anlage_vg",
    type: "Anlage VG",
    name: "Verausserungsgewinne",
    fullName: "Anlage VG - Verausserungsgewinne",
    description: "Gewinne aus der Verausserung von Immobilien und Beteiligungen. Berechnung der Spekulationssteuer bei Verkauf innerhalb der Haltefrist.",
    icon: TrendingUp,
    status: "not_required",
    link: "/steuern/erklaerungen",
    category: "Einkunfte",
  },
  {
    id: "est",
    type: "ESt",
    name: "Einkommensteuererklarung",
    fullName: "Einkommensteuererklarung (Mantelbogen)",
    description: "Der Hauptvordruck der Einkommensteuererklarung. Hier werden alle Anlagen zusammengefuhrt und personliche Daten erfasst.",
    icon: ClipboardList,
    status: "available",
    link: "/steuern/erklaerungen",
    category: "Hauptformulare",
  },
  {
    id: "ust",
    type: "USt",
    name: "Umsatzsteuererklarung",
    fullName: "Umsatzsteuererklarung",
    description: "Nur relevant bei Option zur Umsatzsteuer. Erfassung der Umsatzsteuer auf Mieteinnahmen und Vorsteuerabzug fur gewerbliche Vermietung.",
    icon: Scale,
    status: "not_required",
    link: "/steuern/erklaerungen",
    category: "Hauptformulare",
  },
  {
    id: "gew",
    type: "GewSt",
    name: "Gewerbesteuererklarung",
    fullName: "Gewerbesteuererklarung",
    description: "Nur relevant bei gewerblicher Vermietung oder wenn die Grenze zur gewerblichen Tatigkeit uberschritten wird (z.B. bei kurzfristiger Vermietung).",
    icon: Landmark,
    status: "not_required",
    link: "/steuern/erklaerungen",
    category: "Hauptformulare",
  },
];

export default function TaxFormLibrary() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = TAX_FORMS.filter((form) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      form.type.toLowerCase().includes(q) ||
      form.name.toLowerCase().includes(q) ||
      form.fullName.toLowerCase().includes(q) ||
      form.description.toLowerCase().includes(q)
    );
  });

  const categories = [...new Set(TAX_FORMS.map((f) => f.category))];

  return (
    <MainLayout title="Formularbibliothek">
      <div className="space-y-6">
        <PageHeader
          title="Steuerformular-Bibliothek"
          subtitle="Deutsche Steuerformulare fur Immobilienvermieter"
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Formulare" },
          ]}
        />

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Formular suchen (z.B. Anlage V, KAP, ESt...)"
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Cards grouped by category */}
        {categories.map((category) => {
          const categoryForms = filtered.filter((f) => f.category === category);
          if (categoryForms.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {categoryForms.map((form) => {
                  const FormIcon = form.icon;

                  return (
                    <Card key={form.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                              <FormIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{form.type}</CardTitle>
                              <CardDescription className="mt-1">{form.name}</CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className={STATUS_COLORS[form.status]}>
                            {STATUS_LABELS[form.status]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {form.description}
                        </p>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={form.link}>
                            {form.status === "not_required" ? "Details anzeigen" : "Formular offnen"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
