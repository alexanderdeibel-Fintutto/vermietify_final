import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Columns,
  Eye,
  Loader2,
  X,
  Table,
  MapPin,
} from "lucide-react";

type ImportStep = 1 | 2 | 3 | 4;

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

export default function UniversalImport() {
  const [currentStep, setCurrentStep] = useState<ImportStep>(1);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  const steps = [
    { number: 1, label: "Datei hochladen", icon: Upload },
    { number: 2, label: "Felder zuordnen", icon: MapPin },
    { number: 3, label: "Vorschau", icon: Eye },
    { number: 4, label: "Import", icon: CheckCircle },
  ];

  // Mock detected columns from uploaded file
  const detectedColumns = [
    "Vorname", "Nachname", "E-Mail", "Telefon", "Straße", "PLZ", "Ort", "Einzugsdatum",
  ];

  // Mock target fields
  const targetFields = [
    { value: "first_name", label: "Vorname" },
    { value: "last_name", label: "Nachname" },
    { value: "email", label: "E-Mail" },
    { value: "phone", label: "Telefon" },
    { value: "street", label: "Straße" },
    { value: "zip", label: "PLZ" },
    { value: "city", label: "Ort" },
    { value: "move_in_date", label: "Einzugsdatum" },
    { value: "skip", label: "-- Überspringen --" },
  ];

  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>(
    detectedColumns.map((col, i) => ({
      sourceColumn: col,
      targetField: targetFields[i]?.value || "skip",
    }))
  );

  // Mock preview data
  const previewData = [
    { Vorname: "Max", Nachname: "Müller", "E-Mail": "max@example.de", Telefon: "0171-1234567", "Straße": "Hauptstr. 1", PLZ: "10115", Ort: "Berlin", Einzugsdatum: "01.03.2026" },
    { Vorname: "Anna", Nachname: "Schmidt", "E-Mail": "anna@example.de", Telefon: "0172-9876543", "Straße": "Parkweg 5", PLZ: "80331", Ort: "München", Einzugsdatum: "15.04.2026" },
    { Vorname: "Peter", Nachname: "Fischer", "E-Mail": "peter@example.de", Telefon: "0173-5551234", "Straße": "Seestr. 12", PLZ: "20095", Ort: "Hamburg", Einzugsdatum: "01.05.2026" },
    { Vorname: "Lisa", Nachname: "Weber", "E-Mail": "lisa@example.de", Telefon: "0174-3339876", "Straße": "Bergallee 3", PLZ: "50667", Ort: "Köln", Einzugsdatum: "01.06.2026" },
    { Vorname: "Thomas", Nachname: "Bauer", "E-Mail": "thomas@example.de", Telefon: "0175-7772468", "Straße": "Waldring 7", PLZ: "70173", Ort: "Stuttgart", Einzugsdatum: "15.06.2026" },
  ];

  const handleFileSelect = () => {
    setUploadedFile("mieter_import_2026.csv");
  };

  const updateMapping = (index: number, targetField: string) => {
    setColumnMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, targetField } : m))
    );
  };

  const handleStartImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImportComplete(true);
    }, 2000);
  };

  const goToStep = (step: ImportStep) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  };

  return (
    <MainLayout title="Universeller Import">
      <div className="space-y-6">
        <PageHeader
          title="Universeller Import"
          subtitle="Importieren Sie Daten Schritt für Schritt in Ihr System"
          breadcrumbs={[
            { label: "Daten", href: "/data" },
            { label: "Import/Export", href: "/data/import-export" },
            { label: "Import" },
          ]}
        />

        {/* Step Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        currentStep > step.number
                          ? "bg-primary border-primary text-primary-foreground"
                          : currentStep === step.number
                          ? "border-primary text-primary bg-primary/10"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.number ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 mt-[-1.25rem] ${
                        currentStep > step.number ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: File Upload */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Schritt 1: Datei hochladen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!uploadedFile ? (
                <div
                  className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={handleFileSelect}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Datei hierher ziehen oder klicken</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Unterstützte Formate: CSV, Excel (.xlsx, .xls), JSON
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximale Dateigröße: 50 MB
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileSpreadsheet className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{uploadedFile}</p>
                      <p className="text-xs text-muted-foreground">
                        CSV-Datei - 8 Spalten erkannt - 48 Zeilen
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUploadedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Datei erfolgreich gelesen</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => goToStep(2)}
                  disabled={!uploadedFile}
                >
                  Weiter
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Column Mapping */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Columns className="h-5 w-5" />
                Schritt 2: Felder zuordnen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Ordnen Sie die Spalten aus Ihrer Datei den Feldern im System zu. Spalten, die
                nicht zugeordnet werden, werden übersprungen.
              </p>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Spalte in Datei</span>
                  <span className="text-sm font-medium text-muted-foreground">Zielfeld</span>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                </div>
                {columnMappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 items-center py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{mapping.sourceColumn}</Badge>
                    </div>
                    <Select
                      value={mapping.targetField}
                      onValueChange={(value) => updateMapping(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {targetFields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div>
                      {mapping.targetField === "skip" ? (
                        <Badge variant="secondary">Übersprungen</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Zugeordnet
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => goToStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {columnMappings.filter((m) => m.targetField !== "skip").length} von{" "}
                    {columnMappings.length} Feldern zugeordnet
                  </span>
                  <Button onClick={() => goToStep(3)}>
                    Weiter
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preview */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Schritt 3: Vorschau
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Vorschau der ersten {previewData.length} Zeilen</p>
                  <p className="text-xs text-muted-foreground">
                    Überprüfen Sie die Daten vor dem Import. Insgesamt werden 48 Zeilen importiert.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">#</th>
                      {detectedColumns.map((col) => (
                        <th key={col} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2 px-3 text-xs text-muted-foreground">{i + 1}</td>
                        {detectedColumns.map((col) => (
                          <td key={col} className="py-2 px-3 text-sm">
                            {row[col as keyof typeof row] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">48</p>
                  <p className="text-xs text-muted-foreground">Zeilen gesamt</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">46</p>
                  <p className="text-xs text-muted-foreground">Gültige Zeilen</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">2</p>
                  <p className="text-xs text-muted-foreground">Fehlerhafte Zeilen</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => goToStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
                <Button onClick={() => goToStep(4)}>
                  Import starten
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Import */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Schritt 4: Import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!importing && !importComplete && (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Bereit zum Import</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    46 gültige Datensätze werden importiert. 2 fehlerhafte Zeilen werden übersprungen.
                  </p>
                  <div className="mt-6">
                    <Button onClick={handleStartImport} size="lg">
                      <Upload className="h-4 w-4 mr-2" />
                      Import jetzt starten
                    </Button>
                  </div>
                </div>
              )}

              {importing && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <p className="text-lg font-medium">Import läuft...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Bitte warten Sie, während die Daten importiert werden.
                  </p>
                  <div className="mt-6 max-w-md mx-auto">
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-primary rounded-full h-3 w-2/3 transition-all duration-1000" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      30 von 46 Datensätzen verarbeitet...
                    </p>
                  </div>
                </div>
              )}

              {importComplete && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="text-lg font-medium">Import abgeschlossen</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    46 Datensätze wurden erfolgreich importiert.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto">
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-xl font-bold text-green-600">46</p>
                      <p className="text-xs text-muted-foreground">Importiert</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <p className="text-xl font-bold text-red-600">2</p>
                      <p className="text-xs text-muted-foreground">Übersprungen</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-xl font-bold">48</p>
                      <p className="text-xs text-muted-foreground">Gesamt</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button variant="outline" onClick={() => {
                      setCurrentStep(1);
                      setUploadedFile(null);
                      setImportComplete(false);
                    }}>
                      Neuen Import starten
                    </Button>
                    <Button>
                      Importierte Daten anzeigen
                    </Button>
                  </div>
                </div>
              )}

              {!importing && !importComplete && (
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => goToStep(3)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
