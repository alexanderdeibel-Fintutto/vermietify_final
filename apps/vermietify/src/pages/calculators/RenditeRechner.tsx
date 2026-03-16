import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " %";
}

export default function RenditeRechner() {
  const [kaufpreis, setKaufpreis] = useState(300000);
  const [jahreskaltmiete, setJahreskaltmiete] = useState(12000);
  const [nebenkostenJahr, setNebenkostenJahr] = useState(3000);
  const [instandhaltungJahr, setInstandhaltungJahr] = useState(1500);

  const result = useMemo(() => {
    const bruttoRendite =
      kaufpreis > 0 ? (jahreskaltmiete / kaufpreis) * 100 : 0;

    const nettoMieteinnahmen =
      jahreskaltmiete - nebenkostenJahr - instandhaltungJahr;
    const nettoRendite =
      kaufpreis > 0 ? (nettoMieteinnahmen / kaufpreis) * 100 : 0;

    // Eigenkapitalrendite: assuming 20% Eigenkapital, rest financed at 3.5% interest
    const eigenkapitalAnteil = 0.2;
    const eigenkapital = kaufpreis * eigenkapitalAnteil;
    const fremdkapital = kaufpreis * (1 - eigenkapitalAnteil);
    const zinskosten = fremdkapital * 0.035;
    const cashflowNachZinsen = nettoMieteinnahmen - zinskosten;
    const eigenkapitalRendite =
      eigenkapital > 0 ? (cashflowNachZinsen / eigenkapital) * 100 : 0;

    return {
      bruttoRendite,
      nettoRendite,
      eigenkapitalRendite,
      nettoMieteinnahmen,
      eigenkapital,
      fremdkapital,
      zinskosten,
      cashflowNachZinsen,
    };
  }, [kaufpreis, jahreskaltmiete, nebenkostenJahr, instandhaltungJahr]);

  return (
    <MainLayout
      title="Rendite-Rechner"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "Rendite-Rechner" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Rendite-Rechner"
          subtitle="Berechnen Sie die Rendite Ihrer Immobilie: Bruttomietrendite, Nettomietrendite und Eigenkapitalrendite."
          actions={
            <Button variant="outline" asChild>
              <Link to="/calculators">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Alle Rechner
              </Link>
            </Button>
          }
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Eingaben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kaufpreis">Kaufpreis</Label>
                <Input
                  id="kaufpreis"
                  type="number"
                  value={kaufpreis}
                  onChange={(e) => setKaufpreis(Number(e.target.value))}
                  min={0}
                  step={10000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jahreskaltmiete">Jahreskaltmiete</Label>
                <Input
                  id="jahreskaltmiete"
                  type="number"
                  value={jahreskaltmiete}
                  onChange={(e) => setJahreskaltmiete(Number(e.target.value))}
                  min={0}
                  step={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nebenkosten">
                  Nicht umlagefähige Nebenkosten / Jahr
                </Label>
                <Input
                  id="nebenkosten"
                  type="number"
                  value={nebenkostenJahr}
                  onChange={(e) => setNebenkostenJahr(Number(e.target.value))}
                  min={0}
                  step={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instandhaltung">Instandhaltung / Jahr</Label>
                <Input
                  id="instandhaltung"
                  type="number"
                  value={instandhaltungJahr}
                  onChange={(e) => setInstandhaltungJahr(Number(e.target.value))}
                  min={0}
                  step={100}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {/* Bruttomietrendite */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Bruttomietrendite</p>
                <p className="text-4xl font-bold text-primary mt-1">
                  {formatPercent(result.bruttoRendite)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Jahreskaltmiete / Kaufpreis
                </p>
              </CardContent>
            </Card>

            {/* Nettomietrendite */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Nettomietrendite</p>
                <p className="text-4xl font-bold text-primary mt-1">
                  {formatPercent(result.nettoRendite)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Netto-Mieteinnahmen ({formatEuro(result.nettoMieteinnahmen)}) /
                  Kaufpreis
                </p>
              </CardContent>
            </Card>

            {/* Eigenkapitalrendite */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Eigenkapitalrendite (bei 20% EK, 3,5% Zins)
                </p>
                <p
                  className={`text-4xl font-bold mt-1 ${
                    result.eigenkapitalRendite >= 0
                      ? "text-emerald-600"
                      : "text-destructive"
                  }`}
                >
                  {formatPercent(result.eigenkapitalRendite)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  EK: {formatEuro(result.eigenkapital)} | Zinsen:{" "}
                  {formatEuro(result.zinskosten)} / Jahr
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
