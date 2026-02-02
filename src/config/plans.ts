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
    productId: 'prod_starter',
    features: [
      '1 Immobilie',
      '5 Einheiten',
      'Basis-Dashboards',
      'E-Mail-Support',
    ],
    limits: {
      properties: 1,
      units: 5,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfekt für kleine Vermieter',
    priceMonthly: 9.99,
    priceYearly: 95.90,
    priceId: 'price_1Sr56K52lqSgjCzeqfCfOudX',
    productId: 'prod_basic',
    features: [
      '3 Immobilien',
      '25 Einheiten',
      'Alle Dashboards',
      'Dokumentenverwaltung',
      'E-Mail-Support',
    ],
    limits: {
      properties: 3,
      units: 25,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Für professionelle Vermieter',
    priceMonthly: 24.99,
    priceYearly: 239.90,
    priceId: 'price_1Sr56o52lqSgjCzeRuGrant2',
    productId: 'prod_pro',
    features: [
      '10 Immobilien',
      '100 Einheiten',
      'Alle Dashboards',
      'Dokumentenverwaltung',
      'Nebenkostenabrechnung',
      'Prioritäts-Support',
    ],
    limits: {
      properties: 10,
      units: 100,
    },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Für große Portfolios',
    priceMonthly: 49.99,
    priceYearly: 479.90,
    priceId: 'price_1Sr57E52lqSgjCze3iHixnBn',
    productId: 'prod_enterprise',
    features: [
      'Unbegrenzte Immobilien',
      'Unbegrenzte Einheiten',
      'Alle Features',
      'API-Zugang',
      'Dedizierter Support',
      'Custom Branding',
    ],
    limits: {
      properties: Infinity,
      units: Infinity,
    },
  },
];

export const getPlanById = (planId: string): Plan | undefined => {
  return PLANS.find((plan) => plan.id === planId);
};

export const getPlanByProductId = (productId: string): Plan | undefined => {
  return PLANS.find((plan) => plan.productId === productId);
};
