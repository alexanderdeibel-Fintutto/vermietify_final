

# Cross-App-Integration: Vermietify + HausmeisterPro

## Uebersicht
Vollstaendige Integration zwischen Vermietify und der HausmeisterPro-App. Der Verwalter kann aus Vermietify heraus Gebaeude/Aufgaben mit dem Hausmeister synchronisieren, die Einladung verlinkt direkt zur richtigen App mit automatischer Gebaeudeverbindung, und Aufgaben werden zwischen beiden Apps abgeglichen.

## Voraussetzungen
Zwei Secrets muessen hinterlegt werden, damit Vermietify auf die HausmeisterPro-Datenbank zugreifen kann:
- `HAUSMEISTER_SUPABASE_URL` (API-URL des HausmeisterPro-Backends)
- `HAUSMEISTER_SERVICE_ROLE_KEY` (Service-Key fuer den Backend-Zugriff)

## Aenderungen

### 1. Einladungs-Link verbessern
Die bestehende Edge Function `send-caretaker-invite` wird erweitert:
- Der Einladungslink enthaelt Query-Parameter (`?invite=CARETAKER_ID&building=BUILDING_NAME&org=ORG_NAME`), damit die HausmeisterPro-App beim Registrieren/Login das Gebaeude automatisch zuordnen kann.
- Beim Senden der Einladung wird zusaetzlich in der HausmeisterPro-Datenbank geprueft, ob der Nutzer dort bereits existiert. Falls ja, wird das Gebaeude direkt als `company` + `building` angelegt/verknuepft.

### 2. Neue Edge Function: `sync-hausmeister-data`
Zentrale Sync-Funktion fuer den Datenaustausch:
- **Gebaeude-Sync (Vermietify -> HausmeisterPro):** Erstellt oder aktualisiert in HausmeisterPro eine `company` (basierend auf der Vermietify-Organisation) und ein `building` mit Adresse und Einheiten.
- **Aufgaben-Sync (bidirektional):**
  - Vermietify -> HausmeisterPro: Aufgaben, die einem Hausmeister zugewiesen sind, werden als `task` in HausmeisterPro erstellt.
  - HausmeisterPro -> Vermietify: Status-Updates (erledigt, in Bearbeitung) werden zurueck synchronisiert.
- Mapping ueber eine neue Tabelle `hausmeister_sync_map` (lokale ID <-> externe ID).

### 3. Neue Tabelle: `hausmeister_sync_map`
Speichert die Zuordnung zwischen IDs in Vermietify und HausmeisterPro:

```text
+-------------------+----------------------------------------------+
| Spalte            | Beschreibung                                 |
+-------------------+----------------------------------------------+
| id                | UUID, PK                                     |
| organization_id   | FK -> organizations                          |
| entity_type       | 'building' | 'unit' | 'task' | 'company'     |
| local_id          | UUID (Vermietify-ID)                         |
| remote_id         | UUID (HausmeisterPro-ID)                     |
| last_synced_at    | Zeitstempel der letzten Synchronisation      |
| sync_direction    | 'push' | 'pull' | 'both'                    |
+-------------------+----------------------------------------------+
```

RLS: Nur Nutzer der gleichen Organisation koennen zugreifen.

### 4. UI: Sync-Button im Hausmeister-Tab
Der bestehende `BuildingCaretakersTab` wird erweitert:
- Neuer Button "Mit HausmeisterPro synchronisieren" neben dem Einladungs-Button.
- Zeigt den Sync-Status pro Hausmeister an (Verbunden / Nicht verbunden / Sync-Fehler).
- Dialog mit Sync-Optionen: Gebaeude senden, Aufgaben abgleichen, letzter Sync-Zeitpunkt.

### 5. Aufgaben-Sync-Widget
Neues Widget im Hausmeister-Tab, das synchronisierte Aufgaben anzeigt:
- Aufgaben-Titel, Status, Prioritaet, zugewiesener Hausmeister
- Status-Badge zeigt, ob die Aufgabe in HausmeisterPro aktualisiert wurde
- Manueller "Jetzt synchronisieren"-Button

## Technische Details

### Migration SQL
```sql
CREATE TABLE public.hausmeister_sync_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('building', 'unit', 'task', 'company')),
  local_id UUID NOT NULL,
  remote_id UUID NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_direction TEXT NOT NULL DEFAULT 'push' CHECK (sync_direction IN ('push', 'pull', 'both')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, entity_type, local_id)
);

ALTER TABLE hausmeister_sync_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org-based access" ON hausmeister_sync_map FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id(auth.uid()))
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE TRIGGER prevent_org_id_change BEFORE UPDATE ON hausmeister_sync_map
  FOR EACH ROW EXECUTE FUNCTION prevent_organization_id_change();
```

### Edge Function: `sync-hausmeister-data/index.ts`
Aktionen (ueber `action`-Parameter gesteuert):
- `sync_building`: Sendet Gebaeude + Einheiten an HausmeisterPro
- `sync_tasks`: Synchronisiert Aufgaben bidirektional
- `check_user`: Prueft, ob eine E-Mail in HausmeisterPro registriert ist
- `get_status`: Gibt den aktuellen Sync-Status zurueck

Verbindung zur HausmeisterPro-DB ueber die Secrets `HAUSMEISTER_SUPABASE_URL` und `HAUSMEISTER_SERVICE_ROLE_KEY`.

### Edge Function: `send-caretaker-invite/index.ts` (angepasst)
- Einladungs-URL wird dynamisch mit Caretaker-ID und Gebaeudeinfos generiert
- Falls der eingeladene Nutzer bereits in HausmeisterPro existiert, wird das Gebaeude dort automatisch angelegt

### Hook: `useHausmeisterSync.ts` (neu)
- `syncBuilding(buildingId)`: Startet Gebaeude-Sync
- `syncTasks(buildingId)`: Startet Aufgaben-Sync
- `checkUserExists(email)`: Prueft HausmeisterPro-Account
- `getSyncStatus(buildingId)`: Laedt Sync-Map-Eintraege

### Dateien

| Datei | Aktion |
|-------|--------|
| `supabase/migrations/...` | Neue Migration fuer `hausmeister_sync_map` |
| `supabase/functions/sync-hausmeister-data/index.ts` | Neue Edge Function |
| `supabase/functions/send-caretaker-invite/index.ts` | Erweitern (Einladungs-Link + Auto-Sync) |
| `supabase/config.toml` | Neuen Function-Eintrag |
| `src/hooks/useHausmeisterSync.ts` | Neuer Hook |
| `src/components/buildings/BuildingCaretakersTab.tsx` | Sync-UI hinzufuegen |
| `src/components/buildings/HausmeisterSyncDialog.tsx` | Neuer Dialog fuer Sync-Optionen |

