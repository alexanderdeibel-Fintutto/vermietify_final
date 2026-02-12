
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

ALTER TABLE public.hausmeister_sync_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org-based access" ON public.hausmeister_sync_map 
FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id(auth.uid()))
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE TRIGGER prevent_org_id_change BEFORE UPDATE ON public.hausmeister_sync_map
  FOR EACH ROW EXECUTE FUNCTION prevent_organization_id_change();
