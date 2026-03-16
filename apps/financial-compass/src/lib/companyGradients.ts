// 6 gradient presets derived from the app's gold-purple spectrum
export const COMPANY_GRADIENTS = [
  {
    name: 'Gold',
    gradient: 'linear-gradient(135deg, hsl(38 92% 50% / 0.25) 0%, hsl(28 80% 40% / 0.15) 100%)',
    accent: 'hsl(38 92% 50%)',
    borderColor: 'hsl(38 92% 50% / 0.3)',
  },
  {
    name: 'Violett',
    gradient: 'linear-gradient(135deg, hsl(261 72% 50% / 0.25) 0%, hsl(280 60% 40% / 0.15) 100%)',
    accent: 'hsl(261 72% 50%)',
    borderColor: 'hsl(261 72% 50% / 0.3)',
  },
  {
    name: 'Indigo',
    gradient: 'linear-gradient(135deg, hsl(234 89% 60% / 0.25) 0%, hsl(243 75% 50% / 0.15) 100%)',
    accent: 'hsl(234 89% 60%)',
    borderColor: 'hsl(234 89% 60% / 0.3)',
  },
  {
    name: 'Smaragd',
    gradient: 'linear-gradient(135deg, hsl(160 84% 39% / 0.25) 0%, hsl(170 60% 30% / 0.15) 100%)',
    accent: 'hsl(160 84% 39%)',
    borderColor: 'hsl(160 84% 39% / 0.3)',
  },
  {
    name: 'Rose',
    gradient: 'linear-gradient(135deg, hsl(330 80% 55% / 0.25) 0%, hsl(340 70% 45% / 0.15) 100%)',
    accent: 'hsl(330 80% 55%)',
    borderColor: 'hsl(330 80% 55% / 0.3)',
  },
  {
    name: 'Bernstein',
    gradient: 'linear-gradient(135deg, hsl(20 90% 50% / 0.25) 0%, hsl(15 80% 40% / 0.15) 100%)',
    accent: 'hsl(20 90% 50%)',
    borderColor: 'hsl(20 90% 50% / 0.3)',
  },
] as const;

export type CompanyGradientIndex = 0 | 1 | 2 | 3 | 4 | 5;

export function getCompanyGradient(themeIndex: number = 0) {
  return COMPANY_GRADIENTS[themeIndex % COMPANY_GRADIENTS.length];
}

export function getCompanyShortName(name: string): string {
  // For "Privat" area
  if (!name) return '?';
  
  // Remove common suffixes
  const cleaned = name
    .replace(/\s*–\s*Privat$/, '')
    .replace(/\s*(GmbH|UG|AG|KG|OHG|GbR|e\.K\.)$/i, '')
    .trim();
  
  // If short enough, return as-is
  if (cleaned.length <= 12) return cleaned;
  
  // Otherwise abbreviate
  return cleaned.slice(0, 10) + '…';
}
