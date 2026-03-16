import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Award, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " %";
}

interface Property {
  id: string;
  name: string;
  kaufpreis: number;
  flaeche: number;
  baujahr: number;
  mieteMonat: number;
  nebenkostenMonat: number;
  standort: string;
}

const createProperty = (): Property => ({
  id: crypto.randomUUID(),
  name: "",
  kaufpreis: 250000,
  flaeche: 75,
  baujahr: 1990,
  mieteMonat: 800,
  nebenkostenMonat: 200,
  standort: "",
});

function calcScore(p: Property): number {
  const preisProQm = p.flaeche > 0 ? p.kaufpreis / p.flaeche : 0;
  const jahresmiete = p.mieteMonat * 12;
  const rendite = p.kaufpreis > 0 ? (jahresmiete / p.kaufpreis) * 100 : 0;
  const cashflow = (p.mieteMonat - p.nebenkostenMonat) * 12;

  let score = 50;
  // Rendite bonus
  if (rendite > 6) score += 20;
  else if (rendite > 4) score += 10;
  else if (rendite < 2) score -= 10;
  // Cashflow bonus
  if (cashflow > 6000) score += 15;
  else if (cashflow > 3000) score += 8;
  else if (cashflow < 0) score -= 15;
  // Baujahr factor
  if (p.baujahr >= 2010) score += 10;
  else if (p.baujahr >= 2000) score += 5;
  else if (p.baujahr < 1970) score -= 5;
  // Price per sqm
  if (preisProQm < 2500) score += 5;
  else if (preisProQm > 5000) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function getScoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function getRecommendation(score: number): string {
  if (score >= 75) return "Empfehlung";
  if (score >= 50) return "Neutral";
  return "Vorsicht";
}

export default function PropertyComparison() {
  const [properties, setProperties] = useState<Property[]>([
    { ...createProperty(), name: "Wohnung Munchen", kaufpreis: 350000, flaeche: 65, baujahr: 2005, mieteMonat: 1100, nebenkostenMonat: 250, standort: "Munchen" },
    { ...createProperty(), name: "Wohnung Berlin", kaufpreis: 220000, flaeche: 80, baujahr: 1998, mieteMonat: 850, nebenkostenMonat: 180, standort: "Berlin" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProp, setNewProp] = useState<Property>(createProperty());

  const addProperty = () => {
    if (properties.length >= 4) return;
    setProperties((prev) => [...prev, { ...newProp, id: crypto.randomUUID() }]);
    setNewProp(createProperty());
    setDialogOpen(false);
  };

  const removeProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const scores = useMemo(() => properties.map(calcScore), [properties]);
  const bestIndex = useMemo(() => {
    let best = 0;
    scores.forEach((s, i) => {
      if (s > scores[best]) best = i;
    });
    return best;
  }, [scores]);

  return (
    <MainLayout
      title="Immobilienvergleich"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Rechner", href: "/calculators" },
        { label: "Immobilienvergleich" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Immobilienvergleich"
          subtitle="Vergleichen Sie bis zu 4 Immobilien anhand wichtiger Kennzahlen."
          actions={
            <div className="flex gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={properties.length >= 4}>
                    <Plus className="mr-2 h-4 w-4" />
                    Immobilie hinzufugen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neue Immobilie hinzufugen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newProp.name}
                        onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                        placeholder="z.B. Wohnung Hamburg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Kaufpreis</Label>
                        <Input
                          type="number"
                          value={newProp.kaufpreis}
                          onChange={(e) => setNewProp({ ...newProp, kaufpreis: Number(e.target.value) })}
                          min={0}
                          step={10000}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Flache (m2)</Label>
                        <Input
                          type="number"
                          value={newProp.flaeche}
                          onChange={(e) => setNewProp({ ...newProp, flaeche: Number(e.target.value) })}
                          min={0}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Baujahr</Label>
                        <Input
                          type="number"
                          value={newProp.baujahr}
                          onChange={(e) => setNewProp({ ...newProp, baujahr: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Standort</Label>
                        <Input
                          value={newProp.standort}
                          onChange={(e) => setNewProp({ ...newProp, standort: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Miete / Monat</Label>
                        <Input
                          type="number"
                          value={newProp.mieteMonat}
                          onChange={(e) => setNewProp({ ...newProp, mieteMonat: Number(e.target.value) })}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nebenkosten / Monat</Label>
                        <Input
                          type="number"
                          value={newProp.nebenkostenMonat}
                          onChange={(e) => setNewProp({ ...newProp, nebenkostenMonat: Number(e.target.value) })}
                          min={0}
                        />
                      </div>
                    </div>
                    <Button onClick={addProperty} className="w-full">
                      Hinzufugen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" asChild>
                <Link to="/calculators">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Alle Rechner
                </Link>
              </Button>
            </div>
          }
        />

        {/* Property Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {properties.map((p, idx) => {
            const score = scores[idx];
            const preisProQm = p.flaeche > 0 ? p.kaufpreis / p.flaeche : 0;
            const rendite = p.kaufpreis > 0 ? ((p.mieteMonat * 12) / p.kaufpreis) * 100 : 0;

            return (
              <Card key={p.id} className={idx === bestIndex ? "border-emerald-500 ring-1 ring-emerald-500" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {p.name || `Immobilie ${idx + 1}`}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeProperty(p.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  {p.standort && <p className="text-xs text-muted-foreground">{p.standort}</p>}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kaufpreis</span>
                    <span className="font-medium">{formatEuro(p.kaufpreis)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preis/m2</span>
                    <span className="font-medium">{formatEuro(preisProQm)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rendite</span>
                    <span className="font-medium">{formatPercent(rendite)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Baujahr</span>
                    <span className="font-medium">{p.baujahr}</span>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-sm font-medium">Score</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getScoreColor(score)}>{score}/100</Badge>
                      {idx === bestIndex && (
                        <Badge className="bg-emerald-100 text-emerald-800">
                          <Award className="h-3 w-3 mr-1" />
                          {getRecommendation(score)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Grid */}
        {properties.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailvergleich</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kennzahl</TableHead>
                    {properties.map((p, i) => (
                      <TableHead key={p.id}>
                        {p.name || `Immobilie ${i + 1}`}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Kaufpreis</TableCell>
                    {properties.map((p) => (
                      <TableCell key={p.id}>{formatEuro(p.kaufpreis)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Flache (m2)</TableCell>
                    {properties.map((p) => (
                      <TableCell key={p.id}>{p.flaeche}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Preis/m2</TableCell>
                    {properties.map((p) => (
                      <TableCell key={p.id}>
                        {formatEuro(p.flaeche > 0 ? p.kaufpreis / p.flaeche : 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Baujahr</TableCell>
                    {properties.map((p) => (
                      <TableCell key={p.id}>{p.baujahr}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Miete / Monat</TableCell>
                    {properties.map((p) => (
                      <TableCell key={p.id}>{formatEuro(p.mieteMonat)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Rendite (brutto)</TableCell>
                    {properties.map((p) => (
                      <TableCell key={p.id}>
                        {formatPercent(p.kaufpreis > 0 ? ((p.mieteMonat * 12) / p.kaufpreis) * 100 : 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Cashflow / Jahr</TableCell>
                    {properties.map((p) => {
                      const cf = (p.mieteMonat - p.nebenkostenMonat) * 12;
                      return (
                        <TableCell
                          key={p.id}
                          className={cf >= 0 ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}
                        >
                          {formatEuro(cf)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Score</TableCell>
                    {scores.map((s, i) => (
                      <TableCell key={properties[i].id}>
                        <Badge className={getScoreColor(s)}>{s}/100</Badge>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
