export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  priceId: string;
  priceIdYearly?: string;
  productId: string;
  features: string[];
  limits: {
    properties: number;
    units: number;
  };
  portalCredits: number; // -1 = unlimited
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Für den Einstieg',
    priceMonthly: 0,
    priceYearly: 0,
    priceId: 'price_1Sr55p52lqSgjCzeX6tlI5tv',
    priceIdYearly: '',
    productId: 'prod_starter', // TODO: Replace with real Stripe Product ID
    features: [
      '1 Immobilie',
      '5 Einheiten',
      'Basis-Dashboards',
      'E-Mail-Support',
      '3 Portal-Credits/Monat',
    ],
    limits: {
      properties: 1,
      units: 5,
    },
    portalCredits: 3,
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfekt für kleine Vermieter',
    priceMonthly: 9.99,
    priceYearly: 95.90,
    priceId: 'price_1Sr56K52lqSgjCzeqfCfOudX',
    priceIdYearly: '', // TODO: Create yearly price in Stripe Dashboard
    productId: 'prod_basic', // TODO: Replace with real Stripe Product ID
    features: [
      '3 Immobilien',
      '25 Einheiten',
      'Alle Dashboards',
      'Dokumentenverwaltung',
      'E-Mail-Support',
      '10 Portal-Credits/Monat',
    ],
    limits: {
      properties: 3,
      units: 25,
    },
    portalCredits: 10,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Für professionelle Vermieter',
    priceMonthly: 24.99,
    priceYearly: 239.90,
    priceId: 'price_1Sr56o52lqSgjCzeRuGrant2',
    priceIdYearly: '', // TODO: Create yearly price in Stripe Dashboard
    productId: 'prod_pro', // TODO: Replace with real Stripe Product ID
    features: [
      '10 Immobilien',
      '100 Einheiten',
      'Alle Dashboards',
      'Dokumentenverwaltung',
      'Nebenkostenabrechnung',
      'Prioritäts-Support',
      '30 Portal-Credits/Monat',
    ],
    limits: {
      properties: 10,
      units: 100,
    },
    portalCredits: 30,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Für große Portfolios',
    priceMonthly: 49.99,
    priceYearly: 479.90,
    priceId: 'price_1Sr57E52lqSgjCze3iHixnBn',
    priceIdYearly: '', // TODO: Create yearly price in Stripe Dashboard
    productId: 'prod_enterprise', // TODO: Replace with real Stripe Product ID
    features: [
      'Unbegrenzte Immobilien',
      'Unbegrenzte Einheiten',
      'Alle Features',
      'API-Zugang',
      'Dedizierter Support',
      'Custom Branding',
      'Unbegrenzte Portal-Credits',
    ],
    limits: {
      properties: Infinity,
      units: Infinity,
    },
    portalCredits: -1,
  },
];

export const getPlanById = (planId: string): Plan | undefined => {
  return PLANS.find((plan) => plan.id === planId);
};

export const getPlanByProductId = (productId: string): Plan | undefined => {
  return PLANS.find((plan) => plan.productId === productId);
};
