
# Stripe Subscription Integration Plan

## Uebersicht

Implementierung einer vollstaendigen Stripe-Subscription-Integration fuer Vermietify mit Pricing-Seite, Checkout-Flow, Webhook-Handling und Feature-Gating.

---

## Phase 1: Stripe Aktivierung

### 1.1 Stripe Integration aktivieren
- Lovable's native Stripe-Integration aktivieren
- Stripe Secret Key konfigurieren (wird vom User eingegeben)
- Stripe Public Key als Environment Variable speichern

---

## Phase 2: Datenbank-Schema

### 2.1 User Subscriptions Tabelle erstellen

```text
+-------------------------+
|   user_subscriptions    |
+-------------------------+
| id (UUID, PK)          |
| user_id (UUID)         |
| stripe_customer_id     |
| stripe_subscription_id |
| app_id                 |
| plan_id                |
| status                 |
| current_period_start   |
| current_period_end     |
| cancel_at_period_end   |
| created_at             |
| updated_at             |
+-------------------------+
```

### 2.2 RLS Policies
- SELECT: User sieht nur eigene Subscriptions
- INSERT/UPDATE/DELETE: Nur via Service Role (Webhook)

---

## Phase 3: Backend (Edge Functions)

### 3.1 create-checkout-session
- Erstellt Stripe Checkout Session
- Erstellt/holt stripe_customer_id fuer User
- Gibt Checkout URL zurueck

### 3.2 stripe-webhook
- Verarbeitet Stripe Events
- checkout.session.completed -> Subscription erstellen
- customer.subscription.updated -> Status aktualisieren
- customer.subscription.deleted -> Subscription deaktivieren

### 3.3 create-portal-session
- Erstellt Stripe Customer Portal Session
- Fuer Plan-Aenderungen und Kuendigungen

---

## Phase 4: Frontend Komponenten

### 4.1 Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| src/pages/Pricing.tsx | Pricing-Seite mit Plan-Karten |
| src/pages/PaymentSuccess.tsx | Erfolgs-Seite nach Zahlung |
| src/hooks/useSubscription.tsx | Hook fuer Subscription-Status |
| src/components/subscription/PricingCard.tsx | Einzelne Plan-Karte |
| src/components/subscription/UpgradePrompt.tsx | Upgrade-Aufforderung |
| src/components/subscription/BillingToggle.tsx | Monatlich/Jaehrlich Toggle |
| src/lib/stripe.ts | Stripe Helper-Funktionen |
| src/config/plans.ts | Plan-Konfiguration |

### 4.2 Pricing Page Features
- Monatlich/Jaehrlich Toggle (20% Rabatt)
- 4 Plan-Karten: Free, Basic, Pro, Business
- Dynamische CTA-Buttons basierend auf User-Status
- Responsive Design

### 4.3 Plan Konfiguration

```text
FREE     - 0 EUR     - 1 Immobilie, 5 Einheiten
BASIC    - 9.99 EUR  - 3 Immobilien, 25 Einheiten
PRO      - 24.99 EUR - 10 Immobilien, 100 Einheiten
BUSINESS - 49.99 EUR - Unbegrenzt
```

### 4.4 useSubscription Hook
- Laedt aktuelle Subscription
- Stellt plan, isPro, isActive bereit
- Caching mit React Query

### 4.5 UpgradePrompt Komponente
- Wird bei Pro-Features angezeigt
- Link zur Pricing-Seite
- Erklaert Feature-Vorteile

---

## Phase 5: Routing & Navigation

### 5.1 Neue Routes
- /pricing - Pricing-Seite (oeffentlich)
- /payment-success - Erfolgs-Seite (protected)

### 5.2 Navigation Update
- Link zur Pricing-Seite in Sidebar
- "Upgrade" Button in Settings

---

## Technische Details

### Edge Function: create-checkout-session

```text
Request:
POST /create-checkout-session
{
  priceId: string,
  successUrl: string,
  cancelUrl: string
}

Response:
{
  url: string (Stripe Checkout URL)
}
```

### Edge Function: stripe-webhook

```text
Events verarbeitet:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

### Edge Function: create-portal-session

```text
Request:
POST /create-portal-session
{
  returnUrl: string
}

Response:
{
  url: string (Stripe Portal URL)
}
```

---

## Implementierungs-Reihenfolge

1. Stripe Integration aktivieren
2. Datenbank-Migration ausfuehren
3. Edge Functions erstellen und deployen
4. Plan-Konfiguration erstellen
5. useSubscription Hook implementieren
6. Pricing-Seite erstellen
7. Success-Seite erstellen
8. UpgradePrompt Komponente erstellen
9. Routing aktualisieren
10. Navigation anpassen
11. Ende-zu-Ende testen

---

## Sicherheitshinweise

- Webhook-Signatur-Verifizierung
- RLS Policies fuer Subscriptions
- Service Role nur fuer Webhooks
- Keine sensiblen Daten im Frontend
