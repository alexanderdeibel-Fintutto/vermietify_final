import { supabase } from "@/integrations/supabase/client";
import type { ExtractedTenant, ExtractedContract } from "./types";

interface ExistingTenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface ExistingUnit {
  id: string;
  unit_number: string;
  building_id: string;
  building?: { name: string } | null;
}

/**
 * Fuzzy-compare two strings (case-insensitive, trimmed)
 */
function fuzzyMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Check extracted tenants against existing tenants in the database.
 * Marks duplicates with _existingMatch and sets default _action.
 */
export async function consolidateTenants(
  tenants: ExtractedTenant[]
): Promise<ExtractedTenant[]> {
  const { data: existing } = await supabase
    .from("tenants")
    .select("id, first_name, last_name, email");

  if (!existing || existing.length === 0) {
    return tenants.map((t) => ({ ...t, _action: "create" as const }));
  }

  return tenants.map((t) => {
    // Try to match by email first (most reliable)
    let match: ExistingTenant | undefined;
    if (t.email) {
      match = existing.find(
        (e) => e.email && fuzzyMatch(e.email, t.email!)
      );
    }
    // Then try name matching
    if (!match) {
      match = existing.find(
        (e) =>
          fuzzyMatch(e.first_name, t.first_name) &&
          fuzzyMatch(e.last_name, t.last_name)
      );
    }

    if (match) {
      return {
        ...t,
        _existingMatch: {
          id: match.id,
          name: `${match.first_name} ${match.last_name}`,
        },
        _action: "skip" as const, // Default: skip existing
      };
    }

    return { ...t, _action: "create" as const };
  });
}

/**
 * Check extracted contracts against existing tenants and units.
 * Tries to auto-match tenant names and unit references.
 */
export async function consolidateContracts(
  contracts: ExtractedContract[]
): Promise<ExtractedContract[]> {
  const [{ data: tenants }, { data: units }] = await Promise.all([
    supabase.from("tenants").select("id, first_name, last_name, email"),
    supabase.from("units").select("id, unit_number, building_id, building:buildings(name)"),
  ]);

  const existingTenants = (tenants || []) as ExistingTenant[];
  const existingUnits = (units || []) as unknown as ExistingUnit[];

  return contracts.map((c) => {
    // Match tenant
    let matchedTenant: ExistingTenant | undefined;
    if (c.tenant_email) {
      matchedTenant = existingTenants.find(
        (t) => t.email && fuzzyMatch(t.email, c.tenant_email!)
      );
    }
    if (!matchedTenant) {
      matchedTenant = existingTenants.find(
        (t) =>
          fuzzyMatch(t.first_name, c.tenant_first_name) &&
          fuzzyMatch(t.last_name, c.tenant_last_name)
      );
    }

    // Match unit by reference
    let matchedUnit: ExistingUnit | undefined;
    if (c.unit_reference) {
      matchedUnit = existingUnits.find((u) =>
        fuzzyMatch(u.unit_number, c.unit_reference!)
      );
      // If multiple matches, try to narrow by building reference
      if (!matchedUnit && c.building_reference) {
        matchedUnit = existingUnits.find(
          (u) =>
            u.unit_number.toLowerCase().includes(c.unit_reference!.toLowerCase()) &&
            (u.building as any)?.name?.toLowerCase().includes(c.building_reference!.toLowerCase())
        );
      }
    }

    return {
      ...c,
      _matchedTenantId: matchedTenant?.id || null,
      _matchedTenantName: matchedTenant
        ? `${matchedTenant.first_name} ${matchedTenant.last_name}`
        : null,
      _matchedUnitId: matchedUnit?.id || null,
      _matchedUnitLabel: matchedUnit?.unit_number || null,
      _needsTenantResolution: !matchedTenant,
      _needsUnitResolution: !matchedUnit,
    };
  });
}
