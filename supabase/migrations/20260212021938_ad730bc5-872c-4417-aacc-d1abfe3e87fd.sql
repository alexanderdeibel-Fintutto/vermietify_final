
-- Tabelle für Hausmeister pro Gebäude
CREATE TABLE public.building_caretakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (building_id, email)
);

-- RLS aktivieren
ALTER TABLE public.building_caretakers ENABLE ROW LEVEL SECURITY;

-- Anon-Zugriff sperren
CREATE POLICY "Deny anonymous access to building_caretakers"
  ON public.building_caretakers FOR ALL TO anon USING (false);

-- Org-basierter Zugriff für authentifizierte Nutzer
CREATE POLICY "Users can manage caretakers in their org"
  ON public.building_caretakers FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id(auth.uid()))
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- updated_at Trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.building_caretakers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Org-ID-Schutz
CREATE TRIGGER prevent_org_id_change
  BEFORE UPDATE ON public.building_caretakers
  FOR EACH ROW EXECUTE FUNCTION prevent_organization_id_change();
