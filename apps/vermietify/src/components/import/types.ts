// ─── Shared types for bulk import ───

export type ImportType = "units" | "buildings" | "tenants" | "contracts";
export type Step = "upload" | "preview" | "consolidation" | "importing" | "done";

export interface ExtractedUnit {
  unit_number: string;
  floor?: number | null;
  area?: number | null;
  rooms?: number | null;
  rent_amount?: number | null;
  utility_advance?: number | null;
  status?: string;
  notes?: string | null;
  _selected?: boolean;
}

export interface ExtractedBuilding {
  name: string;
  address: string;
  postal_code: string;
  city: string;
  building_type?: string;
  year_built?: number | null;
  total_area?: number | null;
  notes?: string | null;
  _selected?: boolean;
}

export interface ExtractedTenant {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  unit_reference?: string | null;
  notes?: string | null;
  _selected?: boolean;
  /** Populated during consolidation */
  _existingMatch?: { id: string; name: string } | null;
  _action?: "create" | "skip" | "update";
}

export interface ExtractedContract {
  tenant_first_name: string;
  tenant_last_name: string;
  tenant_email?: string | null;
  unit_reference?: string | null;
  building_reference?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  rent_amount?: number | null;
  utility_advance?: number | null;
  deposit_amount?: number | null;
  payment_day?: number | null;
  notes?: string | null;
  _selected?: boolean;
  /** Populated during consolidation */
  _matchedTenantId?: string | null;
  _matchedTenantName?: string | null;
  _matchedUnitId?: string | null;
  _matchedUnitLabel?: string | null;
  _needsTenantResolution?: boolean;
  _needsUnitResolution?: boolean;
}

export interface ImportCount {
  success: number;
  failed: number;
  skipped: number;
}

export interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ImportType;
  /** Required for unit imports */
  buildingId?: string;
  organizationId?: string;
  onSuccess?: () => void;
}

// ─── Helpers ───

export const formatCurrency = (cents: number) =>
  `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`;

export const floorLabel = (floor: number | null | undefined) => {
  if (floor === null || floor === undefined) return "-";
  if (floor === 0) return "EG";
  if (floor < 0) return `${floor}. UG`;
  return `${floor}. OG`;
};

export const TYPE_LABELS: Record<ImportType, string> = {
  units: "Einheiten",
  buildings: "Gebäude",
  tenants: "Mieter",
  contracts: "Verträge",
};

export const TYPE_DESCRIPTIONS: Record<ImportType, string> = {
  units: "Laden Sie ein PDF oder CSV mit einer Wohnungsliste hoch. Die KI extrahiert automatisch die Daten.",
  buildings: "Laden Sie ein PDF oder CSV mit einer Gebäudeliste hoch. Die KI extrahiert automatisch die Daten.",
  tenants: "Laden Sie ein PDF oder CSV mit einer Mieterliste hoch. Die KI erkennt Namen, Kontaktdaten und Zuordnungen.",
  contracts: "Laden Sie ein PDF oder CSV mit Mietvertragsdaten hoch. Die KI extrahiert Mieter, Einheiten und Konditionen.",
};
