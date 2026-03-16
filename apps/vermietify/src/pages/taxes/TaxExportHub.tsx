import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  Eye,
  Loader2,
  CheckCircle2,
  Euro,
  TrendingDown,
  Receipt,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

interface ExportOption {
  id: string;
  format: "pdf" | "csv" | "datev";
  label: string;
  description: string;
  icon: typeof FileText;
  dataTypes: string[];
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: "pdf_summary",
    format: "pdf",
    label: "Steuerubersicht (PDF)",
    description: "Zusammenfassung aller Einkunfte, Absetzungen und geschatzter Steuerlast als PDF-Dokument",
    icon: FileText,
    dataTypes: ["Einkunfte", "Werbungskosten", "AfA", "Ergebnis"],
  },
  {
    id: "pdf_anlage_v",
    format: "pdf",
    label: "Anlage V Vorbereitung (PDF)",
    description: "Vorausgefullte Anlage V mit allen Mieteinnahmen und Werbungskosten pro Objekt",
    icon: FileText,
    dataTypes: ["Mieteinnahmen", "Werbungskosten", "AfA", "Objekte"],
  },
  {
    id: "csv_income",
    format: "csv",
    label: "Einnahmen-Export (CSV)",
    description: "Alle Mieteinnahmen als CSV-Datei fur die Weiterverarbeitung in Excel oder anderen Programmen",
    icon: FileSpreadsheet,
    dataTypes: ["Mieteinnahmen", "Nebenkosten", "Sondereinnahmen"],
  },
  {
    id: "csv_expenses",
    format: "csv",
    label: "Ausgaben-Export (CSV)",
    description: "Alle Werbungskosten und Absetzungen als CSV-Datei mit Kategoriezuordnung",
    icon: FileSpreadsheet,
    dataTypes: ["Werbungskosten", "AfA", "Reparaturen", "Versicherungen"],
  },
  {
    id: "csv_complete",
    format: "csv",
    label: "Komplettexport (CSV)",
    description: "Alle steuerrelevanten Daten in einer umfassenden CSV-Datei",
    icon: FileSpreadsheet,
    dataTypes: ["Einnahmen", "Ausgaben", "Objekte", "Mieter", "Belege"],
  },
  {
    id: "datev_export",
    format: "datev",
    label: "DATEV-Export",
    description: "Export im DATEV-Format fur die direkte Ubernahme durch Ihren Steuerberater",
    icon: Database,
    dataTypes: ["Buchungsstapel", "Sachkonten", "Belegdaten"],
  },
];

const FORMAT_COLORS: Record<string, string> = {
  pdf: "bg-red-100 text-red-800",
  csv: "bg-green-100 text-green-800",
  datev: "bg-blue-100 text-blue-800",
};

interface PreviewRow {
  label: string;
  value: string;
  type: "income" | "expense" | "result";
}

const PREVIEW_DATA: PreviewRow[] = [
  { label: "Kaltmieten gesamt", value: "48.000,00 €", type: "income" },
  { label: "Nebenkostenvorauszahlungen", value: "12.000,00 €", type: "income" },
  { label: "Summe Einnahmen", value: "60.000,00 €", type: "income" },
  { label: "AfA (Abschreibung)", value: "-6.000,00 €", type: "expense" },
  { label: "Schuldzinsen", value: "-8.400,00 €", type: "expense" },
  { label: "Instandhaltung", value: "-3.200,00 €", type: "expense" },
  { label: "Versicherungen", value: "-1.800,00 €", type: "expense" },
  { label: "Verwaltungskosten", value: "-2.400,00 €", type: "expense" },
  { label: "Summe Werbungskosten", value: "-21.800,00 €", type: "expense" },
  { label: "Einkunfte aus V+V", value: "38.200,00 €", type: "result" },
  { label: "Geschatzte Steuer (30%)", value: "11.460,00 €", type: "result" },
];

export default function TaxExportHub() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showPreview, setShowPreview] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (option: ExportOption) => {
    setExportingId(option.id);
    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setExportingId(null);
    toast({
      title: "Export erfolgreich",
      description: `${option.label} fur ${selectedYear} wurde erstellt.`,
    });
  };

  return (
    <MainLayout title="Export">
      <div className="space-y-6">
        <PageHeader
          title="Steuer-Export"
          subtitle="Steuerdaten in verschiedenen Formaten exportieren"
          breadcrumbs={[
            { label: "Steuern", href: "/steuern" },
            { label: "Export" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Vorschau ausblenden" : "Vorschau anzeigen"}
              </Button>
            </div>
          }
        />

        {/* Preview Section */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Datenvorschau {selectedYear}
              </CardTitle>
              <CardDescription>
                Vorschau der zu exportierenden Steuerdaten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PREVIEW_DATA.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.type === "income" && <Euro className="h-4 w-4 text-green-600" />}
                          {row.type === "expense" && <TrendingDown className="h-4 w-4 text-red-600" />}
                          {row.type === "result" && <Receipt className="h-4 w-4 text-primary" />}
                          <span className={row.type === "result" ? "font-bold" : ""}>
                            {row.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-mono ${
                        row.type === "income" ? "text-green-600" :
                        row.type === "expense" ? "text-red-600" :
                        "font-bold text-primary"
                      }`}>
                        {row.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Export Options */}
        <div className="grid gap-4 md:grid-cols-2">
          {EXPORT_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const isExporting = exportingId === option.id;

            return (
              <Card key={option.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                        <OptionIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{option.label}</CardTitle>
                        <Badge variant="outline" className={`mt-1 ${FORMAT_COLORS[option.format]}`}>
                          {option.format.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {option.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {option.dataTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleExport(option)}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exportiere...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Exportieren
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
