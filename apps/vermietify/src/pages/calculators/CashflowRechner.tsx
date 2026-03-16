import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export default function CashflowRechner() {
  const [kaltmiete, setKaltmiete] = useState(850);
  const [nebenkostenVorauszahlung, setNebenkostenVorauszahlung] = useState(200);
  const [kreditrate, setKreditrate] = useState(750);
  const [instandhaltung, setInstandhaltung] = useState(100);
  const [verwaltungskosten, setVerwaltungskosten] = useState(30);
  const [versicherungen, setVersicherungen] = useState(40);

  const result = useMemo(() => {
    const einnahmenMonat = kaltmiete + nebenkostenVorauszahlung;
    const ausgabenMonat =
      kreditrate + instandhaltung + verwaltungskosten + versicherungen + nebenkostenVorauszahlung;
    const cashflowMonat = kaltmiete - kreditrate - instandhaltung - verwaltungskosten - versicherungen;
    const cashflowJahr = cashflowMonat * 12;
    const isPositive = cashflowMonat >= 0;

    return {
      einnahmenMonat,
      ausgabenMonat,
      cashflowMonat,
      cashflowJahr,
      isPositive,
    };
  }, [
    kaltmiete,
    nebenkostenVorauszahlung,
    kreditrate,
    instandhaltung,
    verwaltungskosten,
    versicherungen,
  ]);

  const ausgabenPositionen = [
    { label: "Kreditrate", betrag: kreditrate },
    { label: "Instandhaltungs-Rücklage", betrag: instandhaltung },
    { label: "Verwaltungskosten", betrag: verwaltungskosten },
    { label: "Versicherungen", betrag: versicherungen },
  ];

  return (
    <MainLayout
      title="Cashflow-Rechner"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "Cashflow-Rechner" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Cashflow-Rechner"
          subtitle="Berechnen Sie den monatlichen und jahrlichen Cashflow Ihrer Mietimmobilie."
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
                <Wallet className="h-5 w-5 text-primary" />
                Monatliche Eingaben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Einnahmen
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kaltmiete">Kaltmiete</Label>
                <Input
                  id="kaltmiete"
                  type="number"
                  value={kaltmiete}
                  onChange={(e) => setKaltmiete(Number(e.target.value))}
                  min={0}
                  step={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nebenkosten">Nebenkosten-Vorauszahlung</Label>
                <Input
                  id="nebenkosten"
                  type="number"
                  value={nebenkostenVorauszahlung}
                  onChange={(e) =>
                    setNebenkostenVorauszahlung(Number(e.target.value))
                  }
                  min={0}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Wird als durchlaufender Posten behandelt (kein Cashflow-Effekt)
                </p>
              </div>

              <div className="border-t pt-4 space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Ausgaben
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kreditrate">Kreditrate</Label>
                <Input
                  id="kreditrate"
                  type="number"
                  value={kreditrate}
                  onChange={(e) => setKreditrate(Number(e.target.value))}
                  min={0}
                  step={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instandhaltung">Instandhaltungs-Rücklage</Label>
                <Input
                  id="instandhaltung"
                  type="number"
                  value={instandhaltung}
                  onChange={(e) => setInstandhaltung(Number(e.target.value))}
                  min={0}
                  step={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verwaltung">Verwaltungskosten</Label>
                <Input
                  id="verwaltung"
                  type="number"
                  value={verwaltungskosten}
                  onChange={(e) => setVerwaltungskosten(Number(e.target.value))}
                  min={0}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="versicherungen">Versicherungen</Label>
                <Input
                  id="versicherungen"
                  type="number"
                  value={versicherungen}
                  onChange={(e) => setVersicherungen(Number(e.target.value))}
                  min={0}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <div className="space-y-4">
            {/* Cashflow Monat */}
            <Card
              className={
                result.isPositive
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-destructive/30 bg-destructive/5"
              }
            >
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {result.isPositive ? (
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    Monatlicher Cashflow
                  </p>
                </div>
                <p
                  className={`text-5xl font-bold ${
                    result.isPositive ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {formatEuro(result.cashflowMonat)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {result.isPositive ? "Positiver Cashflow" : "Negativer Cashflow (Zuschussbedarf)"}
                </p>
              </CardContent>
            </Card>

            {/* Cashflow Jahr */}
            <Card
              className={
                result.isPositive
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-destructive/30 bg-destructive/5"
              }
            >
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Jahrlicher Cashflow
                </p>
                <p
                  className={`text-4xl font-bold ${
                    result.isPositive ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {formatEuro(result.cashflowJahr)}
                </p>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aufschlüsselung (monatlich)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-600">Kaltmiete (Einnahme)</span>
                  <span className="font-semibold text-emerald-600">
                    + {formatEuro(kaltmiete)}
                  </span>
                </div>
                {ausgabenPositionen.map((pos) => (
                  <div key={pos.label} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {pos.label}
                    </span>
                    <span className="font-semibold text-destructive">
                      - {formatEuro(pos.betrag)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Cashflow</span>
                  <span
                    className={`font-bold text-lg ${
                      result.isPositive ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {formatEuro(result.cashflowMonat)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
