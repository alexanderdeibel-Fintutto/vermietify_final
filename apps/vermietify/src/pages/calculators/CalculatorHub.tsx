import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Building2,
  Calculator,
  TrendingUp,
  Landmark,
  Wallet,
  LineChart,
} from "lucide-react";

const calculators = [
  {
    title: "AfA-Rechner",
    description:
      "Berechnen Sie die Abschreibung Ihrer Immobilie und erstellen Sie einen detaillierten AfA-Plan.",
    icon: Building2,
    href: "/calculators/afa",
  },
  {
    title: "Kaufpreis-Rechner",
    description:
      "Ermitteln Sie die Gesamtkosten beim Immobilienkauf inkl. Grunderwerbsteuer, Notar und Makler.",
    icon: Calculator,
    href: "/calculators/kaufpreis",
  },
  {
    title: "Rendite-Rechner",
    description:
      "Berechnen Sie Brutto- und Nettomietrendite sowie die Eigenkapitalrendite Ihrer Immobilie.",
    icon: TrendingUp,
    href: "/calculators/rendite",
  },
  {
    title: "Tilgungs-Rechner",
    description:
      "Planen Sie Ihre Immobilienfinanzierung mit detailliertem Tilgungsplan und Zinsberechnung.",
    icon: Landmark,
    href: "/calculators/tilgung",
  },
  {
    title: "Cashflow-Rechner",
    description:
      "Berechnen Sie den monatlichen und jahrlichen Cashflow Ihrer Mietimmobilie.",
    icon: Wallet,
    href: "/calculators/cashflow",
  },
  {
    title: "Wertentwicklungs-Rechner",
    description:
      "Simulieren Sie die Wertentwicklung Ihrer Immobilie uber einen frei wahlbaren Zeitraum.",
    icon: LineChart,
    href: "/calculators/wertentwicklung",
  },
];

export default function CalculatorHub() {
  return (
    <MainLayout
      title="Rechner"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Immobilien-Rechner"
          subtitle="Alle wichtigen Berechnungen rund um Ihre Immobilie auf einen Blick."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {calculators.map((calc) => {
            const Icon = calc.icon;
            return (
              <Link key={calc.href} to={calc.href} className="group">
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/30 group-hover:bg-accent/50">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{calc.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {calc.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
