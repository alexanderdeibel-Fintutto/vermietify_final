-- Create cost_types table
CREATE TABLE public.cost_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_distribution_key TEXT NOT NULL DEFAULT 'area' CHECK (default_distribution_key IN ('area', 'persons', 'units', 'consumption')),
  is_chargeable BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('heating', 'water', 'cleaning', 'insurance', 'taxes', 'other')),
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_types ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can see system cost types (organization_id IS NULL) and their own
CREATE POLICY "Users can view system and own cost types"
  ON public.cost_types FOR SELECT
  USING (organization_id IS NULL OR organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert own cost types"
  ON public.cost_types FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()) AND is_system = false);

CREATE POLICY "Users can update own cost types"
  ON public.cost_types FOR UPDATE
  USING (organization_id = get_user_organization_id(auth.uid()) AND is_system = false);

CREATE POLICY "Users can delete own cost types"
  ON public.cost_types FOR DELETE
  USING (organization_id = get_user_organization_id(auth.uid()) AND is_system = false);

-- Add updated_at trigger
CREATE TRIGGER update_cost_types_updated_at
  BEFORE UPDATE ON public.cost_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index
CREATE INDEX idx_cost_types_organization ON public.cost_types(organization_id);

-- Seed system cost types (organization_id = NULL means system-wide)
INSERT INTO public.cost_types (organization_id, name, description, default_distribution_key, is_chargeable, category, is_system) VALUES
  (NULL, 'Heizung', 'Heizkosten gemäß § 7 HeizKV', 'consumption', true, 'heating', true),
  (NULL, 'Warmwasser', 'Warmwasserkosten gemäß § 8 HeizKV', 'consumption', true, 'water', true),
  (NULL, 'Kaltwasser', 'Kosten für Frischwasserversorgung', 'persons', true, 'water', true),
  (NULL, 'Abwasser', 'Kosten für Abwasserentsorgung', 'persons', true, 'water', true),
  (NULL, 'Müllabfuhr', 'Kosten für Müllentsorgung', 'units', true, 'cleaning', true),
  (NULL, 'Straßenreinigung', 'Kosten für öffentliche Straßenreinigung', 'area', true, 'cleaning', true),
  (NULL, 'Hausreinigung', 'Kosten für Reinigung der Gemeinschaftsflächen', 'area', true, 'cleaning', true),
  (NULL, 'Gartenpflege', 'Kosten für Pflege der Außenanlagen', 'area', true, 'cleaning', true),
  (NULL, 'Beleuchtung', 'Allgemeinstrom für Gemeinschaftsflächen', 'units', true, 'other', true),
  (NULL, 'Schornsteinfeger', 'Kosten für Schornsteinfeger und Emissionsmessung', 'units', true, 'heating', true),
  (NULL, 'Versicherung', 'Gebäudeversicherung (Feuer, Wasser, Sturm)', 'area', true, 'insurance', true),
  (NULL, 'Hauswart', 'Kosten für Hausmeisterdienste', 'area', true, 'other', true),
  (NULL, 'Aufzug', 'Wartung und Betrieb der Aufzugsanlage', 'units', true, 'other', true),
  (NULL, 'Grundsteuer', 'Kommunale Grundsteuer', 'area', true, 'taxes', true),
  (NULL, 'Sonstige Betriebskosten', 'Weitere umlagefähige Betriebskosten', 'area', true, 'other', true);