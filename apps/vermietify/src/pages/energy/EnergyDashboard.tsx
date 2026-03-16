import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Leaf,
  Upload,
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Flame,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EnergyClass {
  label: string;
  color: string;
  bgColor: string;
  range: string;
}

const ENERGY_CLASSES: Record<string, EnergyClass> = {
  "A+": { label: "A+", color: "text-green-900", bgColor: "bg-green-500", range: "< 30 kWh/m²a" },
  A: { label: "A", color: "text-green-900", bgColor: "bg-green-400", range: "30-50 kWh/m²a" },
  B: { label: "B", color: "text-green-900", bgColor: "bg-lime-400", range: "50-75 kWh/m²a" },
  C: { label: "C", color: "text-yellow-900", bgColor: "bg-yellow-300", range: "75-100 kWh/m²a" },
  D: { label: "D", color: "text-yellow-900", bgColor: "bg-yellow-400", range: "100-130 kWh/m²a" },
  E: { label: "E", color: "text-orange-900", bgColor: "bg-orange-400", range: "130-160 kWh/m²a" },
  F: { label: "F", color: "text-orange-900", bgColor: "bg-orange-500", range: "160-200 kWh/m²a" },
  G: { label: "G", color: "text-red-900", bgColor: "bg-red-400", range: "200-250 kWh/m²a" },
  H: { label: "H", color: "text-red-900", bgColor: "bg-red-600", range: "> 250 kWh/m²a" },
};

// Placeholder data for energy passports
const placeholderPassports = [
  {
    id: "1",
    building_name: "Musterstraße 10",
    energy_class: "C",
    type: "Verbrauchsausweis",
    energy_value: 92,
    valid_until: "2028-06-15",
    created_at: "2023-06-15T00:00:00Z",
  },
  {
    id: "2",
    building_name: "Hauptweg 5",
    energy_class: "B",
    type: "Bedarfsausweis",
    energy_value: 68,
    valid_until: "2029-03-20",
    created_at: "2024-03-20T00:00:00Z",
  },
  {
    id: "3",
    building_name: "Parkallee 22",
    energy_class: "E",
    type: "Verbrauchsausweis",
    energy_value: 148,
    valid_until: "2026-01-10",
    created_at: "2021-01-10T00:00:00Z",
  },
  {
    id: "4",
    building_name: "Gartenring 8",
    energy_class: "A",
    type: "Bedarfsausweis",
    energy_value: 42,
    valid_until: "2030-09-01",
    created_at: "2025-09-01T00:00:00Z",
  },
];

function getValidityStatus(validUntil: string): { label: string; className: string } {
  const endDate = new Date(validUntil);
  const now = new Date();
  const sixMonthsFromNow = new Date(now);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  if (endDate < now) {
    return { label: "Abgelaufen", className: "bg-red-100 text-red-800" };
  }
  if (endDate <= sixMonthsFromNow) {
    return { label: "Läuft bald ab", className: "bg-yellow-100 text-yellow-800" };
  }
  return { label: "Gültig", className: "bg-green-100 text-green-800" };
}

export default function EnergyDashboard() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Count buildings per energy class
  const classDistribution = placeholderPassports.reduce<Record<string, number>>((acc, p) => {
    acc[p.energy_class] = (acc[p.energy_class] || 0) + 1;
    return acc;
  }, {});

  const expiringSoon = placeholderPassports.filter((p) => {
    const endDate = new Date(p.valid_until);
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    return endDate <= sixMonths && endDate >= new Date();
  }).length;

  const expired = placeholderPassports.filter((p) => new Date(p.valid_until) < new Date()).length;

  return (
    <MainLayout title="Energieausweise" breadcrumbs={[{ label: "Energieausweise" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Energieausweise"
          subtitle="Energieeffizienz-Übersicht aller Gebäude."
          actions={
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Ausweis hochladen
            </Button>
          }
        />

        {/* Energy Class Overview Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Energieeffizienzklassen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(ENERGY_CLASSES).map(([key, config]) => {
                const count = classDistribution[key] || 0;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 min-w-[140px]",
                      count > 0 ? config.bgColor : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "text-2xl font-bold",
                      count > 0 ? config.color : "text-muted-foreground"
                    )}>
                      {config.label}
                    </span>
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        count > 0 ? config.color : "text-muted-foreground"
                      )}>
                        {count} {count === 1 ? "Gebäude" : "Gebäude"}
                      </p>
                      <p className={cn(
                        "text-xs",
                        count > 0 ? config.color + "/80" : "text-muted-foreground"
                      )}>
                        {config.range}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Energieausweise</p>
                  <p className="text-2xl font-bold">{placeholderPassports.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Läuft bald ab</p>
                  <p className="text-2xl font-bold">{expiringSoon}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Abgelaufen</p>
                  <p className="text-2xl font-bold">{expired}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Energy Passports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Energieausweise pro Gebäude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {placeholderPassports.map((passport) => {
                const energyClass = ENERGY_CLASSES[passport.energy_class];
                const validity = getValidityStatus(passport.valid_until);

                return (
                  <div
                    key={passport.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-lg flex items-center justify-center font-bold text-lg",
                        energyClass?.bgColor || "bg-muted",
                        energyClass?.color || "text-muted-foreground"
                      )}>
                        {passport.energy_class}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{passport.building_name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{passport.type}</span>
                          <span>{passport.energy_value} kWh/m²a</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Gültig bis {format(new Date(passport.valid_until), "dd.MM.yyyy", { locale: de })}
                        </div>
                      </div>
                      <Badge variant="outline" className={validity.className}>
                        {validity.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Energieausweis hochladen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gebäude *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Gebäude auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Musterstraße 10</SelectItem>
                  <SelectItem value="2">Hauptweg 5</SelectItem>
                  <SelectItem value="3">Parkallee 22</SelectItem>
                  <SelectItem value="4">Gartenring 8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ausweisart *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Art auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumption">Verbrauchsausweis</SelectItem>
                  <SelectItem value="demand">Bedarfsausweis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Energieeffizienzklasse *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Klasse" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ENERGY_CLASSES).map((key) => (
                      <SelectItem key={key} value={key}>{key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Energiekennwert (kWh/m²a) *</Label>
                <Input type="number" placeholder="z.B. 92" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gültig bis *</Label>
              <Input type="date" />
            </div>

            <div className="space-y-2">
              <Label>PDF-Datei</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  PDF hierhin ziehen oder klicken zum Auswählen
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => setShowUploadDialog(false)}>
              Hochladen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
