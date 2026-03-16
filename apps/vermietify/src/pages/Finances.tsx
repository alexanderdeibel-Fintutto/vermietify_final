import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, TrendingDown, Plus, Download, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Finances() {
  return (
    <MainLayout title="Finanzen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finanzen</h1>
            <p className="text-muted-foreground">
              Übersicht Ihrer Einnahmen und Ausgaben
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Transaktion
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Einnahmen (Jahr)</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">+€ 0,00</div>
              <p className="text-xs text-muted-foreground">
                Keine Einnahmen erfasst
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausgaben (Jahr)</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">-€ 0,00</div>
              <p className="text-xs text-muted-foreground">
                Keine Ausgaben erfasst
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€ 0,00</div>
              <p className="text-xs text-muted-foreground">
                Aktueller Kontostand
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Transaktionen</TabsTrigger>
            <TabsTrigger value="accounts">Bankkonten</TabsTrigger>
            <TabsTrigger value="reports">Berichte</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaktionen</CardTitle>
                <CardDescription>
                  Alle Einnahmen und Ausgaben im Überblick
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Noch keine Transaktionen
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Erfassen Sie Ihre erste Transaktion, um zu beginnen
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Transaktion hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Bankkonten</CardTitle>
                <CardDescription>
                  Verknüpfte Bankkonten verwalten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Keine Bankkonten verknüpft
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Verknüpfen Sie ein Bankkonto für automatische Zuordnung
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Bankkonto hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Berichte</CardTitle>
                <CardDescription>
                  Finanzberichte und Auswertungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Berichte erstellen
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Erfassen Sie Transaktionen, um Berichte zu generieren
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
