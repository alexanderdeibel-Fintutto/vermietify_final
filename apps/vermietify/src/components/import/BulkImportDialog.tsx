import { useState, useCallback } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Loader2, Sparkles, Check, AlertTriangle } from "lucide-react";
import {
  type ImportType, type Step, type ImportCount,
  type ExtractedUnit, type ExtractedBuilding, type ExtractedTenant, type ExtractedContract,
  type BulkImportDialogProps,
  TYPE_LABELS, TYPE_DESCRIPTIONS,
} from "./types";
import {
  UnitsPreviewTable, BuildingsPreviewTable,
  TenantsPreviewTable, ContractsPreviewTable,
} from "./PreviewTables";
import { consolidateTenants, consolidateContracts } from "./consolidation";
import { parseSpreadsheet } from "./csvParser";

// ─── Helpers ───
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function isSpreadsheet(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "csv" || ext === "xlsx" || ext === "xls";
}

export function BulkImportDialog({
  open, onOpenChange, type, buildingId, organizationId, onSuccess,
}: BulkImportDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedUnits, setExtractedUnits] = useState<ExtractedUnit[]>([]);
  const [extractedBuildings, setExtractedBuildings] = useState<ExtractedBuilding[]>([]);
  const [extractedTenants, setExtractedTenants] = useState<ExtractedTenant[]>([]);
  const [extractedContracts, setExtractedContracts] = useState<ExtractedContract[]>([]);
  const [importCount, setImportCount] = useState<ImportCount>({ success: 0, failed: 0, skipped: 0 });

  // For contract import: resolution selects
  const [availableTenants, setAvailableTenants] = useState<{ id: string; name: string }[]>([]);
  const [availableUnits, setAvailableUnits] = useState<{ id: string; label: string }[]>([]);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setIsExtracting(false);
    setExtractedUnits([]);
    setExtractedBuildings([]);
    setExtractedTenants([]);
    setExtractedContracts([]);
    setImportCount({ success: 0, failed: 0, skipped: 0 });
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  // ─── File handling ───
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split(".").pop()?.toLowerCase();
    const validExts = ["pdf", "csv", "txt", "xlsx"];
    if (!validExts.includes(ext || "")) {
      toast({ title: "Ungültiges Dateiformat", description: "PDF, CSV oder Textdatei erlaubt.", variant: "destructive" });
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Max. 10 MB.", variant: "destructive" });
      return;
    }
    setFile(selected);
  };

  // ─── Extraction: AI for PDFs, direct parsing for CSV/XLSX ───
  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);

    try {
      let extractedData: any[];

      if (isSpreadsheet(file)) {
        // ── Direct CSV/XLSX parsing (no AI needed) ──
        const buffer = await readFileAsArrayBuffer(file);
        const result = parseSpreadsheet(buffer, type, file.name);
        if (!result.success) {
          throw new Error((result as { success: false; error: string }).error);
        }
        extractedData = (result as { success: true; data: any[] }).data;
      } else {
        // ── AI extraction for PDFs and text files ──
        const buffer = await readFileAsArrayBuffer(file);
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

        let body: Record<string, any>;
        if (isPdf) {
          // Send PDF as proper multimodal content (base64 data URL)
          const base64 = arrayBufferToBase64(buffer);
          body = { type, fileBase64: base64, mimeType: "application/pdf" };
        } else {
          // Plain text file
          const decoder = new TextDecoder("utf-8");
          const textContent = decoder.decode(buffer);
          body = { type, content: textContent };
        }

        const { data, error } = await supabase.functions.invoke("extract-import-data", {
          body,
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Extraktion fehlgeschlagen. Bitte prüfen Sie, ob die Datei relevante Daten enthält.");
        extractedData = data.data;
      }

      // Set extracted data and run consolidation for tenants/contracts
      if (type === "units") {
        setExtractedUnits((extractedData as ExtractedUnit[]).map((u) => ({ ...u, _selected: true })));
        setStep("preview");
      } else if (type === "buildings") {
        setExtractedBuildings((extractedData as ExtractedBuilding[]).map((b) => ({ ...b, _selected: true })));
        setStep("preview");
      } else if (type === "tenants") {
        const consolidated = await consolidateTenants(
          (extractedData as ExtractedTenant[]).map((t) => ({ ...t, _selected: true }))
        );
        setExtractedTenants(consolidated);
        const hasDuplicates = consolidated.some((t) => t._existingMatch);
        setStep(hasDuplicates ? "consolidation" : "preview");
      } else if (type === "contracts") {
        const rawContracts = (extractedData as ExtractedContract[]).map((c) => ({ ...c, _selected: true }));
        const consolidated = await consolidateContracts(rawContracts);
        setExtractedContracts(consolidated);

        // Load available tenants and units for manual resolution
        const [{ data: tenants }, { data: units }] = await Promise.all([
          supabase.from("tenants").select("id, first_name, last_name"),
          supabase.from("units").select("id, unit_number"),
        ]);
        setAvailableTenants((tenants || []).map((t: any) => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })));
        setAvailableUnits((units || []).map((u: any) => ({ id: u.id, label: u.unit_number })));

        const hasUnresolved = consolidated.some((c) => c._needsTenantResolution || c._needsUnitResolution);
        setStep(hasUnresolved ? "consolidation" : "preview");
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      toast({ title: "Extraktion fehlgeschlagen", description: err.message || "Daten konnten nicht extrahiert werden.", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  // ─── Toggle selection ───
  const toggleItem = (index: number) => {
    if (type === "units") setExtractedUnits((prev) => prev.map((u, i) => (i === index ? { ...u, _selected: !u._selected } : u)));
    else if (type === "buildings") setExtractedBuildings((prev) => prev.map((b, i) => (i === index ? { ...b, _selected: !b._selected } : b)));
    else if (type === "tenants") setExtractedTenants((prev) => prev.map((t, i) => (i === index ? { ...t, _selected: !t._selected } : t)));
    else if (type === "contracts") setExtractedContracts((prev) => prev.map((c, i) => (i === index ? { ...c, _selected: !c._selected } : c)));
  };

  const toggleAll = () => {
    if (type === "units") {
      const all = extractedUnits.every((u) => u._selected);
      setExtractedUnits((prev) => prev.map((u) => ({ ...u, _selected: !all })));
    } else if (type === "buildings") {
      const all = extractedBuildings.every((b) => b._selected);
      setExtractedBuildings((prev) => prev.map((b) => ({ ...b, _selected: !all })));
    } else if (type === "tenants") {
      const all = extractedTenants.every((t) => t._selected);
      setExtractedTenants((prev) => prev.map((t) => ({ ...t, _selected: !all })));
    } else if (type === "contracts") {
      const all = extractedContracts.every((c) => c._selected);
      setExtractedContracts((prev) => prev.map((c) => ({ ...c, _selected: !all })));
    }
  };

  // ─── Tenant consolidation action change ───
  const setTenantAction = (index: number, action: "create" | "skip" | "update") => {
    setExtractedTenants((prev) =>
      prev.map((t, i) => (i === index ? { ...t, _action: action } : t))
    );
  };

  // ─── Contract resolution ───
  const setContractTenant = (index: number, tenantId: string) => {
    const tenant = availableTenants.find((t) => t.id === tenantId);
    setExtractedContracts((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, _matchedTenantId: tenantId, _matchedTenantName: tenant?.name || null, _needsTenantResolution: false }
          : c
      )
    );
  };

  const setContractUnit = (index: number, unitId: string) => {
    const unit = availableUnits.find((u) => u.id === unitId);
    setExtractedContracts((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, _matchedUnitId: unitId, _matchedUnitLabel: unit?.label || null, _needsUnitResolution: false }
          : c
      )
    );
  };

  // ─── Import ───
  const handleImport = async () => {
    setStep("importing");
    let success = 0;
    let failed = 0;
    let skipped = 0;

    try {
      if (type === "units") {
        for (const unit of extractedUnits.filter((u) => u._selected)) {
          const { error } = await supabase.from("units").insert({
            building_id: buildingId!,
            unit_number: unit.unit_number || "Unbekannt",
            floor: unit.floor ?? null,
            area: unit.area ?? 0,
            rooms: unit.rooms ?? 1,
            rent_amount: unit.rent_amount ?? 0,
            utility_advance: unit.utility_advance ?? 0,
            status: (unit.status as any) || "vacant",
            notes: unit.notes ?? null,
          });
          if (error) { console.error(error); failed++; } else { success++; }
        }
      } else if (type === "buildings") {
        for (const b of extractedBuildings.filter((b) => b._selected)) {
          const { error } = await supabase.from("buildings").insert({
            organization_id: organizationId!,
            name: b.name || "Unbenannt",
            address: b.address || "",
            postal_code: b.postal_code || "",
            city: b.city || "",
            building_type: (b.building_type as any) || "apartment",
            year_built: b.year_built ?? null,
            total_area: b.total_area ?? null,
            notes: b.notes ?? null,
          });
          if (error) { console.error(error); failed++; } else { success++; }
        }
      } else if (type === "tenants") {
        for (const t of extractedTenants.filter((t) => t._selected)) {
          if (t._action === "skip") {
            skipped++;
            continue;
          }
          if (t._action === "update" && t._existingMatch) {
            const { error } = await supabase.from("tenants").update({
              email: t.email || undefined,
              phone: t.phone || undefined,
              address: t.address || undefined,
              city: t.city || undefined,
              postal_code: t.postal_code || undefined,
              notes: t.notes || undefined,
            }).eq("id", t._existingMatch.id);
            if (error) { console.error(error); failed++; } else { success++; }
          } else {
            const { error } = await supabase.from("tenants").insert({
              organization_id: organizationId!,
              first_name: t.first_name,
              last_name: t.last_name,
              email: t.email || null,
              phone: t.phone || null,
              address: t.address || null,
              city: t.city || null,
              postal_code: t.postal_code || null,
              notes: t.notes || null,
            });
            if (error) { console.error(error); failed++; } else { success++; }
          }
        }
      } else if (type === "contracts") {
        for (const c of extractedContracts.filter((c) => c._selected)) {
          if (!c._matchedTenantId || !c._matchedUnitId) {
            skipped++;
            continue;
          }
          const { error } = await supabase.from("leases").insert({
            tenant_id: c._matchedTenantId,
            unit_id: c._matchedUnitId,
            start_date: c.start_date || new Date().toISOString().split("T")[0],
            end_date: c.end_date || null,
            rent_amount: c.rent_amount ?? 0,
            utility_advance: c.utility_advance ?? 0,
            deposit_amount: c.deposit_amount ?? 0,
            payment_day: c.payment_day ?? 1,
            is_active: true,
            notes: c.notes || null,
          });
          if (error) { console.error(error); failed++; } else { success++; }
        }
      }

      setImportCount({ success, failed, skipped });
      setStep("done");
      if (success > 0) onSuccess?.();
    } catch (err) {
      console.error("Import error:", err);
      toast({ title: "Import-Fehler", description: "Beim Import ist ein Fehler aufgetreten.", variant: "destructive" });
      setStep("preview");
    }
  };

  // ─── Computed ───
  const getSelectedCount = () => {
    if (type === "units") return extractedUnits.filter((u) => u._selected).length;
    if (type === "buildings") return extractedBuildings.filter((b) => b._selected).length;
    if (type === "tenants") return extractedTenants.filter((t) => t._selected && t._action !== "skip").length;
    if (type === "contracts") return extractedContracts.filter((c) => c._selected).length;
    return 0;
  };

  const getTotalCount = () => {
    if (type === "units") return extractedUnits.length;
    if (type === "buildings") return extractedBuildings.length;
    if (type === "tenants") return extractedTenants.length;
    if (type === "contracts") return extractedContracts.length;
    return 0;
  };

  const hasUnresolvedContracts = extractedContracts.some(
    (c) => c._selected && (c._needsTenantResolution || c._needsUnitResolution)
  );

  const selectedCount = getSelectedCount();
  const totalCount = getTotalCount();
  const label = TYPE_LABELS[type];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {label} importieren
          </DialogTitle>
          <DialogDescription>{TYPE_DESCRIPTIONS[type]}</DialogDescription>
        </DialogHeader>

        {/* ─── Step: Upload ─── */}
        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("bulk-import-file")?.click()}
            >
              <Input id="bulk-import-file" type="file" accept=".pdf,.csv,.txt,.xlsx" className="hidden" onChange={handleFileChange} />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  <Badge variant="secondary">Bereit zur Analyse</Badge>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Datei hierher ziehen oder klicken</p>
                  <p className="text-sm text-muted-foreground">PDF, CSV oder Textdatei (max. 10 MB)</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Abbrechen</Button>
              <Button onClick={handleExtract} disabled={!file || isExtracting}>
                {isExtracting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{file && isSpreadsheet(file) ? "Wird geparst..." : "KI analysiert..."}</>
                ) : file && isSpreadsheet(file) ? (
                  <><FileText className="h-4 w-4 mr-2" />Datei einlesen</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Mit KI analysieren</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ─── Step: Consolidation (tenants/contracts) ─── */}
        {step === "consolidation" && (
          <div className="space-y-4 py-4">
            {type === "tenants" && (
              <>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Bestehende Mieter erkannt
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Einige importierte Mieter existieren bereits. Wählen Sie für jeden Duplikat eine Aktion.
                  </p>
                </div>
                <div className="space-y-3 max-h-[50vh] overflow-auto">
                  {extractedTenants.filter((t) => t._existingMatch).map((t, idx) => {
                    const realIndex = extractedTenants.indexOf(t);
                    return (
                      <div key={idx} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{t.first_name} {t.last_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Import: {t.email || "–"} · {t.phone || "–"}
                            </p>
                          </div>
                          <Badge variant="outline">Existiert: {t._existingMatch!.name}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant={t._action === "skip" ? "default" : "outline"} onClick={() => setTenantAction(realIndex, "skip")}>
                            Überspringen
                          </Button>
                          <Button size="sm" variant={t._action === "update" ? "default" : "outline"} onClick={() => setTenantAction(realIndex, "update")}>
                            Daten aktualisieren
                          </Button>
                          <Button size="sm" variant={t._action === "create" ? "default" : "outline"} onClick={() => setTenantAction(realIndex, "create")}>
                            Trotzdem anlegen
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {type === "contracts" && (
              <>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Zuordnung erforderlich
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Einige Verträge konnten nicht automatisch einem Mieter oder einer Einheit zugeordnet werden. Bitte wählen Sie die richtige Zuordnung.
                  </p>
                </div>
                <div className="space-y-3 max-h-[50vh] overflow-auto">
                  {extractedContracts.filter((c) => c._needsTenantResolution || c._needsUnitResolution).map((c, idx) => {
                    const realIndex = extractedContracts.indexOf(c);
                    return (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <p className="font-medium">
                          Vertrag: {c.tenant_first_name} {c.tenant_last_name} → {c.unit_reference || "?"} ({c.building_reference || "?"})
                        </p>
                        {c._needsTenantResolution && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Mieter zuordnen:</p>
                            <Select onValueChange={(val) => setContractTenant(realIndex, val)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Mieter wählen..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTenants.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {c._needsUnitResolution && (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Einheit zuordnen:</p>
                            <Select onValueChange={(val) => setContractUnit(realIndex, val)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Einheit wählen..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableUnits.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Zurück</Button>
              <Button onClick={() => setStep("preview")}>
                Weiter zur Vorschau
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ─── Step: Preview ─── */}
        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalCount} {label} erkannt · {selectedCount} ausgewählt
              </p>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedCount === totalCount ? "Alle abwählen" : "Alle auswählen"}
              </Button>
            </div>

            <div className="border rounded-lg overflow-auto max-h-[50vh]">
              {type === "units" && <UnitsPreviewTable data={extractedUnits} onToggle={toggleItem} />}
              {type === "buildings" && <BuildingsPreviewTable data={extractedBuildings} onToggle={toggleItem} />}
              {type === "tenants" && <TenantsPreviewTable data={extractedTenants} onToggle={toggleItem} />}
              {type === "contracts" && <ContractsPreviewTable data={extractedContracts} onToggle={toggleItem} />}
            </div>

            {type === "contracts" && hasUnresolvedContracts && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠ Verträge ohne vollständige Zuordnung werden beim Import übersprungen.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                const hasConsolidation = type === "tenants" && extractedTenants.some((t) => t._existingMatch);
                const hasResolution = type === "contracts" && extractedContracts.some((c) => c._needsTenantResolution || c._needsUnitResolution);
                setStep(hasConsolidation || hasResolution ? "consolidation" : "upload");
              }}>
                Zurück
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
                <Check className="h-4 w-4 mr-2" />
                {selectedCount} {label} importieren
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ─── Step: Importing ─── */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium">Import läuft...</p>
            <p className="text-sm text-muted-foreground">Bitte warten Sie, bis alle Datensätze importiert wurden.</p>
          </div>
        )}

        {/* ─── Step: Done ─── */}
        {step === "done" && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {importCount.failed === 0 ? (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-primary" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              )}
              <div>
                <p className="text-lg font-semibold">Import abgeschlossen</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importCount.success} erfolgreich importiert
                  {importCount.skipped > 0 && <>, {importCount.skipped} übersprungen</>}
                  {importCount.failed > 0 && <>, {importCount.failed} fehlgeschlagen</>}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Schließen</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
