import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ExtractedUnit, ExtractedBuilding, ExtractedTenant, ExtractedContract,
  formatCurrency, floorLabel,
} from "./types";

// ─── Units Preview ───
export function UnitsPreviewTable({
  data, onToggle,
}: { data: ExtractedUnit[]; onToggle: (i: number) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <TableHead>Nr.</TableHead>
          <TableHead>Etage</TableHead>
          <TableHead>m²</TableHead>
          <TableHead>Zimmer</TableHead>
          <TableHead>Kaltmiete</TableHead>
          <TableHead>NK</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((unit, i) => (
          <TableRow key={i} className={!unit._selected ? "opacity-50" : ""}>
            <TableCell>
              <Checkbox checked={unit._selected} onCheckedChange={() => onToggle(i)} />
            </TableCell>
            <TableCell className="font-medium">{unit.unit_number}</TableCell>
            <TableCell>{floorLabel(unit.floor)}</TableCell>
            <TableCell>{unit.area ? `${unit.area} m²` : "-"}</TableCell>
            <TableCell>{unit.rooms ?? "-"}</TableCell>
            <TableCell>{unit.rent_amount ? formatCurrency(unit.rent_amount) : "-"}</TableCell>
            <TableCell>{unit.utility_advance ? formatCurrency(unit.utility_advance) : "-"}</TableCell>
            <TableCell>
              <Badge variant={unit.status === "rented" ? "default" : "secondary"}>
                {unit.status === "rented" ? "Vermietet" : "Frei"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Buildings Preview ───
export function BuildingsPreviewTable({
  data, onToggle,
}: { data: ExtractedBuilding[]; onToggle: (i: number) => void }) {
  const typeLabels: Record<string, string> = {
    apartment: "MFH", house: "EFH", commercial: "Gewerbe", mixed: "Gemischt",
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Adresse</TableHead>
          <TableHead>PLZ</TableHead>
          <TableHead>Stadt</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Baujahr</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((b, i) => (
          <TableRow key={i} className={!b._selected ? "opacity-50" : ""}>
            <TableCell>
              <Checkbox checked={b._selected} onCheckedChange={() => onToggle(i)} />
            </TableCell>
            <TableCell className="font-medium">{b.name}</TableCell>
            <TableCell>{b.address}</TableCell>
            <TableCell>{b.postal_code}</TableCell>
            <TableCell>{b.city}</TableCell>
            <TableCell><Badge variant="outline">{typeLabels[b.building_type || ""] || b.building_type || "-"}</Badge></TableCell>
            <TableCell>{b.year_built ?? "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Tenants Preview ───
export function TenantsPreviewTable({
  data, onToggle,
}: { data: ExtractedTenant[]; onToggle: (i: number) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>E-Mail</TableHead>
          <TableHead>Telefon</TableHead>
          <TableHead>Adresse</TableHead>
          <TableHead>Einheit</TableHead>
          <TableHead>Aktion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((t, i) => (
          <TableRow key={i} className={!t._selected ? "opacity-50" : ""}>
            <TableCell>
              <Checkbox checked={t._selected} onCheckedChange={() => onToggle(i)} />
            </TableCell>
            <TableCell className="font-medium">{t.first_name} {t.last_name}</TableCell>
            <TableCell>{t.email || "-"}</TableCell>
            <TableCell>{t.phone || "-"}</TableCell>
            <TableCell className="text-xs">
              {t.address ? `${t.address}, ${t.postal_code || ""} ${t.city || ""}` : "-"}
            </TableCell>
            <TableCell>{t.unit_reference || "-"}</TableCell>
            <TableCell>
              {t._existingMatch ? (
                <Badge variant="outline" className="text-xs">
                  {t._action === "skip" ? "⏭ Überspringen" : t._action === "update" ? "🔄 Aktualisieren" : "➕ Neu anlegen"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">➕ Neu</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Contracts Preview ───
export function ContractsPreviewTable({
  data, onToggle,
}: { data: ExtractedContract[]; onToggle: (i: number) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          <TableHead>Mieter</TableHead>
          <TableHead>Einheit</TableHead>
          <TableHead>Gebäude</TableHead>
          <TableHead>Beginn</TableHead>
          <TableHead>Kaltmiete</TableHead>
          <TableHead>NK</TableHead>
          <TableHead>Zuordnung</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((c, i) => (
          <TableRow key={i} className={!c._selected ? "opacity-50" : ""}>
            <TableCell>
              <Checkbox checked={c._selected} onCheckedChange={() => onToggle(i)} />
            </TableCell>
            <TableCell className="font-medium">
              {c.tenant_first_name} {c.tenant_last_name}
              {c._matchedTenantName && (
                <div className="text-xs text-muted-foreground">→ {c._matchedTenantName}</div>
              )}
            </TableCell>
            <TableCell>
              {c.unit_reference || "-"}
              {c._matchedUnitLabel && (
                <div className="text-xs text-muted-foreground">→ {c._matchedUnitLabel}</div>
              )}
            </TableCell>
            <TableCell className="text-xs">{c.building_reference || "-"}</TableCell>
            <TableCell>{c.start_date || "-"}</TableCell>
            <TableCell>{c.rent_amount ? formatCurrency(c.rent_amount) : "-"}</TableCell>
            <TableCell>{c.utility_advance ? formatCurrency(c.utility_advance) : "-"}</TableCell>
            <TableCell>
              {c._needsTenantResolution || c._needsUnitResolution ? (
                <Badge variant="destructive" className="text-xs">⚠ Klärung nötig</Badge>
              ) : c._matchedTenantId && c._matchedUnitId ? (
                <Badge variant="default" className="text-xs">✓ Zugeordnet</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Teilweise</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
