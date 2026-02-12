
-- Add credit_cost and context_pages to calculator_apps
ALTER TABLE public.calculator_apps 
  ADD COLUMN IF NOT EXISTS credit_cost integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS context_pages text[] NOT NULL DEFAULT '{}';

-- Update existing portal tools with credit costs and context pages
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/vertraege/neu","/vertraege"}' WHERE slug = 'kaution-rechner';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/miete/anpassungen"}' WHERE slug = 'mieterhoehung-rechner';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/properties"}' WHERE slug = 'kaufnebenkosten-rechner';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/properties"}' WHERE slug = 'eigenkapital-rechner';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/taxes","/betriebskosten"}' WHERE slug = 'grundsteuer-rechner';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/properties","/dashboard"}' WHERE slug = 'rendite-rechner';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/betriebskosten","/betriebskosten/neu"}' WHERE slug = 'nebenkosten-rechner';

UPDATE calculator_apps SET credit_cost = 3, context_pages = '{"/vertraege","/vertraege/neu"}' WHERE slug = 'formular-mietvertrag';
UPDATE calculator_apps SET credit_cost = 2, context_pages = '{"/uebergaben","/uebergaben/neu"}' WHERE slug = 'formular-uebergabe';
UPDATE calculator_apps SET credit_cost = 2, context_pages = '{"/angebote","/angebote/neu"}' WHERE slug = 'formular-selbstauskunft';
UPDATE calculator_apps SET credit_cost = 3, context_pages = '{"/betriebskosten","/betriebskosten/neu"}' WHERE slug = 'formular-betriebskosten';
UPDATE calculator_apps SET credit_cost = 3, context_pages = '{"/miete/anpassungen"}' WHERE slug = 'formular-mieterhoehung';

UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/miete/anpassungen","/vertraege/neu"}' WHERE slug = 'checker-mietpreisbremse';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/miete/anpassungen"}' WHERE slug = 'checker-mieterhoehung';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/betriebskosten"}' WHERE slug = 'checker-nebenkosten';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/betriebskosten"}' WHERE slug = 'checker-betriebskosten';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/vertraege"}' WHERE slug = 'checker-kuendigung';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/vertraege","/vertraege/neu"}' WHERE slug = 'checker-kaution';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/aufgaben"}' WHERE slug = 'checker-mietminderung';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/vertraege"}' WHERE slug = 'checker-eigenbedarf';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/miete/anpassungen"}' WHERE slug = 'checker-modernisierung';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/uebergaben"}' WHERE slug = 'checker-schoenheitsrep';

-- Also set context for the older apps
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/co2"}' WHERE slug = 'co2-rechner';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/miete/anpassungen"}' WHERE slug = 'mietenplus';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/betriebskosten"}' WHERE slug = 'betriebskosten-helfer';
UPDATE calculator_apps SET credit_cost = 1, context_pages = '{"/properties"}' WHERE slug = 'property-costs';
