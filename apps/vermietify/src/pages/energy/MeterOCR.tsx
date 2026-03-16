import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Gauge,
  Calendar,
  Edit3,
  Send,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Zaehler {
  id: string;
  nummer: string;
  typ: string;
  gebaeude: string;
  einheit: string;
  letzterStand: number;
  letzteDatum: string;
}

const zaehler: Zaehler[] = [
  { id: "1", nummer: "STR-2024-001", typ: "Strom", gebaeude: "Musterstraße 10", einheit: "Whg. 1", letzterStand: 12450, letzteDatum: "2026-02-01" },
  { id: "2", nummer: "STR-2024-002", typ: "Strom", gebaeude: "Musterstraße 10", einheit: "Whg. 2", letzterStand: 8920, letzteDatum: "2026-02-01" },
  { id: "3", nummer: "GAS-2024-001", typ: "Gas", gebaeude: "Musterstraße 10", einheit: "Zentral", letzterStand: 3480, letzteDatum: "2026-02-01" },
  { id: "4", nummer: "WAS-2024-001", typ: "Wasser", gebaeude: "Hauptweg 5", einheit: "Whg. 1", letzterStand: 245, letzteDatum: "2026-01-15" },
  { id: "5", nummer: "STR-2024-003", typ: "Strom", gebaeude: "Hauptweg 5", einheit: "Whg. 2", letzterStand: 5670, letzteDatum: "2026-01-15" },
];

export default function MeterOCR() {
  const [selectedZaehler, setSelectedZaehler] = useState("");
  const [ablesedatum, setAblesedatum] = useState("2026-03-14");
  const [ocrResult, setOcrResult] = useState<number | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);

  const activeZaehler = zaehler.find((z) => z.id === selectedZaehler);
  const currentValue = ocrResult !== null ? ocrResult : manualValue ? parseFloat(manualValue) : null;
  const letzterStand = activeZaehler?.letzterStand || 0;
  const differenz = currentValue !== null ? currentValue - letzterStand : null;

  const isPlausibel =
    differenz !== null && differenz >= 0 && differenz < letzterStand * 0.5;

  const simulateScan = () => {
    setIsScanning(true);
    setScanDone(false);
    setTimeout(() => {
      const simulatedValue = letzterStand + Math.floor(Math.random() * 500) + 50;
      setOcrResult(simulatedValue);
      setManualValue(simulatedValue.toString());
      setIsScanning(false);
      setScanDone(true);
    }, 2000);
  };

  return (
    <MainLayout
      title="Zähler-OCR"
      breadcrumbs={[
        { label: "Energie", href: "/energy" },
        { label: "Zähler-OCR" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Zählerablesung per OCR"
          subtitle="Fotografieren Sie Ihren Zähler und lassen Sie den Stand automatisch erkennen."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Upload + OCR */}
          <div className="space-y-6">
            {/* Zähler Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Zähler auswählen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Zähler *</Label>
                  <Select value={selectedZaehler} onValueChange={setSelectedZaehler}>
                    <SelectTrigger>
                      <SelectValue placeholder="Zähler auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {zaehler.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          {z.nummer} · {z.typ} · {z.gebaeude} · {z.einheit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ablesedatum *</Label>
                  <Input
                    type="date"
                    value={ablesedatum}
                    onChange={(e) => setAblesedatum(e.target.value)}
                  />
                </div>
                {activeZaehler && (
                  <div className="p-3 rounded-lg bg-muted text-sm">
                    <p>
                      <span className="text-muted-foreground">Letzter Stand:</span>{" "}
                      <span className="font-medium">{activeZaehler.letzterStand.toLocaleString("de-DE")}</span>{" "}
                      <span className="text-muted-foreground">
                        ({new Date(activeZaehler.letzteDatum).toLocaleDateString("de-DE")})
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Camera/Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Zählerfoto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {isScanning ? (
                    <div className="space-y-3">
                      <ScanLine className="h-12 w-12 mx-auto text-primary animate-pulse" />
                      <p className="font-medium">Zählerstand wird erkannt...</p>
                      <p className="text-sm text-muted-foreground">OCR-Analyse läuft</p>
                    </div>
                  ) : scanDone ? (
                    <div className="space-y-3">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                      <p className="font-medium text-green-700">Zählerstand erkannt!</p>
                      <p className="text-sm text-muted-foreground">
                        Sie können den Wert unten korrigieren
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="font-medium">Foto hochladen oder aufnehmen</p>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG oder direkt per Kamera
                      </p>
                      <div className="flex gap-3 justify-center mt-4">
                        <Button onClick={simulateScan} disabled={!selectedZaehler}>
                          <Camera className="h-4 w-4 mr-2" />
                          Foto aufnehmen
                        </Button>
                        <Button variant="outline" onClick={simulateScan} disabled={!selectedZaehler}>
                          <Upload className="h-4 w-4 mr-2" />
                          Datei hochladen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Result + Correction */}
          <div className="space-y-6">
            {/* OCR Result */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Ergebnis / Manuelle Korrektur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Erkannter / Korrigierter Zählerstand *</Label>
                  <Input
                    type="number"
                    value={manualValue}
                    onChange={(e) => {
                      setManualValue(e.target.value);
                      setOcrResult(null);
                    }}
                    placeholder="Zählerstand eingeben"
                    className="text-lg"
                  />
                </div>

                {activeZaehler && currentValue !== null && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Differenz zum letzten Stand:</span>
                        <span className="font-bold">
                          {differenz !== null ? differenz.toLocaleString("de-DE") : "-"}{" "}
                          {activeZaehler.typ === "Wasser" ? "m³" : "kWh"}
                        </span>
                      </div>
                    </div>

                    {/* Plausibilitätsprüfung */}
                    <Card className={cn(
                      "border-2",
                      isPlausibel ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                    )}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                          {isPlausibel ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">Plausibel</p>
                                <p className="text-sm text-green-700">
                                  Der Wert liegt im erwarteten Bereich.
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              <div>
                                <p className="font-medium text-red-800">Prüfung erforderlich</p>
                                <p className="text-sm text-red-700">
                                  {differenz !== null && differenz < 0
                                    ? "Neuer Stand ist niedriger als der letzte Stand."
                                    : "Abweichung ist ungewöhnlich hoch (>50% des letzten Stands)."}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={!selectedZaehler || !manualValue}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Zählerstand übermitteln
                </Button>
              </CardContent>
            </Card>

            {/* Recent Readings */}
            <Card>
              <CardHeader>
                <CardTitle>Letzte Ablesungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {zaehler.slice(0, 4).map((z) => (
                    <div key={z.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                      <div>
                        <p className="font-medium">{z.nummer}</p>
                        <p className="text-muted-foreground">{z.typ} · {z.gebaeude}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{z.letzterStand.toLocaleString("de-DE")}</p>
                        <p className="text-muted-foreground">
                          {new Date(z.letzteDatum).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
