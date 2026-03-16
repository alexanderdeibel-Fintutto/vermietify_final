import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Euro,
  Save,
  FileText,
  Info,
  Calculator,
  Globe,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface KAPFormData {
  // Zeile 7-15: Dividenden und Zinsen
  zeile7_dividenden_inland: string;
  zeile8_dividenden_ausland: string;
  zeile9_zinsen_spareinlagen: string;
  zeile10_zinsen_anleihen: string;
  zeile11_zinsen_sonstige: string;
  zeile12_investmentfonds_ertraege: string;
  zeile13_stillhaltergeschaefte: string;
  zeile14_lebensversicherungen: string;
  zeile15_sonstige_kapitalertraege: string;
  // Zeile 16-22: Auslandische Einkuenfte
  zeile16_auslaendische_ertraege: string;
  zeile17_quellensteuer_anrechenbar: string;
  zeile18_quellensteuer_abzugsfaehig: string;
  zeile19_dba_freistellung: string;
  zeile20_auslaendische_steuer_gesamt: string;
  zeile21_anrechnungsbetrag: string;
  zeile22_verbleibende_auslaendische_steuer: string;
}

const emptyForm: KAPFormData = {
  zeile7_dividenden_inland: "",
  zeile8_dividenden_ausland: "",
  zeile9_zinsen_spareinlagen: "",
  zeile10_zinsen_anleihen: "",
  zeile11_zinsen_sonstige: "",
  zeile12_investmentfonds_ertraege: "",
  zeile13_stillhaltergeschaefte: "",
  zeile14_lebensversicherungen: "",
  zeile15_sonstige_kapitalertraege: "",
  zeile16_auslaendische_ertraege: "",
  zeile17_quellensteuer_anrechenbar: "",
  zeile18_quellensteuer_abzugsfaehig: "",
  zeile19_dba_freistellung: "",
  zeile20_auslaendische_steuer_gesamt: "",
  zeile21_anrechnungsbetrag: "",
  zeile22_verbleibende_auslaendische_steuer: "",
};

export default function AnlageKAPEditor() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<KAPFormData>({ ...emptyForm });

  const updateField = (field: keyof KAPFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const parseNum = (val: string) => parseFloat(val) || 0;

  // Totals
  const totalDividendenZinsen =
    parseNum(formData.zeile7_dividenden_inland) +
    parseNum(formData.zeile8_dividenden_ausland) +
    parseNum(formData.zeile9_zinsen_spareinlagen) +
    parseNum(formData.zeile10_zinsen_anleihen) +
    parseNum(formData.zeile11_zinsen_sonstige) +
    parseNum(formData.zeile12_investmentfonds_ertraege) +
    parseNum(formData.zeile13_stillhaltergeschaefte) +
    parseNum(formData.zeile14_lebensversicherungen) +
    parseNum(formData.zeile15_sonstige_kapitalertraege);

  const totalAusland =
    parseNum(formData.zeile16_auslaendische_ertraege) -
    parseNum(formData.zeile17_quellensteuer_anrechenbar) -
    parseNum(formData.zeile18_quellensteuer_abzugsfaehig);

  const grandTotal = totalDividendenZinsen;
  const sparerpauschbetrag = 1000; // 1.000 € for singles, 2.000 € for married
  const zuVersteuern = Math.max(0, grandTotal - sparerpauschbetrag);
  const abgeltungssteuer = Math.round(zuVersteuern * 0.25 * 100) / 100;

  const handleSave = () => {
    toast({ title: "Anlage KAP gespeichert", description: "Die Daten wurden erfolgreich gespeichert." });
  };

  const renderFormField = (
    label: string,
    field: keyof KAPFormData,
    zeile: string,
    hint?: string
  ) => (
    <div className="grid grid-cols-12 gap-4 items-center">
      <div className="col-span-1 text-sm text-muted-foreground font-mono">{zeile}</div>
      <div className="col-span-7">
        <Label className="text-sm">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="col-span-4">
        <Input
          type="number"
          step="0.01"
          value={formData[field]}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder="0,00"
          className="text-right font-mono"
        />
      </div>
    </div>
  );

  return (
    <MainLayout title="Anlage KAP">
      <div className="space-y-6">
        <PageHeader
          title="Anlage KAP - Kapitalertrage"
          subtitle="Einkunfte aus Kapitalvermogen erfassen"
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Formulare", href: "/steuern/formulare" },
            { label: "Anlage KAP" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/steuern/formulare">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zuruck
                </Link>
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
          }
        />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Hinweis zur Anlage KAP</AlertTitle>
          <AlertDescription>
            Die Anlage KAP muss eingereicht werden, wenn Kapitalertrage ohne Abgeltungssteuer-Einbehalt erzielt wurden,
            die Kirchensteuer auf Kapitalertrage zu hoch oder zu niedrig war, oder Sie die Gunstigerpruefung beantragen mochten.
          </AlertDescription>
        </Alert>

        {/* Section 1: Dividenden und Zinsen (Zeile 7-15) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Kapitalertrage (Zeile 7-15)
            </CardTitle>
            <CardDescription>
              Dividenden, Zinsen und sonstige Kapitalertrage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderFormField(
              "Dividenden inlandischer Kapitalgesellschaften",
              "zeile7_dividenden_inland",
              "Z.7",
              "Bruttodividenden vor Abzug der KESt"
            )}
            {renderFormField(
              "Dividenden auslandischer Kapitalgesellschaften",
              "zeile8_dividenden_ausland",
              "Z.8",
              "Bruttodividenden vor Quellensteuer"
            )}
            {renderFormField(
              "Zinsen aus Spareinlagen und Festgeld",
              "zeile9_zinsen_spareinlagen",
              "Z.9"
            )}
            {renderFormField(
              "Zinsen aus Anleihen und Schuldverschreibungen",
              "zeile10_zinsen_anleihen",
              "Z.10"
            )}
            {renderFormField(
              "Sonstige Zinsen",
              "zeile11_zinsen_sonstige",
              "Z.11",
              "z.B. Privatdarlehen, Steuernachzahlungszinsen"
            )}
            {renderFormField(
              "Ertrage aus Investmentfonds",
              "zeile12_investmentfonds_ertraege",
              "Z.12"
            )}
            {renderFormField(
              "Ertrage aus Stillhaltergeschaeften",
              "zeile13_stillhaltergeschaefte",
              "Z.13"
            )}
            {renderFormField(
              "Ertrage aus Lebensversicherungen",
              "zeile14_lebensversicherungen",
              "Z.14"
            )}
            {renderFormField(
              "Sonstige Kapitalertrage",
              "zeile15_sonstige_kapitalertraege",
              "Z.15"
            )}

            <Separator />

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1"></div>
              <div className="col-span-7">
                <span className="font-medium">Summe Kapitalertrage</span>
              </div>
              <div className="col-span-4 text-right font-mono font-bold text-lg">
                {totalDividendenZinsen.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Auslandische Einkunfte (Zeile 16-22) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Auslandische Einkunfte (Zeile 16-22)
            </CardTitle>
            <CardDescription>
              Anrechnung auslandischer Steuern
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderFormField(
              "Auslandische Kapitalertrage (brutto)",
              "zeile16_auslaendische_ertraege",
              "Z.16"
            )}
            {renderFormField(
              "Anrechenbare auslandische Quellensteuer",
              "zeile17_quellensteuer_anrechenbar",
              "Z.17",
              "Gemaess DBA anrechenbarer Betrag"
            )}
            {renderFormField(
              "Abzugsfahige auslandische Quellensteuer",
              "zeile18_quellensteuer_abzugsfaehig",
              "Z.18",
              "Nicht anrechenbare, aber abzugsfahige Quellensteuer"
            )}
            {renderFormField(
              "Nach DBA steuerfreie Ertrage",
              "zeile19_dba_freistellung",
              "Z.19",
              "Freistellungsmethode gemaess DBA"
            )}
            {renderFormField(
              "Auslandische Steuer gesamt",
              "zeile20_auslaendische_steuer_gesamt",
              "Z.20"
            )}
            {renderFormField(
              "Anrechnungsbetrag",
              "zeile21_anrechnungsbetrag",
              "Z.21"
            )}
            {renderFormField(
              "Verbleibende auslandische Steuer",
              "zeile22_verbleibende_auslaendische_steuer",
              "Z.22"
            )}

            <Separator />

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1"></div>
              <div className="col-span-7">
                <span className="font-medium">Netto auslandische Einkunfte</span>
              </div>
              <div className="col-span-4 text-right font-mono font-bold text-lg">
                {totalAusland.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totals Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Zusammenfassung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Kapitalertrage gesamt</span>
                <span className="font-mono font-medium">
                  {grandTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Sparer-Pauschbetrag</span>
                <span className="font-mono font-medium text-destructive">
                  -{sparerpauschbetrag.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="font-medium">Zu versteuernde Kapitalertrage</span>
                <span className="font-mono font-bold text-lg">
                  {zuVersteuern.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border-2 border-primary rounded-lg">
                <span className="font-medium">Abgeltungssteuer (25%)</span>
                <span className="font-mono font-bold text-lg text-primary">
                  {abgeltungssteuer.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
