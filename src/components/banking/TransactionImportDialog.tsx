import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BankAccount } from "@/hooks/useBanking";
import { read, utils } from "xlsx";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: BankAccount[];
}

interface ParsedTransaction {
  booking_date: string;
  value_date?: string;
  amount_cents: number;
  counterpart_name?: string;
  counterpart_iban?: string;
  purpose?: string;
  booking_text?: string;
}

const HEADER_MAP: Record<string, string> = {
  // ── Date fields ──
  buchungstag: "booking_date",
  buchungsdatum: "booking_date",
  datum: "booking_date",
  date: "booking_date",
  "booking date": "booking_date",
  buchung: "booking_date",                          // ING
  "buchung / valuta": "booking_date",               // ING alt
  valuta: "value_date",
  valutadatum: "value_date",                        // Volksbank
  wertstellungstag: "value_date",
  wertstellung: "value_date",
  wert: "value_date",
  "value date": "value_date",

  // ── Amount ──
  betrag: "amount",
  "betrag (eur)": "amount",
  "betrag (€)": "amount",                           // DKB neu
  "betrag in €": "amount",                          // DKB alt
  "betrag in eur": "amount",
  amount: "amount",
  "amount (eur)": "amount",
  umsatz: "amount",
  "umsatz in eur": "amount",
  "umsatz in €": "amount",

  // ── Counterpart name ──
  "auftraggeber / begünstigter": "counterpart_name",  // Sparkasse
  "auftraggeber/begünstigter": "counterpart_name",
  "auftraggeber / empfänger": "counterpart_name",
  "auftraggeber/empfänger": "counterpart_name",        // ING
  auftraggeber: "counterpart_name",
  "begünstigter": "counterpart_name",
  "empfänger": "counterpart_name",
  empfaenger: "counterpart_name",
  name: "counterpart_name",
  "partner name": "counterpart_name",                  // N26
  "beguenstigter/zahlungspflichtiger": "counterpart_name",
  "zahlungspflichtige*r": "counterpart_name",          // DKB neu
  "zahlungsempfänger*in": "counterpart_name",          // DKB neu
  "zahlungsempfaenger*in": "counterpart_name",
  "name zahlungsbeteiligter": "counterpart_name",      // Volksbank
  counterpart: "counterpart_name",
  "name des partners": "counterpart_name",
  "transaktionspartner": "counterpart_name",

  // ── IBAN ──
  "kontonummer/iban": "counterpart_iban",
  iban: "counterpart_iban",
  "partner iban": "counterpart_iban",                  // N26
  "iban des auftraggebers": "counterpart_iban",
  "iban des zahlungsbeteiligten": "counterpart_iban",  // Volksbank
  "kontonr./iban": "counterpart_iban",
  "konto-nr. des auftraggebers": "counterpart_iban",
  "gläubiger-id": "_ignore",                           // ignorieren

  // ── Purpose / Verwendungszweck ──
  verwendungszweck: "purpose",
  "verwendungszweck/kundenreferenz": "purpose",
  betreff: "purpose",
  purpose: "purpose",
  "payment reference": "purpose",                      // N26
  info: "purpose",
  beschreibung: "purpose",
  "kundenreferenz (end-to-end)": "purpose",
  kundenreferenz: "purpose",

  // ── Booking text / type ──
  buchungstext: "booking_text",
  buchungsart: "booking_text",
  typ: "booking_text",
  type: "booking_text",                                // N26
  umsatzart: "booking_text",
  umsatztyp: "booking_text",                           // DKB neu
  vorgang: "booking_text",                             // Comdirect
  transaktionstyp: "booking_text",
  "buchungsdetails": "booking_text",

  // ── Ignored columns (mapped to prevent warnings) ──
  "account name": "_ignore",
  "original amount": "_ignore",
  "original currency": "_ignore",
  "exchange rate": "_ignore",
  währung: "_ignore",
  currency: "_ignore",
  saldo: "_ignore",
  "saldo in eur": "_ignore",
  status: "_ignore",
  mandatsreferenz: "_ignore",
  "bezeichnung auftragskonto": "_ignore",
  "iban auftragskonto": "_ignore",
  "bic auftragskonto": "_ignore",
  "bic (swift-code)": "_ignore",
  "bankname auftragskonto": "_ignore",
};

function parseAmountToCents(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Math.round(value * 100);
  const cleaned = String(value).replace(/[€\s]/g, "").trim();
  if (!cleaned) return 0;
  let normalized: string;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  } else {
    normalized = cleaned;
  }
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

function excelSerialToDate(serial: number): string {
  // Excel serial date → JS Date → YYYY-MM-DD
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateValue(value: string | number | undefined): string {
  if (!value && value !== 0) return "";
  // Handle Excel serial number
  if (typeof value === "number" && value > 30000 && value < 60000) {
    return excelSerialToDate(value);
  }
  const str = String(value).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // DD.MM.YYYY or DD.MM.YY
  const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dotMatch) {
    const [, d, m, y] = dotMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // MM/DD/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

function parseCSV(buffer: ArrayBuffer): ParsedTransaction[] {
  const workbook = read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // Use raw: true to get original values (numbers stay numbers, no locale formatting)
  const rows = utils.sheet_to_json<Record<string, any>>(sheet, {
    raw: true,
    defval: "",
  });

  if (rows.length === 0) return [];

  // Map headers
  const firstRow = rows[0];
  const headerMapping: Record<string, string> = {};
  for (const key of Object.keys(firstRow)) {
    const normalized = key.toLowerCase().trim();
    if (HEADER_MAP[normalized]) {
      headerMapping[key] = HEADER_MAP[normalized];
    }
  }

  return rows
    .map((row) => {
      const mapped: Record<string, any> = {};
      for (const [origKey, mappedKey] of Object.entries(headerMapping)) {
        const v = row[origKey];
        if (v !== undefined && v !== null && v !== "") mapped[mappedKey] = v;
      }

      const bookingDate = parseDateValue(mapped.booking_date);
      if (!bookingDate) return null;

      const amountCents = parseAmountToCents(mapped.amount);
      if (amountCents === 0) return null;

      return {
        booking_date: bookingDate,
        value_date: parseDateValue(mapped.value_date) || bookingDate,
        amount_cents: amountCents,
        counterpart_name: mapped.counterpart_name || undefined,
        counterpart_iban: mapped.counterpart_iban || undefined,
        purpose: mapped.purpose || undefined,
        booking_text: mapped.booking_text || undefined,
      };
    })
    .filter(Boolean) as ParsedTransaction[];
}

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );

export function TransactionImportDialog({
  open,
  onOpenChange,
  accounts,
}: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<
    ParsedTransaction[]
  >([]);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importResult, setImportResult] = useState({ total: 0, skipped: 0 });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    setFiles(selectedFiles);
    setParsing(true);

    try {
      let allTransactions: ParsedTransaction[] = [];

      for (const f of selectedFiles) {
        const ext = f.name.split(".").pop()?.toLowerCase();

        if (ext === "csv" || ext === "xlsx" || ext === "xls") {
          const buffer = await f.arrayBuffer();
          const txs = parseCSV(buffer);
          allTransactions = allTransactions.concat(txs);
        } else if (ext === "pdf") {
          const buffer = await f.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          const { data, error } = await supabase.functions.invoke(
            "extract-import-data",
            {
              body: {
                fileBase64: base64,
                mimeType: "application/pdf",
                context: "bank_statement",
              },
            }
          );
          if (error) throw error;
          const aiTransactions = parseAIBankStatementResponse(data);
          allTransactions = allTransactions.concat(aiTransactions);
        } else {
          toast.error(`${f.name}: Nicht unterstütztes Format`);
        }
      }

      setParsedTransactions(allTransactions);
      if (allTransactions.length === 0) {
        toast.error("Keine Transaktionen erkannt. Prüfen Sie das Dateiformat.");
      } else {
        setStep("preview");
      }
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Lesen der Dateien");
    } finally {
      setParsing(false);
    }
  };

  const parseAIBankStatementResponse = (
    data: Record<string, unknown>
  ): ParsedTransaction[] => {
    try {
      // The AI may return transactions in various formats
      const result = data?.result || data;
      let transactions: Array<Record<string, unknown>> = [];

      if (Array.isArray(result)) {
        transactions = result;
      } else if (
        typeof result === "object" &&
        result !== null &&
        "transactions" in result
      ) {
        transactions = (result as Record<string, unknown>)
          .transactions as Array<Record<string, unknown>>;
      }

      return transactions
        .map((tx) => {
          const date = parseDateValue(
            String(tx.datum || tx.date || tx.booking_date || tx.buchungstag || "")
          );
          if (!date) return null;

          let amountCents = 0;
          const amt = tx.betrag || tx.amount || tx.amount_cents;
          if (typeof amt === "number") {
            amountCents =
              Math.abs(amt) > 1000
                ? Math.round(amt)
                : Math.round(amt * 100);
            // Check for Soll/Haben
            const sh = String(tx.soll_haben || tx.type || "").toLowerCase();
            if (sh === "s" || sh === "soll" || sh === "debit") {
              amountCents = -Math.abs(amountCents);
            }
          } else if (typeof amt === "string") {
            amountCents = parseAmountToCents(amt);
          }

          if (amountCents === 0) return null;

          return {
            booking_date: date,
            value_date: parseDateValue(
              String(tx.wertstellung || tx.value_date || tx.valuta || "")
            ) || date,
            amount_cents: amountCents,
            counterpart_name: String(
              tx.auftraggeber || tx.empfänger || tx.counterpart_name || tx.name || ""
            ) || undefined,
            counterpart_iban: String(tx.iban || tx.counterpart_iban || "") || undefined,
            purpose: String(
              tx.verwendungszweck || tx.purpose || tx.betreff || ""
            ) || undefined,
            booking_text: String(tx.buchungstext || tx.booking_text || "") || undefined,
          };
        })
        .filter(Boolean) as ParsedTransaction[];
    } catch {
      return [];
    }
  };

  const handleImport = async () => {
    if (!selectedAccountId || parsedTransactions.length === 0) return;

    setImporting(true);
    let imported = 0;
    let skipped = 0;

    try {
      for (const tx of parsedTransactions) {
        const { error } = await supabase.from("bank_transactions").insert({
          account_id: selectedAccountId,
          finapi_transaction_id: `import_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          booking_date: tx.booking_date,
          value_date: tx.value_date || tx.booking_date,
          amount_cents: tx.amount_cents,
          counterpart_name: tx.counterpart_name || null,
          counterpart_iban: tx.counterpart_iban || null,
          purpose: tx.purpose || null,
          booking_text: tx.booking_text || "Import",
          match_status: "unmatched",
          currency: "EUR",
        });

        if (error) {
          skipped++;
        } else {
          imported++;
        }
      }

      setImportResult({ total: imported, skipped });
      setStep("done");
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success(`${imported} Transaktionen importiert`);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Import");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setFiles([]);
    setParsedTransactions([]);
    setSelectedAccountId("");
    onOpenChange(false);
  };

  const totalIncome = parsedTransactions
    .filter((t) => t.amount_cents > 0)
    .reduce((s, t) => s + t.amount_cents, 0);
  const totalExpense = parsedTransactions
    .filter((t) => t.amount_cents < 0)
    .reduce((s, t) => s + Math.abs(t.amount_cents), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Kontobewegungen importieren
          </DialogTitle>
          <DialogDescription>
            Laden Sie CSV-, XLSX- oder PDF-Kontoauszüge hoch
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div>
              <Label>Zielkonto auswählen</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Konto wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.iban.slice(0, 4)}…
                      {acc.iban.slice(-4)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Datei wird analysiert…</p>
                </div>
              ) : (
                <>
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">
                    Klicken oder Dateien hierhin ziehen
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    CSV, XLSX oder PDF – mehrere Dateien gleichzeitig möglich
                  </p>
                </>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Unterstützte Formate
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>CSV/XLSX: Sparkasse, DKB, ING, Commerzbank, N26 u.v.m.</li>
                <li>
                  Spalten werden automatisch erkannt (Buchungstag, Betrag,
                  Verwendungszweck…)
                </li>
                <li>
                  PDF: Kontoauszüge werden per KI analysiert
                </li>
              </ul>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {files.length === 1 ? files[0].name : `${files.length} Dateien`}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {parsedTransactions.length} Transaktionen erkannt
              </span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(totalIncome)}
                    </p>
                    <p className="text-xs text-muted-foreground">Eingänge</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-lg font-bold text-destructive">
                      {formatCurrency(totalExpense)}
                    </p>
                    <p className="text-xs text-muted-foreground">Ausgänge</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Selection if not yet chosen */}
            {!selectedAccountId && (
              <div>
                <Label>Zielkonto auswählen</Label>
                <Select
                  value={selectedAccountId}
                  onValueChange={setSelectedAccountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Konto wählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Transaction Preview (first 10) */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-3 py-2 text-xs font-medium grid grid-cols-[100px_1fr_120px]">
                <span>Datum</span>
                <span>Buchung</span>
                <span className="text-right">Betrag</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y">
                {parsedTransactions.slice(0, 20).map((tx, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 text-sm grid grid-cols-[100px_1fr_120px] items-center"
                  >
                    <span className="text-muted-foreground">
                      {tx.booking_date.split("-").reverse().join(".")}
                    </span>
                    <div className="truncate">
                      <p className="font-medium truncate">
                        {tx.counterpart_name || "–"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.purpose || tx.booking_text || ""}
                      </p>
                    </div>
                    <span
                      className={`text-right font-mono font-medium ${
                        tx.amount_cents > 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {formatCurrency(tx.amount_cents)}
                    </span>
                  </div>
                ))}
                {parsedTransactions.length > 20 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                    … und {parsedTransactions.length - 20} weitere
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setFiles([]);
                  setParsedTransactions([]);
                }}
              >
                Zurück
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || !selectedAccountId}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importiere…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {parsedTransactions.length} Transaktionen importieren
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <div>
              <h3 className="text-xl font-bold">Import abgeschlossen</h3>
              <p className="text-muted-foreground mt-1">
                {importResult.total} Transaktionen importiert
                {importResult.skipped > 0 && (
                  <span className="flex items-center justify-center gap-1 mt-1 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    {importResult.skipped} übersprungen (Duplikate)
                  </span>
                )}
              </p>
            </div>
            <Button onClick={handleClose}>Schließen</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
