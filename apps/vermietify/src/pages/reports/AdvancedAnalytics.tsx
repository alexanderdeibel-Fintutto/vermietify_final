import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Home,
  Euro,
  Wrench,
  Building2,
  Download,
  FileText,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function AdvancedAnalytics() {
  const [period, setPeriod] = useState("12m");
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [activeTab, setActiveTab] = useState("uebersicht");

  const handleExport = (type: "pdf" | "excel") => {
    console.log(`Exporting analytics as ${type}`);
  };

  return (
    <MainLayout title="Erweiterte Analytics">
      <div className="space-y-6">
        <PageHeader
          title="Erweiterte Analytics"
          subtitle="Detaillierte Kennzahlen und Analysen Ihres Immobilienportfolios"
          breadcrumbs={[
            { label: "Berichte", href: "/reports" },
            { label: "Analytics" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport("excel")}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          }
        />

        {/* Filter Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-40">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3m">3 Monate</SelectItem>
                    <SelectItem value="6m">6 Monate</SelectItem>
                    <SelectItem value="12m">12 Monate</SelectItem>
                    <SelectItem value="24m">24 Monate</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger className="w-48">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Objekte</SelectItem>
                    <SelectItem value="hauptstrasse">Hauptstra&szlig;e 1</SelectItem>
                    <SelectItem value="parkweg">Parkweg 5</SelectItem>
                    <SelectItem value="seestrasse">Seestra&szlig;e 12</SelectItem>
                    <SelectItem value="bergallee">Bergallee 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Belegungsquote</p>
                  <p className="text-2xl font-bold">94,2%</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">+2,3% vs. Vormonat</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Home className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Durchschnittliche Miete</p>
                  <p className="text-2xl font-bold">12,80 EUR/m&sup2;</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">+1,5% vs. Vorjahr</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Euro className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Umsatztrend</p>
                  <p className="text-2xl font-bold">52.800 EUR</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">+5,1% vs. Vormonat</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Instandhaltungskosten</p>
                  <p className="text-2xl font-bold">8.420 EUR</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">+12,4% vs. Vormonat</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="uebersicht">
              <BarChart3 className="h-4 w-4 mr-2" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="mieteinnahmen">
              <Euro className="h-4 w-4 mr-2" />
              Mieteinnahmen
            </TabsTrigger>
            <TabsTrigger value="leerstand">
              <Home className="h-4 w-4 mr-2" />
              Leerstand
            </TabsTrigger>
            <TabsTrigger value="kosten">
              <Wrench className="h-4 w-4 mr-2" />
              Kosten
            </TabsTrigger>
          </TabsList>

          {/* Übersicht Tab */}
          <TabsContent value="uebersicht" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Einnahmen-Entwicklung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Chart: Einnahmen-Entwicklung (Linie, 12 Monate)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Kostenstruktur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Chart: Kostenstruktur (Tortendiagramm)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rendite nach Objekt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Chart: Rendite nach Objekt (Balkendiagramm, horizontal)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mieteinnahmen Tab */}
          <TabsContent value="mieteinnahmen" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Mietentwicklung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Chart: Kaltmiete vs. Nebenkosten (Liniendiagramm)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Zahlungsmoral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Chart: Zahlungsmoral (Donut: Pünktlich, Verspätet, Ausgefallen)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Einnahmen nach Gebäude
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Chart: Einnahmen vs. Ausgaben pro Gebäude (Balkendiagramm)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leerstand Tab */}
          <TabsContent value="leerstand" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Leerstandsentwicklung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Chart: Leerstandsquote über Zeit (Flächendiagramm)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Leerstand nach Objekt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Chart: Leerstandsquote pro Gebäude (Balkendiagramm)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Aktuelle Leerstände</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { unit: "Wohnung 3B", building: "Hauptstraße 1", since: "15.12.2025", days: 62 },
                    { unit: "Wohnung 1A", building: "Parkweg 5", since: "01.01.2026", days: 45 },
                    { unit: "Wohnung 5C", building: "Seestraße 12", since: "20.01.2026", days: 26 },
                  ].map((vacancy, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{vacancy.unit}</p>
                        <p className="text-xs text-muted-foreground">{vacancy.building}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">seit {vacancy.since}</p>
                        <Badge variant={vacancy.days > 60 ? "destructive" : vacancy.days > 30 ? "secondary" : "outline"}>
                          {vacancy.days} Tage
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kosten Tab */}
          <TabsContent value="kosten" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Kostenentwicklung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Chart: Monatliche Kosten nach Kategorie (gestapeltes Balkendiagramm)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Kostenverteilung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Chart: Kostenverteilung (Tortendiagramm)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top-Kostenpositionen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { category: "Instandhaltung", amount: 3250, percent: 38.6, trend: "+8%" },
                    { category: "Verwaltung", amount: 1850, percent: 22.0, trend: "+2%" },
                    { category: "Versicherung", amount: 1520, percent: 18.0, trend: "0%" },
                    { category: "Zinsen", amount: 1200, percent: 14.3, trend: "-3%" },
                    { category: "Sonstiges", amount: 600, percent: 7.1, trend: "+1%" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{item.category}</p>
                          <p className="text-sm font-medium">{item.amount.toLocaleString("de-DE")} EUR</p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.trend}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
