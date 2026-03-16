import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ScrollText,
  Download,
  Copy,
  Eye,
  Volume2,
  Trash2,
  Dog,
  Cigarette,
  Flame,
  WashingMachine,
  Baby,
  Snowflake,
  Car,
  Brush,
} from "lucide-react";

interface HausordnungSection {
  enabled: boolean;
  [key: string]: unknown;
}

interface HausordnungState {
  objektName: string;
  objektAdresse: string;
  ruhezeiten: HausordnungSection & {
    mittag: string;
    nacht: string;
    sonntagFeiertag: boolean;
  };
  treppenhausreinigung: HausordnungSection & {
    turnus: string;
  };
  muellentsorgung: HausordnungSection & {
    details: string;
  };
  haustiere: HausordnungSection & {
    regelung: string;
  };
  rauchen: HausordnungSection & {
    wohnung: boolean;
    balkon: boolean;
    gemeinschaftsflaechen: boolean;
  };
  grillen: HausordnungSection & {
    details: string;
  };
  waschmaschine: HausordnungSection & {
    zeiten: string;
  };
  spielplatz: HausordnungSection & {
    details: string;
  };
  winterdienst: HausordnungSection & {
    details: string;
  };
  parken: HausordnungSection & {
    details: string;
  };
}

export default function HausordnungGenerator() {
  const [form, setForm] = useState<HausordnungState>({
    objektName: "",
    objektAdresse: "",
    ruhezeiten: {
      enabled: true,
      mittag: "13:00 - 15:00",
      nacht: "22:00 - 06:00",
      sonntagFeiertag: true,
    },
    treppenhausreinigung: {
      enabled: true,
      turnus: "wöchentlich",
    },
    muellentsorgung: {
      enabled: true,
      details:
        "Die Mülltrennung ist einzuhalten. Die Mülltonnen sind nur zu den vorgesehenen Abfuhrterminen an die Straße zu stellen.",
    },
    haustiere: {
      enabled: true,
      regelung: "mit-genehmigung",
    },
    rauchen: {
      enabled: true,
      wohnung: true,
      balkon: true,
      gemeinschaftsflaechen: false,
    },
    grillen: {
      enabled: true,
      details:
        "Das Grillen auf dem Balkon ist nur mit Elektrogrill und unter Rücksichtnahme auf die Nachbarn gestattet.",
    },
    waschmaschine: {
      enabled: true,
      zeiten: "07:00 - 20:00 Uhr (werktags), 09:00 - 13:00 Uhr (Samstag)",
    },
    spielplatz: {
      enabled: false,
      details:
        "Der Spielplatz darf von Kindern bis 14 Jahre genutzt werden. Nutzungszeit: 08:00 - 20:00 Uhr.",
    },
    winterdienst: {
      enabled: true,
      details:
        "Die Schneeräumung und Streupflicht obliegt den Mietern im wöchentlichen Wechsel. Räumzeit: werktags bis 07:00 Uhr, Sonn- und Feiertags bis 09:00 Uhr.",
    },
    parken: {
      enabled: true,
      details:
        "Fahrzeuge dürfen nur auf den zugewiesenen Stellplätzen geparkt werden. Das Parken auf Gehwegen und Feuerwehrzufahrten ist untersagt.",
    },
  });

  const updateSection = <K extends keyof HausordnungState>(
    section: K,
    updates: Partial<HausordnungState[K]>
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  };

  const heute = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const buildPreview = (): string => {
    const sections: string[] = [];

    sections.push(
      `HAUSORDNUNG\n\nfür das Objekt: ${form.objektName || "[Objektbezeichnung]"}\n${form.objektAdresse || "[Adresse]"}\n\nStand: ${heute}`
    );

    sections.push(
      "\nDie nachstehende Hausordnung ist Bestandteil des Mietvertrages. Alle Hausbewohner sind verpflichtet, diese Hausordnung einzuhalten und dafür Sorge zu tragen, dass auch Haushaltsangehörige und Besucher sie beachten."
    );

    if (form.ruhezeiten.enabled) {
      let text = "\n§ 1 RUHEZEITEN\n";
      text += `Nachtruhe: ${form.ruhezeiten.nacht}\n`;
      text += `Mittagsruhe: ${form.ruhezeiten.mittag}\n`;
      if (form.ruhezeiten.sonntagFeiertag) {
        text +=
          "An Sonn- und Feiertagen ist ganztägig auf besondere Ruhe zu achten.";
      }
      sections.push(text);
    }

    if (form.treppenhausreinigung.enabled) {
      sections.push(
        `\n§ ${sections.length} TREPPENHAUSREINIGUNG\nDie Reinigung des Treppenhauses erfolgt im ${form.treppenhausreinigung.turnus}en Turnus durch die Mieter. Der Reinigungsplan wird vom Vermieter oder der Hausverwaltung erstellt und ist einzuhalten.`
      );
    }

    if (form.muellentsorgung.enabled) {
      sections.push(
        `\n§ ${sections.length} MÜLLENTSORGUNG\n${form.muellentsorgung.details}`
      );
    }

    if (form.haustiere.enabled) {
      const regelungText =
        form.haustiere.regelung === "erlaubt"
          ? "Die Haltung von Haustieren ist grundsätzlich gestattet, sofern keine Belästigung anderer Mieter erfolgt."
          : form.haustiere.regelung === "nicht-erlaubt"
            ? "Die Haltung von Haustieren (außer Kleintiere in artgerechter Haltung) ist nicht gestattet."
            : "Die Haltung von Haustieren bedarf der vorherigen schriftlichen Genehmigung des Vermieters. Kleintiere in artgerechter Haltung sind hiervon ausgenommen.";
      sections.push(`\n§ ${sections.length} HAUSTIERE\n${regelungText}`);
    }

    if (form.rauchen.enabled) {
      const rauchBereiche: string[] = [];
      if (form.rauchen.wohnung) rauchBereiche.push("in der eigenen Wohnung");
      if (form.rauchen.balkon) rauchBereiche.push("auf dem Balkon (unter Rücksichtnahme)");
      if (!form.rauchen.gemeinschaftsflaechen) {
        rauchBereiche.push(
          "In Gemeinschaftsflächen (Treppenhaus, Keller, Waschküche) ist das Rauchen untersagt"
        );
      }
      sections.push(
        `\n§ ${sections.length} RAUCHEN\nDas Rauchen ist gestattet: ${rauchBereiche.join("; ")}.`
      );
    }

    if (form.grillen.enabled) {
      sections.push(
        `\n§ ${sections.length} GRILLEN\n${form.grillen.details}`
      );
    }

    if (form.waschmaschine.enabled) {
      sections.push(
        `\n§ ${sections.length} WASCHMASCHINEN / TROCKNER\nDie Nutzung von Waschmaschinen und Trocknern ist in folgenden Zeiten gestattet:\n${form.waschmaschine.zeiten}`
      );
    }

    if (form.spielplatz.enabled) {
      sections.push(
        `\n§ ${sections.length} SPIELPLATZ\n${form.spielplatz.details}`
      );
    }

    if (form.winterdienst.enabled) {
      sections.push(
        `\n§ ${sections.length} SCHNEERÄUMUNG / WINTERDIENST\n${form.winterdienst.details}`
      );
    }

    if (form.parken.enabled) {
      sections.push(
        `\n§ ${sections.length} PARKEN / STELLPLÄTZE\n${form.parken.details}`
      );
    }

    sections.push(
      "\n\nDiese Hausordnung tritt mit sofortiger Wirkung in Kraft.\n\n\n_________________________\nUnterschrift Vermieter/Hausverwaltung"
    );

    return sections.join("\n");
  };

  const previewText = buildPreview();

  const enabledCount = Object.values(form).filter(
    (v) => typeof v === "object" && v !== null && "enabled" in v && v.enabled
  ).length;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewText);
  };

  const handleDownloadPDF = () => {
    const blob = new Blob([previewText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hausordnung_${form.objektName || "Objekt"}_${heute}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="Hausordnung"
      breadcrumbs={[
        { label: "Formulare", href: "/formulare" },
        { label: "Hausordnung" },
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Hausordnung erstellen"
          subtitle="Generieren Sie eine individuelle Hausordnung mit aktivierbaren Abschnitten."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-primary" />
                  Objekt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="objektName">Objektbezeichnung</Label>
                  <Input
                    id="objektName"
                    placeholder="z.B. Wohnanlage Sonnenstraße"
                    value={form.objektName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        objektName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objektAdresse">Adresse</Label>
                  <Input
                    id="objektAdresse"
                    placeholder="Sonnenstraße 10, 80331 München"
                    value={form.objektAdresse}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        objektAdresse: e.target.value,
                      }))
                    }
                  />
                </div>
                <Badge variant="secondary">
                  {enabledCount} Abschnitte aktiviert
                </Badge>
              </CardContent>
            </Card>

            {/* Ruhezeiten */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Ruhezeiten
                  </span>
                  <Switch
                    checked={form.ruhezeiten.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("ruhezeiten", { enabled: checked })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.ruhezeiten.enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mittagsruhe</Label>
                      <Input
                        value={form.ruhezeiten.mittag}
                        onChange={(e) =>
                          updateSection("ruhezeiten", {
                            mittag: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nachtruhe</Label>
                      <Input
                        value={form.ruhezeiten.nacht}
                        onChange={(e) =>
                          updateSection("ruhezeiten", {
                            nacht: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={form.ruhezeiten.sonntagFeiertag}
                      onCheckedChange={(checked) =>
                        updateSection("ruhezeiten", {
                          sonntagFeiertag: checked,
                        })
                      }
                    />
                    <Label>Sonn- und Feiertage ganztägig Ruhe</Label>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Treppenhausreinigung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Brush className="h-5 w-5" />
                    Treppenhausreinigung
                  </span>
                  <Switch
                    checked={form.treppenhausreinigung.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("treppenhausreinigung", {
                        enabled: checked,
                      })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.treppenhausreinigung.enabled && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Turnus</Label>
                    <Select
                      value={form.treppenhausreinigung.turnus}
                      onValueChange={(v) =>
                        updateSection("treppenhausreinigung", { turnus: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wöchentlich">Wöchentlich</SelectItem>
                        <SelectItem value="zweiwöchentlich">
                          Zweiwöchentlich
                        </SelectItem>
                        <SelectItem value="monatlich">Monatlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Müllentsorgung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Müllentsorgung
                  </span>
                  <Switch
                    checked={form.muellentsorgung.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("muellentsorgung", { enabled: checked })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.muellentsorgung.enabled && (
                <CardContent>
                  <Textarea
                    value={form.muellentsorgung.details}
                    onChange={(e) =>
                      updateSection("muellentsorgung", {
                        details: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </CardContent>
              )}
            </Card>

            {/* Haustiere */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Dog className="h-5 w-5" />
                    Haustiere
                  </span>
                  <Switch
                    checked={form.haustiere.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("haustiere", { enabled: checked })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.haustiere.enabled && (
                <CardContent>
                  <Select
                    value={form.haustiere.regelung}
                    onValueChange={(v) =>
                      updateSection("haustiere", { regelung: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="erlaubt">Erlaubt</SelectItem>
                      <SelectItem value="nicht-erlaubt">
                        Nicht erlaubt
                      </SelectItem>
                      <SelectItem value="mit-genehmigung">
                        Mit Genehmigung
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              )}
            </Card>

            {/* Rauchen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Cigarette className="h-5 w-5" />
                    Rauchen
                  </span>
                  <Switch
                    checked={form.rauchen.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("rauchen", { enabled: checked })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.rauchen.enabled && (
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>In der Wohnung</Label>
                    <Switch
                      checked={form.rauchen.wohnung}
                      onCheckedChange={(checked) =>
                        updateSection("rauchen", { wohnung: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auf dem Balkon</Label>
                    <Switch
                      checked={form.rauchen.balkon}
                      onCheckedChange={(checked) =>
                        updateSection("rauchen", { balkon: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Gemeinschaftsflächen</Label>
                    <Switch
                      checked={form.rauchen.gemeinschaftsflaechen}
                      onCheckedChange={(checked) =>
                        updateSection("rauchen", {
                          gemeinschaftsflaechen: checked,
                        })
                      }
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Grillen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Flame className="h-5 w-5" />
                    Grillen auf Balkon
                  </span>
                  <Switch
                    checked={form.grillen.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("grillen", { enabled: checked })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.grillen.enabled && (
                <CardContent>
                  <Textarea
                    value={form.grillen.details}
                    onChange={(e) =>
                      updateSection("grillen", { details: e.target.value })
                    }
                    rows={3}
                  />
                </CardContent>
              )}
            </Card>

            {/* Waschmaschine */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <WashingMachine className="h-5 w-5" />
                    Waschmaschinennutzung
                  </span>
                  <Switch
                    checked={form.waschmaschine.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("waschmaschine", { enabled: checked })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.waschmaschine.enabled && (
                <CardContent>
                  <div className="space-y-2">
                    <Label>Erlaubte Zeiten</Label>
                    <Input
                      value={form.waschmaschine.zeiten}
                      onChange={(e) =>
                        updateSection("waschmaschine", {
                          zeiten: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Spielplatz */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Baby className="h-5 w-5" />
                    Spielplatzregeln
                  </span>
                  <Switch
                    checked={form.spielplatz.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("spielplatz", { enabled: checked })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.spielplatz.enabled && (
                <CardContent>
                  <Textarea
                    value={form.spielplatz.details}
                    onChange={(e) =>
                      updateSection("spielplatz", { details: e.target.value })
                    }
                    rows={3}
                  />
                </CardContent>
              )}
            </Card>

            {/* Winterdienst */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Snowflake className="h-5 w-5" />
                    Schneeräumung / Winterdienst
                  </span>
                  <Switch
                    checked={form.winterdienst.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("winterdienst", { enabled: checked })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.winterdienst.enabled && (
                <CardContent>
                  <Textarea
                    value={form.winterdienst.details}
                    onChange={(e) =>
                      updateSection("winterdienst", {
                        details: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </CardContent>
              )}
            </Card>

            {/* Parken */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Parken / Stellplätze
                  </span>
                  <Switch
                    checked={form.parken.enabled}
                    onCheckedChange={(checked) =>
                      updateSection("parken", { enabled: checked })
                    }
                  />
                </CardTitle>
              </CardHeader>
              {form.parken.enabled && (
                <CardContent>
                  <Textarea
                    value={form.parken.details}
                    onChange={(e) =>
                      updateSection("parken", { details: e.target.value })
                    }
                    rows={3}
                  />
                </CardContent>
              )}
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => {}} className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                Vorschau aktualisieren
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4 lg:sticky lg:top-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vorschau</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      In Zwischenablage kopieren
                    </Button>
                    <Button size="sm" onClick={handleDownloadPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white dark:bg-gray-950 border rounded-lg p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed min-h-[600px]">
                  {previewText}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
