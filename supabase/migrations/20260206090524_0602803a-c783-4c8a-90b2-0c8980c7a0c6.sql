-- Seed standard BetrKV (Betriebskostenverordnung) cost types
-- These are system cost types available to all organizations

INSERT INTO public.cost_types (name, description, default_distribution_key, is_chargeable, category, is_system, organization_id)
VALUES
  -- § 2 Nr. 1 - Grundsteuer
  ('Grundsteuer', 'Laufende öffentliche Lasten des Grundstücks (§ 2 Nr. 1 BetrKV)', 'area', true, 'taxes', true, NULL),
  
  -- § 2 Nr. 2 - Wasserversorgung
  ('Wasserversorgung', 'Kosten für die Wasserversorgung inkl. Grundgebühren (§ 2 Nr. 2 BetrKV)', 'persons', true, 'water', true, NULL),
  
  -- § 2 Nr. 3 - Entwässerung
  ('Entwässerung', 'Gebühren für die Haus- und Grundstücksentwässerung (§ 2 Nr. 3 BetrKV)', 'persons', true, 'water', true, NULL),
  
  -- § 2 Nr. 4 - Heizung
  ('Heizkosten', 'Kosten des Betriebs der zentralen Heizungsanlage (§ 2 Nr. 4 BetrKV)', 'consumption', true, 'heating', true, NULL),
  
  -- § 2 Nr. 5 - Warmwasser
  ('Warmwasser', 'Kosten der zentralen Warmwasserversorgungsanlage (§ 2 Nr. 5 BetrKV)', 'consumption', true, 'heating', true, NULL),
  
  -- § 2 Nr. 6 - Verbundene Anlagen
  ('Verbundene Heizung/Warmwasser', 'Kosten verbundener Heizungs- und Warmwasserversorgungsanlagen (§ 2 Nr. 6 BetrKV)', 'consumption', true, 'heating', true, NULL),
  
  -- § 2 Nr. 7 - Aufzug
  ('Aufzug', 'Kosten des Betriebs des Aufzugs (§ 2 Nr. 7 BetrKV)', 'units', true, 'other', true, NULL),
  
  -- § 2 Nr. 8 - Müllbeseitigung
  ('Müllabfuhr', 'Kosten der Müllbeseitigung (§ 2 Nr. 8 BetrKV)', 'persons', true, 'cleaning', true, NULL),
  
  -- § 2 Nr. 9 - Straßenreinigung
  ('Straßenreinigung', 'Kosten der Straßenreinigung und Winterdienst (§ 2 Nr. 9 BetrKV)', 'area', true, 'cleaning', true, NULL),
  
  -- § 2 Nr. 10 - Gebäudereinigung
  ('Gebäudereinigung', 'Kosten der Reinigung von Gebäudeteilen (§ 2 Nr. 9 BetrKV)', 'area', true, 'cleaning', true, NULL),
  
  -- § 2 Nr. 10 - Gartenpflege
  ('Gartenpflege', 'Kosten der Gartenpflege (§ 2 Nr. 10 BetrKV)', 'area', true, 'other', true, NULL),
  
  -- § 2 Nr. 11 - Beleuchtung
  ('Allgemeinstrom', 'Kosten der Beleuchtung und Strom für gemeinschaftliche Anlagen (§ 2 Nr. 11 BetrKV)', 'units', true, 'other', true, NULL),
  
  -- § 2 Nr. 12 - Schornsteinfeger
  ('Schornsteinfeger', 'Kosten der Schornsteinreinigung (§ 2 Nr. 12 BetrKV)', 'units', true, 'other', true, NULL),
  
  -- § 2 Nr. 13 - Sachversicherungen
  ('Gebäudeversicherung', 'Kosten der Sach- und Haftpflichtversicherung (§ 2 Nr. 13 BetrKV)', 'area', true, 'insurance', true, NULL),
  
  -- § 2 Nr. 14 - Hausmeister
  ('Hauswart', 'Kosten für den Hauswart/Hausmeister (§ 2 Nr. 14 BetrKV)', 'area', true, 'other', true, NULL),
  
  -- § 2 Nr. 15 - Gemeinschaftsantenne/Breitband
  ('Kabelanschluss', 'Kosten des Betriebs der Gemeinschafts-Antennenanlage oder Breitbandnetz (§ 2 Nr. 15 BetrKV)', 'units', true, 'other', true, NULL),
  
  -- § 2 Nr. 16 - Wäschepflege
  ('Waschraum', 'Kosten des Betriebs der Einrichtungen für die Wäschepflege (§ 2 Nr. 16 BetrKV)', 'units', true, 'other', true, NULL),
  
  -- § 2 Nr. 17 - Sonstige
  ('Sonstige Betriebskosten', 'Sonstige Betriebskosten gemäß § 2 Nr. 17 BetrKV', 'units', true, 'other', true, NULL)
  
ON CONFLICT DO NOTHING;