import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Receipt,
  Save,
  Info,
  Calculator,
  ArrowLeft,
  Home,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SOFormData {
  // Zeile 2-10: Private Veraeusserungsgeschaefte
  zeile2_veraeusserungspreis_immobilien: string;
  zeile3_anschaffungskosten_immobilien: string;
  zeile4_werbungskosten_veraeusserung: string;
  zeile5_veraeusserungspreis_andere: string;
  zeile6_anschaffungskosten_andere: string;
  zeile7_freigrenze_600: string;
  zeile8_verluste_vorjahre: string;
  zeile9_summe_private_veraeusserung: string;
  zeile10_anmerkungen_veraeusserung: string;
  // Zeile 11-16: Spekulationsgewinne
  zeile11_immobilien_verkaufspreis: string;
  zeile12_immobilien_anschaffungspreis: string;
  zeile13_immobilien_nebenkosten: string;
  zeile14_immobilien_afa_rueckgaengig: string;
  zeile15_spekulationsgewinn: string;
  zeile16_verlustverrechnung: string;
  // Sonstige
  zeile17_sonstige_einkunfte: string;
  zeile18_wiederkehrende_bezuege: string;
  zeile19_unterhaltsleistungen: string;
  zeile20_abgeordnetenbezuege: string;
}

const emptyForm: SOFormData = {
  zeile2_veraeusserungspreis_immobilien: "",
  zeile3_anschaffungskosten_immobilien: "",
  zeile4_werbungskosten_veraeusserung: "",
  zeile5_veraeusserungspreis_andere: "",
  zeile6_anschaffungskosten_andere: "",
  zeile7_freigrenze_600: "",
  zeile8_verluste_vorjahre: "",
  zeile9_summe_private_veraeusserung: "",
  zeile10_anmerkungen_veraeusserung: "",
  zeile11_immobilien_verkaufspreis: "",
  zeile12_immobilien_anschaffungspreis: "",
  zeile13_immobilien_nebenkosten: "",
  zeile14_immobilien_afa_rueckgaengig: "",
  zeile15_spekulationsgewinn: "",
  zeile16_verlustverrechnung: "",
  zeile17_sonstige_einkunfte: "",
  zeile18_wiederkehrende_bezuege: "",
  zeile19_unterhaltsleistungen: "",
  zeile20_abgeordnetenbezuege: "",
};

export default function AnlageSOEditor() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SOFormData>({ ...emptyForm });

  const updateField = (field: keyof SOFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const parseNum = (val: string) => parseFloat(val) || 0;

  // Private sales calculations
  const immobilienGewinn =
    parseNum(formData.zeile2_veraeusserungspreis_immobilien) -
    parseNum(formData.zeile3_anschaffungskosten_immobilien) -
    parseNum(formData.zeile4_werbungskosten_veraeusserung);

  const andereGewinn =
    parseNum(formData.zeile5_veraeusserungspreis_andere) -
    parseNum(formData.zeile6_anschaffungskosten_andere);

  const privateVeraeusserungGesamt = immobilienGewinn + andereGewinn;
  const freigrenze = 600;
  const steuerpflichtigPrivat = privateVeraeusserungGesamt > freigrenze ? privateVeraeusserungGesamt : 0;

  // Speculation gains calculations
  const spekulationsgewinn =
    parseNum(formData.zeile11_immobilien_verkaufspreis) -
    parseNum(formData.zeile12_immobilien_anschaffungspreis) -
    parseNum(formData.zeile13_immobilien_nebenkosten) +
    parseNum(formData.zeile14_immobilien_afa_rueckgaengig);

  // Other income
  const sonstigeGesamt =
    parseNum(formData.zeile17_sonstige_einkunfte) +
    parseNum(formData.zeile18_wiederkehrende_bezuege) +
    parseNum(formData.zeile19_unterhaltsleistungen) +
    parseNum(formData.zeile20_abgeordnetenbezuege);

  const grandTotal = steuerpflichtigPrivat + Math.max(0, spekulationsgewinn) + sonstigeGesamt;

  const handleSave = () => {
    toast({ title: "Anlage SO gespeichert", description: "Die Daten wurden erfolgreich gespeichert." });
  };

  const renderFormField = (
    label: string,
    field: keyof SOFormData,
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
    <MainLayout title="Anlage SO">
      <div className="space-y-6">
        <PageHeader
          title="Anlage SO - Sonstige Einkunfte"
          subtitle="Private Veraeusserungsgeschaefte und sonstige Einkunfte"
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Formulare", href: "/steuern/formulare" },
            { label: "Anlage SO" },
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
          <AlertTitle>Hinweis zur Anlage SO</AlertTitle>
          <AlertDescription>
            Die Anlage SO ist relevant fur private Veraeusserungsgeschaefte (z.B. Immobilienverkauf innerhalb von 10 Jahren)
            sowie fur sonstige Einkunfte. Bei privaten Veraeusserungsgeschaeften gilt eine Freigrenze von 600 € pro Jahr.
          </AlertDescription>
        </Alert>

        {/* Section 1: Private Veraeusserungsgeschaefte (Zeile 2-10) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Private Veraeusserungsgeschaefte (Zeile 2-10)
            </CardTitle>
            <CardDescription>
              Veraeusserung von Immobilien innerhalb von 10 Jahren und sonstige Wirtschaftsgueter innerhalb von 1 Jahr
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderFormField(
              "Veraeusserungspreis Immobilien",
              "zeile2_veraeusserungspreis_immobilien",
              "Z.2",
              "Verkaufspreis der Immobilie(n)"
            )}
            {renderFormField(
              "Anschaffungskosten Immobilien",
              "zeile3_anschaffungskosten_immobilien",
              "Z.3",
              "Ursprungliche Anschaffungskosten inkl. Nebenkosten"
            )}
            {renderFormField(
              "Werbungskosten der Veraeusserung",
              "zeile4_werbungskosten_veraeusserung",
              "Z.4",
              "Maklergebuhren, Notarkosten, etc."
            )}

            <Separator className="my-2" />

            {renderFormField(
              "Veraeusserungspreis andere Wirtschaftsgueter",
              "zeile5_veraeusserungspreis_andere",
              "Z.5",
              "z.B. Kryptowahrungen, Kunst, Edelmetalle"
            )}
            {renderFormField(
              "Anschaffungskosten andere Wirtschaftsgueter",
              "zeile6_anschaffungskosten_andere",
              "Z.6"
            )}
            {renderFormField(
              "Verluste aus Vorjahren",
              "zeile8_verluste_vorjahre",
              "Z.8",
              "Verlustvortrag aus privaten Veraeusserungsgeschaeften"
            )}

            <Separator />

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1"></div>
              <div className="col-span-7">
                <span className="font-medium">Gewinn aus privaten Veraeusserungsgeschaeften</span>
                <p className="text-xs text-muted-foreground">
                  {privateVeraeusserungGesamt <= freigrenze && privateVeraeusserungGesamt > 0
                    ? `Unter Freigrenze von ${freigrenze} € - steuerfrei`
                    : `Uber Freigrenze - voll steuerpflichtig`
                  }
                </p>
              </div>
              <div className="col-span-4 text-right font-mono font-bold text-lg">
                {privateVeraeusserungGesamt.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Spekulationsgewinne (Zeile 11-16) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Spekulationsgewinne Immobilien (Zeile 11-16)
            </CardTitle>
            <CardDescription>
              Gewinn aus Immobilienverkauf innerhalb der 10-Jahres-Frist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderFormField(
              "Verkaufspreis der Immobilie",
              "zeile11_immobilien_verkaufspreis",
              "Z.11"
            )}
            {renderFormField(
              "Anschaffungspreis der Immobilie",
              "zeile12_immobilien_anschaffungspreis",
              "Z.12",
              "Kaufpreis + Grunderwerbsteuer + Notarkosten"
            )}
            {renderFormField(
              "Veraeusserungsnebenkosten",
              "zeile13_immobilien_nebenkosten",
              "Z.13",
              "Maklergebuhren, Notar, etc."
            )}
            {renderFormField(
              "AfA-Ruckgangigmachung",
              "zeile14_immobilien_afa_rueckgaengig",
              "Z.14",
              "In Anspruch genommene AfA erhoht den Gewinn"
            )}
            {renderFormField(
              "Verlustverrechnung",
              "zeile16_verlustverrechnung",
              "Z.16",
              "Verrechenbare Verluste aus anderen Spekulationsgeschaeften"
            )}

            <Separator />

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1"></div>
              <div className="col-span-7">
                <span className="font-medium">Spekulationsgewinn</span>
              </div>
              <div className="col-span-4 text-right font-mono font-bold text-lg">
                {spekulationsgewinn.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Sonstige Einkunfte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Sonstige Einkunfte (Zeile 17-20)
            </CardTitle>
            <CardDescription>
              Wiederkehrende Bezuge und ubrige sonstige Einkunfte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderFormField(
              "Sonstige Einkunfte",
              "zeile17_sonstige_einkunfte",
              "Z.17"
            )}
            {renderFormField(
              "Wiederkehrende Bezuge",
              "zeile18_wiederkehrende_bezuege",
              "Z.18",
              "z.B. Renten aus privaten Vertraegen"
            )}
            {renderFormField(
              "Erhaltene Unterhaltsleistungen",
              "zeile19_unterhaltsleistungen",
              "Z.19",
              "Gemaess § 22 Nr. 1a EStG"
            )}
            {renderFormField(
              "Abgeordnetenbezuge",
              "zeile20_abgeordnetenbezuege",
              "Z.20"
            )}

            <Separator />

            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1"></div>
              <div className="col-span-7">
                <span className="font-medium">Summe sonstige Einkunfte</span>
              </div>
              <div className="col-span-4 text-right font-mono font-bold text-lg">
                {sonstigeGesamt.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totals Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Zusammenfassung Anlage SO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Private Veraeusserungsgeschaefte (steuerpflichtig)</span>
                <span className="font-mono font-medium">
                  {steuerpflichtigPrivat.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Spekulationsgewinne Immobilien</span>
                <span className="font-mono font-medium">
                  {Math.max(0, spekulationsgewinn).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Sonstige Einkunfte</span>
                <span className="font-mono font-medium">
                  {sonstigeGesamt.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border-2 border-primary rounded-lg">
                <span className="font-medium">Gesamte sonstige Einkunfte (Anlage SO)</span>
                <span className="font-mono font-bold text-lg text-primary">
                  {grandTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
