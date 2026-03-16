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
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Building2,
  Users,
  FileCheck,
  CreditCard,
  HardDrive,
} from "lucide-react";

export default function ImportExportHub() {
  const [exportDataType, setExportDataType] = useState("gebaeude");
  const [exportFormat, setExportFormat] = useState("csv");

  const importHistory = [
    { id: 1, filename: "mieter_2026.csv", type: "Mieter", rows: 48, status: "success", date: "14.02.2026 10:30" },
    { id: 2, filename: "gebaeude_import.xlsx", type: "Gebäude", rows: 12, status: "success", date: "12.02.2026 14:15" },
    { id: 3, filename: "zahlungen_jan.csv", type: "Zahlungen", rows: 156, status: "error", date: "10.02.2026 09:45" },
    { id: 4, filename: "vertraege_export.json", type: "Verträge", rows: 35, status: "success", date: "08.02.2026 16:20" },
  ];

  const recentActivity = [
    { action: "Export", detail: "Gebäude als CSV exportiert", time: "Vor 2 Stunden", icon: Download },
    { action: "Import", detail: "48 Mieter aus CSV importiert", time: "Vor 5 Stunden", icon: Upload },
    { action: "Export", detail: "Zahlungen als Excel exportiert", time: "Gestern, 16:30", icon: Download },
    { action: "Import", detail: "12 Gebäude aus Excel importiert", time: "Vor 3 Tagen", icon: Upload },
    { action: "Export", detail: "Verträge als JSON exportiert", time: "Vor 5 Tagen", icon: Download },
  ];

  const handleExport = () => {
    console.log(`Exporting ${exportDataType} as ${exportFormat}`);
  };

  const handleImportClick = () => {
    console.log("Opening universal import wizard");
  };

  return (
    <MainLayout title="Daten Import/Export">
      <div className="space-y-6">
        <PageHeader
          title="Daten Import/Export"
          subtitle="Importieren und exportieren Sie Ihre Immobiliendaten in verschiedenen Formaten"
          breadcrumbs={[
            { label: "Daten", href: "/data" },
            { label: "Import/Export" },
          ]}
        />

        {/* Import & Export Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Daten importieren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={handleImportClick}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Datei hochladen oder hierher ziehen</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Klicken Sie hier, um den Import-Assistenten zu starten
                </p>
              </div>

              {/* Supported Formats */}
              <div>
                <p className="text-sm font-medium mb-3">Unterstützte Formate:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">CSV</p>
                      <p className="text-xs text-muted-foreground">.csv</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Excel</p>
                      <p className="text-xs text-muted-foreground">.xlsx, .xls</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <FileJson className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">JSON</p>
                      <p className="text-xs text-muted-foreground">.json</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handleImportClick}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Import-Assistent starten
              </Button>
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Daten exportieren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Type Selection */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Datentyp auswählen:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "gebaeude", label: "Gebäude", icon: Building2, count: 12 },
                    { value: "mieter", label: "Mieter", icon: Users, count: 48 },
                    { value: "vertraege", label: "Verträge", icon: FileCheck, count: 35 },
                    { value: "zahlungen", label: "Zahlungen", icon: CreditCard, count: 1240 },
                  ].map((item) => (
                    <div
                      key={item.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        exportDataType === item.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      }`}
                      onClick={() => setExportDataType(item.value)}
                    >
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.count} Einträge</p>
                      </div>
                      {exportDataType === item.value && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Exportformat:</p>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="json">JSON (.json)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Import History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Importverlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dateiname</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Typ</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Zeilen</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.filename}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{item.type}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{item.rows}</span>
                      </td>
                      <td className="py-3 px-4">
                        {item.status === "success" ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Erfolgreich
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Fehlgeschlagen
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">{item.date}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Letzte Aktivitäten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    activity.action === "Import" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                  }`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.detail}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge variant="outline">{activity.action}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
