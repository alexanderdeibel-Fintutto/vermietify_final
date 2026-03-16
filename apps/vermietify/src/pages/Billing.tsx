import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, Calculator, Download } from "lucide-react";

export default function Billing() {
  return (
    <MainLayout title="Abrechnungen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nebenkostenabrechnung</h1>
            <p className="text-muted-foreground">
              Erstellen und verwalten Sie Nebenkostenabrechnungen
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neue Abrechnung
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offene Abrechnungen</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Zu erstellende Abrechnungen
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nachzahlungen</CardTitle>
              <Calculator className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">€ 0,00</div>
              <p className="text-xs text-muted-foreground">
                Offene Nachforderungen
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rückzahlungen</CardTitle>
              <Calculator className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">€ 0,00</div>
              <p className="text-xs text-muted-foreground">
                Zu erstattende Beträge
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Abrechnungen */}
        <Card>
          <CardHeader>
            <CardTitle>Abrechnungen</CardTitle>
            <CardDescription>
              Alle erstellten Nebenkostenabrechnungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Noch keine Abrechnungen
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Erfassen Sie zunächst Ihre Nebenkosten, um automatisch Abrechnungen für Ihre Mieter zu erstellen
              </p>
              <div className="flex gap-2">
                <Button variant="outline">
                  Nebenkosten erfassen
                </Button>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Abrechnung erstellen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
