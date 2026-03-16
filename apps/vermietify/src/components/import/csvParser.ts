import * as XLSX from "xlsx";
import type {
  ImportType,
  ExtractedUnit,
  ExtractedBuilding,
  ExtractedTenant,
  ExtractedContract,
} from "./types";

// ─── Header mappings (German + English, lowercase) ───

const UNIT_HEADERS: Record<string, keyof ExtractedUnit> = {
  // German
  wohnung: "unit_number", whg: "unit_number", nr: "unit_number",
  nummer: "unit_number", einheit: "unit_number", bezeichnung: "unit_number",
  wohnungsnummer: "unit_number", "wohnungs-nr": "unit_number",
  etage: "floor", stockwerk: "floor", og: "floor", geschoss: "floor",
  "fläche": "area", flaeche: "area", "wohnfläche": "area", "wohnflaeche": "area",
  "m²": "area", qm: "area", "fläche m²": "area", "fläche qm": "area",
  zimmer: "rooms", "räume": "rooms", raeume: "rooms", "zi": "rooms",
  miete: "rent_amount", kaltmiete: "rent_amount", nettomiete: "rent_amount",
  "kalt-miete": "rent_amount", "netto-miete": "rent_amount",
  nebenkosten: "utility_advance", nk: "utility_advance",
  vorauszahlung: "utility_advance", "nk-vorauszahlung": "utility_advance",
  betriebskosten: "utility_advance",
  status: "status",
  anmerkung: "notes", notiz: "notes", bemerkung: "notes", kommentar: "notes",
  // English
  unit: "unit_number", apartment: "unit_number", "unit number": "unit_number",
  floor: "floor", area: "area", rooms: "rooms",
  rent: "rent_amount", utilities: "utility_advance", notes: "notes",
};

const BUILDING_HEADERS: Record<string, keyof ExtractedBuilding> = {
  name: "name", gebäude: "name", gebaude: "name", objekt: "name", building: "name",
  adresse: "address", straße: "address", strasse: "address", "straße hausnummer": "address",
  address: "address", street: "address",
  plz: "postal_code", postleitzahl: "postal_code", "postal code": "postal_code", zip: "postal_code",
  stadt: "city", ort: "city", city: "city",
  typ: "building_type", "gebäudetyp": "building_type", type: "building_type",
  baujahr: "year_built", "year built": "year_built",
  "gesamtfläche": "total_area", "gesamtflaeche": "total_area", "total area": "total_area",
  anmerkung: "notes", notiz: "notes", bemerkung: "notes", notes: "notes",
};

const TENANT_HEADERS: Record<string, keyof ExtractedTenant> = {
  vorname: "first_name", "first name": "first_name", firstname: "first_name",
  nachname: "last_name", "last name": "last_name", lastname: "last_name",
  name: "last_name", familienname: "last_name",
  email: "email", "e-mail": "email", mail: "email",
  telefon: "phone", tel: "phone", phone: "phone", mobil: "phone", handy: "phone",
  adresse: "address", straße: "address", strasse: "address", address: "address",
  plz: "postal_code", postleitzahl: "postal_code",
  stadt: "city", ort: "city", city: "city",
  einheit: "unit_reference", wohnung: "unit_reference", whg: "unit_reference",
  "unit reference": "unit_reference",
  anmerkung: "notes", notiz: "notes", bemerkung: "notes", notes: "notes",
};

const CONTRACT_HEADERS: Record<string, keyof ExtractedContract> = {
  vorname: "tenant_first_name", "mieter vorname": "tenant_first_name",
  nachname: "tenant_last_name", "mieter nachname": "tenant_last_name",
  mieter: "tenant_last_name", "tenant name": "tenant_last_name",
  email: "tenant_email", "e-mail": "tenant_email", "mieter email": "tenant_email",
  einheit: "unit_reference", wohnung: "unit_reference", whg: "unit_reference",
  "unit": "unit_reference",
  gebäude: "building_reference", gebaude: "building_reference", objekt: "building_reference",
  building: "building_reference",
  beginn: "start_date", "vertragsbeginn": "start_date", "mietbeginn": "start_date",
  "start date": "start_date", start: "start_date", von: "start_date",
  ende: "end_date", "vertragsende": "end_date", "mietende": "end_date",
  "end date": "end_date", bis: "end_date",
  miete: "rent_amount", kaltmiete: "rent_amount", "kalt-miete": "rent_amount",
  rent: "rent_amount",
  nebenkosten: "utility_advance", nk: "utility_advance",
  kaution: "deposit_amount", deposit: "deposit_amount",
  zahltag: "payment_day", "payment day": "payment_day",
  anmerkung: "notes", notiz: "notes", notes: "notes",
};

const HEADER_MAPS: Record<ImportType, Record<string, string>> = {
  units: UNIT_HEADERS,
  buildings: BUILDING_HEADERS,
  tenants: TENANT_HEADERS,
  contracts: CONTRACT_HEADERS,
};

// ─── Currency parsing ───

/** Parse a currency string like "850,00 €" or "850.00" to cents */
function parseCurrencyToCents(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    // If it's already a reasonable cent value (>= 100), return as-is
    // If it looks like euros (< 100 or has decimals), convert
    if (Number.isInteger(value) && value >= 10000) return value; // already cents
    return Math.round(value * 100);
  }
  const str = String(value).replace(/[€\s]/g, "").trim();
  if (!str) return null;
  // Handle German format: 1.234,56 → 1234.56
  let normalized = str;
  if (normalized.includes(",")) {
    // German format: replace dots (thousand sep) then comma → dot
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }
  const num = parseFloat(normalized);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

/** Parse a number from string, handling German format */
function parseNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const str = String(value).replace(/[m²qm\s]/g, "").trim();
  // German decimal: 65,5 → 65.5
  const normalized = str.replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

/** Parse a date string to YYYY-MM-DD */
function parseDate(value: string | number | null | undefined): string | null {
  if (!value) return null;
  const str = String(value).trim();
  // Try DD.MM.YYYY (German format)
  const deMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (deMatch) {
    return `${deMatch[3]}-${deMatch[2].padStart(2, "0")}-${deMatch[1].padStart(2, "0")}`;
  }
  // Try YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) return str;
  // Try MM/DD/YYYY
  const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    return `${usMatch[3]}-${usMatch[1].padStart(2, "0")}-${usMatch[2].padStart(2, "0")}`;
  }
  return null;
}

/** Parse floor from string like "EG", "1.OG", "2. UG", "3" */
function parseFloor(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const str = String(value).trim().toLowerCase();
  if (str === "eg" || str === "erdgeschoss") return 0;
  if (str === "dg" || str === "dachgeschoss") return -99; // special
  const ogMatch = str.match(/(-?\d+)\s*\.?\s*og/);
  if (ogMatch) return parseInt(ogMatch[1]);
  const ugMatch = str.match(/(-?\d+)\s*\.?\s*ug/);
  if (ugMatch) return -parseInt(ugMatch[1]);
  const num = parseInt(str);
  return isNaN(num) ? null : num;
}

// ─── Map column header to field name ───

function mapHeader(header: string, headerMap: Record<string, string>): string | null {
  const normalized = header.trim().toLowerCase()
    .replace(/[_\-\.]/g, " ")
    .replace(/\s+/g, " ");

  // Direct match
  if (headerMap[normalized]) return headerMap[normalized];

  // Try partial match: if the header contains one of our known keys
  for (const [key, field] of Object.entries(headerMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return field;
    }
  }

  return null;
}

// ─── Handle "Name" column that might contain full name ───

function splitFullName(name: string): { first_name: string; last_name: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: "", last_name: parts[0] };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}

// ─── Main parser ───

export function parseSpreadsheet(
  fileData: ArrayBuffer,
  type: ImportType,
  fileName: string
): { success: true; data: any[] } | { success: false; error: string } {
  try {
    const workbook = XLSX.read(fileData, { type: "array", codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: "Die Datei enthält keine Daten." };
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (rawRows.length < 2) {
      return { success: false, error: "Die Datei enthält keine ausreichenden Daten (mindestens Kopfzeile + 1 Datenzeile)." };
    }

    // Find the header row (first row with at least 2 non-empty cells)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, rawRows.length); i++) {
      const nonEmpty = rawRows[i].filter((c: any) => c !== null && c !== undefined && String(c).trim() !== "").length;
      if (nonEmpty >= 2) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = rawRows[headerRowIndex].map((h: any) => String(h).trim());
    const headerMap = HEADER_MAPS[type];

    // Map each column to a field name
    const columnMapping: (string | null)[] = headers.map((h: string) => mapHeader(h, headerMap));

    // Check if we have at least one mapped column
    const mappedCount = columnMapping.filter(Boolean).length;
    if (mappedCount === 0) {
      return {
        success: false,
        error: `Keine passenden Spalten erkannt. Erwartete Spalten für ${type}: ${Object.keys(headerMap).slice(0, 8).join(", ")}...`,
      };
    }

    // Parse data rows
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const results: any[] = [];

    for (const row of dataRows) {
      // Skip empty rows
      const nonEmpty = row.filter((c: any) => c !== null && c !== undefined && String(c).trim() !== "").length;
      if (nonEmpty === 0) continue;

      const record: Record<string, any> = {};
      for (let col = 0; col < columnMapping.length; col++) {
        const field = columnMapping[col];
        if (!field) continue;
        record[field] = row[col] !== undefined ? row[col] : null;
      }

      // Type-specific post-processing
      const processed = postProcess(record, type);
      if (processed) results.push(processed);
    }

    if (results.length === 0) {
      return { success: false, error: "Es konnten keine gültigen Datensätze aus der Datei extrahiert werden." };
    }

    return { success: true, data: results };
  } catch (err) {
    console.error("CSV/XLSX parse error:", err);
    return { success: false, error: "Fehler beim Lesen der Datei. Stellen Sie sicher, dass es sich um eine gültige CSV- oder Excel-Datei handelt." };
  }
}

function postProcess(record: Record<string, any>, type: ImportType): any | null {
  switch (type) {
    case "units": {
      const unit_number = String(record.unit_number || "").trim();
      if (!unit_number) return null;
      return {
        unit_number,
        floor: parseFloor(record.floor),
        area: parseNumber(record.area),
        rooms: parseNumber(record.rooms),
        rent_amount: parseCurrencyToCents(record.rent_amount),
        utility_advance: parseCurrencyToCents(record.utility_advance),
        status: String(record.status || "vacant").toLowerCase().includes("vermietet") ? "rented"
          : String(record.status || "").toLowerCase().includes("rented") ? "rented" : "vacant",
        notes: record.notes ? String(record.notes) : null,
      } as ExtractedUnit;
    }
    case "buildings": {
      const name = String(record.name || record.address || "").trim();
      if (!name) return null;
      const btRaw = String(record.building_type || "").toLowerCase();
      let building_type = "apartment";
      if (btRaw.includes("efh") || btRaw.includes("haus") || btRaw.includes("house")) building_type = "house";
      else if (btRaw.includes("gewerbe") || btRaw.includes("commercial")) building_type = "commercial";
      else if (btRaw.includes("gemischt") || btRaw.includes("mixed")) building_type = "mixed";
      return {
        name,
        address: String(record.address || "").trim(),
        postal_code: String(record.postal_code || "").trim(),
        city: String(record.city || "").trim(),
        building_type,
        year_built: parseNumber(record.year_built) ? Math.round(parseNumber(record.year_built)!) : null,
        total_area: parseNumber(record.total_area),
        notes: record.notes ? String(record.notes) : null,
      } as ExtractedBuilding;
    }
    case "tenants": {
      let first_name = String(record.first_name || "").trim();
      let last_name = String(record.last_name || "").trim();
      // If we only have last_name (from "Name" column), try to split
      if (!first_name && last_name && last_name.includes(" ")) {
        const split = splitFullName(last_name);
        first_name = split.first_name;
        last_name = split.last_name;
      }
      if (!first_name && !last_name) return null;
      return {
        first_name: first_name || "-",
        last_name: last_name || "-",
        email: record.email ? String(record.email).trim() : null,
        phone: record.phone ? String(record.phone).trim() : null,
        address: record.address ? String(record.address).trim() : null,
        postal_code: record.postal_code ? String(record.postal_code).trim() : null,
        city: record.city ? String(record.city).trim() : null,
        unit_reference: record.unit_reference ? String(record.unit_reference).trim() : null,
        notes: record.notes ? String(record.notes) : null,
      } as ExtractedTenant;
    }
    case "contracts": {
      let tenant_first_name = String(record.tenant_first_name || "").trim();
      let tenant_last_name = String(record.tenant_last_name || "").trim();
      if (!tenant_first_name && tenant_last_name && tenant_last_name.includes(" ")) {
        const split = splitFullName(tenant_last_name);
        tenant_first_name = split.first_name;
        tenant_last_name = split.last_name;
      }
      if (!tenant_first_name && !tenant_last_name) return null;
      return {
        tenant_first_name: tenant_first_name || "-",
        tenant_last_name: tenant_last_name || "-",
        tenant_email: record.tenant_email ? String(record.tenant_email).trim() : null,
        unit_reference: record.unit_reference ? String(record.unit_reference).trim() : null,
        building_reference: record.building_reference ? String(record.building_reference).trim() : null,
        start_date: parseDate(record.start_date),
        end_date: parseDate(record.end_date),
        rent_amount: parseCurrencyToCents(record.rent_amount),
        utility_advance: parseCurrencyToCents(record.utility_advance),
        deposit_amount: parseCurrencyToCents(record.deposit_amount),
        payment_day: parseNumber(record.payment_day) ? Math.round(parseNumber(record.payment_day)!) : null,
        notes: record.notes ? String(record.notes) : null,
      } as ExtractedContract;
    }
    default:
      return null;
  }
}
