import { useState, useEffect } from "react";
import {
  FileText,
  Calculator,
  StickyNote,
  Upload,
  Clock,
  ChevronDown,
  Calendar,
  Briefcase,
  AlertTriangle,
  Archive,
  Wallet,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WiderspruchEntry {
  datum: string;
  behoerde: string;
  status: string;
}

interface RechnerEntry {
  id: string;
  rechner: string;
  rechnerSlug: string;
  datum: string;
  ergebnis: unknown;
}

interface NotizEntry {
  id: string;
  titel: string;
  kategorie: string;
  datum: string;
  inhalt: string;
}

interface DokumentEntry {
  id: string;
  name: string;
  kategorie: string;
  datum: string;
  groesse: number;
  typ: string;
}

interface TerminEntry {
  id: string;
  titel: string;
  datum: string;
  uhrzeit: string;
  ort: string;
  art: string;
  erledigt: boolean;
}

interface BewerbungEntry {
  id: string;
  firma: string;
  position: string;
  datum: string;
  status: string;
}

interface SanktionEntry {
  id: string;
  grund: string;
  startDatum: string;
  kuerzungProzent: number;
  kuerzungBetrag: number;
  status: string;
}

interface BescheidEntry {
  id: string;
  titel: string;
  typ: string;
  datum: string;
  behoerde: string;
  status: string;
  betrag?: number;
}

interface FinanzEintrag {
  id: string;
  typ: string;
  bezeichnung: string;
  betrag: number;
  datum: string;
  status: string;
}

type EreignisTyp = "widerspruch" | "rechner" | "notiz" | "dokument" | "termin" | "bewerbung" | "sanktion" | "bescheid" | "finanzen";

interface ZeitstrahlEreignis {
  id: string;
  typ: EreignisTyp;
  titel: string;
  beschreibung: string;
  datum: Date;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYP_CONFIG: Record<
  EreignisTyp,
  {
    icon: typeof FileText;
    farbe: string;
    dotFarbe: string;
    bgFarbe: string;
    borderFarbe: string;
  }
> = {
  widerspruch: {
    icon: FileText,
    farbe: "text-red-600",
    dotFarbe: "bg-red-500",
    bgFarbe: "bg-red-50",
    borderFarbe: "border-red-200 hover:border-red-300",
  },
  rechner: {
    icon: Calculator,
    farbe: "text-blue-600",
    dotFarbe: "bg-blue-500",
    bgFarbe: "bg-blue-50",
    borderFarbe: "border-blue-200 hover:border-blue-300",
  },
  notiz: {
    icon: StickyNote,
    farbe: "text-amber-600",
    dotFarbe: "bg-amber-500",
    bgFarbe: "bg-amber-50",
    borderFarbe: "border-amber-200 hover:border-amber-300",
  },
  dokument: {
    icon: Upload,
    farbe: "text-green-600",
    dotFarbe: "bg-green-500",
    bgFarbe: "bg-green-50",
    borderFarbe: "border-green-200 hover:border-green-300",
  },
  termin: {
    icon: Calendar,
    farbe: "text-purple-600",
    dotFarbe: "bg-purple-500",
    bgFarbe: "bg-purple-50",
    borderFarbe: "border-purple-200 hover:border-purple-300",
  },
  bewerbung: {
    icon: Briefcase,
    farbe: "text-cyan-600",
    dotFarbe: "bg-cyan-500",
    bgFarbe: "bg-cyan-50",
    borderFarbe: "border-cyan-200 hover:border-cyan-300",
  },
  sanktion: {
    icon: AlertTriangle,
    farbe: "text-orange-600",
    dotFarbe: "bg-orange-500",
    bgFarbe: "bg-orange-50",
    borderFarbe: "border-orange-200 hover:border-orange-300",
  },
  bescheid: {
    icon: Archive,
    farbe: "text-rose-600",
    dotFarbe: "bg-rose-500",
    bgFarbe: "bg-rose-50",
    borderFarbe: "border-rose-200 hover:border-rose-300",
  },
  finanzen: {
    icon: Wallet,
    farbe: "text-emerald-600",
    dotFarbe: "bg-emerald-500",
    bgFarbe: "bg-emerald-50",
    borderFarbe: "border-emerald-200 hover:border-emerald-300",
  },
};

const MAX_INITIAL = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParse<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatRelativeDatum(datum: Date): string {
  const jetzt = new Date();
  const diffMs = jetzt.getTime() - datum.getTime();
  const diffTage = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffTage < 0) {
    // Future date - just show formatted
    return formatDatum(datum);
  }
  if (diffTage === 0) {
    return "Heute";
  }
  if (diffTage === 1) {
    return "Gestern";
  }
  if (diffTage < 7) {
    return `vor ${diffTage} Tagen`;
  }
  return formatDatum(datum);
}

function formatDatum(datum: Date): string {
  const tag = String(datum.getDate()).padStart(2, "0");
  const monat = String(datum.getMonth() + 1).padStart(2, "0");
  const jahr = datum.getFullYear();
  return `${tag}.${monat}.${jahr}`;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function ladeEreignisse(): ZeitstrahlEreignis[] {
  const ereignisse: ZeitstrahlEreignis[] = [];

  // Widersprueche
  const widersprueche = safeParse<WiderspruchEntry>(
    "bescheidboxer_widersprueche"
  );
  widersprueche.forEach((w, idx) => {
    const datum = new Date(w.datum);
    if (isNaN(datum.getTime())) return;
    ereignisse.push({
      id: `widerspruch-${idx}`,
      typ: "widerspruch",
      titel: `Widerspruch: ${w.behoerde || "Unbekannte Behoerde"}`,
      beschreibung: `Status: ${w.status || "Offen"}`,
      datum,
    });
  });

  // Rechner-Verlauf
  const rechner = safeParse<RechnerEntry>("bescheidboxer_rechner_verlauf");
  rechner.forEach((r) => {
    const datum = new Date(r.datum);
    if (isNaN(datum.getTime())) return;
    ereignisse.push({
      id: `rechner-${r.id}`,
      typ: "rechner",
      titel: `Berechnung: ${r.rechner || r.rechnerSlug || "Rechner"}`,
      beschreibung: "Ergebnis berechnet",
      datum,
    });
  });

  // Notizen
  const notizen = safeParse<NotizEntry>("bescheidboxer_notizen");
  notizen.forEach((n) => {
    const datum = new Date(n.datum);
    if (isNaN(datum.getTime())) return;
    ereignisse.push({
      id: `notiz-${n.id}`,
      typ: "notiz",
      titel: n.titel || "Notiz",
      beschreibung: truncate(n.inhalt || n.kategorie || "", 80),
      datum,
    });
  });

  // Dokumente
  const dokumente = safeParse<DokumentEntry>("bescheidboxer_dokumente");
  dokumente.forEach((d) => {
    const datum = new Date(d.datum);
    if (isNaN(datum.getTime())) return;
    ereignisse.push({
      id: `dokument-${d.id}`,
      typ: "dokument",
      titel: d.name || "Dokument",
      beschreibung: `${d.kategorie || d.typ || "Datei"}${d.groesse ? ` — ${(d.groesse / 1024).toFixed(0)} KB` : ""}`,
      datum,
    });
  });

  // Termine
  const termine = safeParse<TerminEntry>("bescheidboxer_termine");
  termine.forEach((t) => {
    const datum = new Date(t.datum);
    if (isNaN(datum.getTime())) return;
    ereignisse.push({
      id: `termin-${t.id}`,
      typ: "termin",
      titel: `Termin: ${t.titel || t.art || "Jobcenter"}`,
      beschreibung: `${t.uhrzeit ? t.uhrzeit + " Uhr" : ""}${t.ort ? ` — ${t.ort}` : ""}${t.erledigt ? " (erledigt)" : ""}`,
      datum,
    });
  });

  // Bewerbungen
  const bewerbungen = safeParse<BewerbungEntry>("bescheidboxer_bewerbungen");
  bewerbungen.forEach((b) => {
    const datum = new Date(b.datum);
    if (isNaN(datum.getTime())) return;
    ereignisse.push({
      id: `bewerbung-${b.id}`,
      typ: "bewerbung",
      titel: `Bewerbung: ${b.firma || "Unbekannt"}`,
      beschreibung: `${b.position || ""}${b.status ? ` — ${b.status}` : ""}`,
      datum,
    });
  });

  // Sanktionen
  const sanktionen = safeParse<SanktionEntry>("bescheidboxer_sanktionen");
  sanktionen.forEach((s) => {
    const datum = new Date(s.startDatum);
    if (isNaN(datum.getTime())) return;
    ereignisse.push({
      id: `sanktion-${s.id}`,
      typ: "sanktion",
      titel: `Sanktion: ${s.grund || "Unbekannt"}`,
      beschreibung: `${s.kuerzungProzent}% Kuerzung (${s.kuerzungBetrag} EUR) — ${s.status || "aktiv"}`,
      datum,
    });
  });

  // Bescheide
  const bescheide = safeParse<BescheidEntry>("bescheidboxer_bescheide");
  bescheide.forEach((b) => {
    const datum = new Date(b.datum);
    if (isNaN(datum.getTime())) return;
    ereignisse.push({
      id: `bescheid-${b.id}`,
      typ: "bescheid",
      titel: b.titel || "Bescheid",
      beschreibung: `${b.behoerde || ""} — ${b.status || "neu"}${b.betrag ? ` (${b.betrag} EUR)` : ""}`,
      datum,
    });
  });

  // Finanzen
  const finanzen = safeParse<FinanzEintrag>("bescheidboxer_finanzen");
  finanzen.forEach((f) => {
    const datum = new Date(f.datum);
    if (isNaN(datum.getTime())) return;
    ereignisse.push({
      id: `finanzen-${f.id}`,
      typ: "finanzen",
      titel: f.bezeichnung || "Finanzeintrag",
      beschreibung: `${f.typ} — ${f.betrag} EUR (${f.status})`,
      datum,
    });
  });

  // Sort newest first
  ereignisse.sort((a, b) => b.datum.getTime() - a.datum.getTime());

  return ereignisse;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Zeitstrahl() {
  const [ereignisse, setEreignisse] = useState<ZeitstrahlEreignis[]>([]);
  const [alleAnzeigen, setAlleAnzeigen] = useState(false);

  useEffect(() => {
    setEreignisse(ladeEreignisse());
  }, []);

  if (ereignisse.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Aktivitaeten-Zeitstrahl
        </h3>
        <div className="text-center py-8">
          <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Noch keine Aktivitaeten. Starte mit einem BescheidScan oder Rechner!
          </p>
        </div>
      </div>
    );
  }

  const sichtbareEreignisse = alleAnzeigen
    ? ereignisse
    : ereignisse.slice(0, MAX_INITIAL);
  const hatMehr = ereignisse.length > MAX_INITIAL;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Aktivitaeten-Zeitstrahl
        <span className="text-xs font-normal text-muted-foreground ml-auto">
          {ereignisse.length} {ereignisse.length === 1 ? "Ereignis" : "Ereignisse"}
        </span>
      </h3>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {sichtbareEreignisse.map((e) => {
            const config = TYP_CONFIG[e.typ];
            const Icon = config.icon;

            return (
              <div key={e.id} className="relative flex gap-4 group">
                {/* Dot on the line */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={`w-[31px] h-[31px] rounded-full flex items-center justify-center ${config.bgFarbe} border-2 border-white shadow-sm`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${config.dotFarbe}`}
                    />
                  </div>
                </div>

                {/* Event card */}
                <div
                  className={`flex-1 rounded-xl border p-3 transition-all duration-200 ${config.borderFarbe} group-hover:shadow-sm -mt-0.5`}
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.farbe}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium leading-snug truncate">
                          {e.titel}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatRelativeDatum(e.datum)}
                        </span>
                      </div>
                      {e.beschreibung && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {e.beschreibung}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expand button */}
      {hatMehr && !alleAnzeigen && (
        <button
          onClick={() => setAlleAnzeigen(true)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium py-2 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <ChevronDown className="h-4 w-4" />
          Alle anzeigen ({ereignisse.length} Ereignisse)
        </button>
      )}

      {/* Collapse button when expanded */}
      {hatMehr && alleAnzeigen && (
        <button
          onClick={() => setAlleAnzeigen(false)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium py-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <ChevronDown className="h-4 w-4 rotate-180" />
          Weniger anzeigen
        </button>
      )}
    </div>
  );
}
