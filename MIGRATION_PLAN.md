# Fintutto Repository Consolidation Plan

## Ziel: Nur 2 Repos behalten

| Repo | Zweck | Status |
|------|-------|--------|
| **portal** | Monorepo mit ALLEN Apps | Ziel-Repo |
| **translator** | Übersetzer-App (125 MB, eigenständig) | Bleibt |

Alle anderen 50 Repos werden archiviert oder gelöscht.

---

## Phase 1: Portal-Repo vorbereiten

### 1.1 Shared Packages ins Portal migrieren
Aus `vermietify_final` müssen diese Packages ins Portal:

```
packages/
├── ui/          → 40+ Radix UI Komponenten (@fintutto/ui)
├── shared/      → Hooks, Utils, Types (@fintutto/shared)
└── supabase/    → Client + Schema Types (@fintutto/supabase)
```

**Wichtig:** Alle 3 Apps teilen sich diese Packages. Ohne sie funktioniert nichts.

### 1.2 Supabase-Infrastruktur migrieren

```
supabase/
├── config.toml          → Projekt-ID: ayzfkorcqkbwgdpqvome
├── functions/ (35 Edge Functions)
│   ├── ai-chat/
│   ├── analyze-document/
│   ├── check-subscription/
│   ├── create-checkout/
│   ├── customer-portal/
│   ├── send-letter/
│   ├── send-tenant-email/
│   ├── send-whatsapp/
│   ├── finapi-connect/
│   ├── finapi-sync/
│   ├── validate-elster-data/
│   ├── generate-elster-xml/
│   ├── submit-to-elster/
│   └── ... (20+ weitere)
└── migrations/ (56 SQL Migrations)
```

### 1.3 Monorepo-Tooling
- `turbo.json` — Build-Pipeline
- `pnpm-workspace.yaml` — Workspace-Config
- Root `package.json` — Scripts & Dependencies
- Root `tsconfig.json` — TypeScript References

---

## Phase 2: Apps migrieren

### Aus vermietify_final → portal/apps/

| App | Quelle | Ziel | Aktion |
|-----|--------|------|--------|
| vermietify | `apps/vermietify` | `portal/apps/vermietify` | Voll migrieren (50+ Seiten) |
| bescheidboxer | `apps/bescheidboxer` | `portal/apps/bescheidboxer` | Voll migrieren (Bürgergeld) |
| financial-compass | `apps/financial-compass` | `portal/apps/financial-compass` | Voll migrieren (Buchhaltung) |

### Aus anderen aktiven Repos → portal/apps/

| Repo | App-Name im Portal | Status |
|------|-------------------|--------|
| bescheidboxer (standalone) | `apps/steuer-bescheidboxer` | Prüfen ob Duplikat zu apps/bescheidboxer |
| hausmeisterPro | `apps/hausmeister` | Migrieren |
| mieter | `apps/mieter` | Migrieren |
| LernApp | `apps/lernapp` | Migrieren |
| Personaltrainer | `apps/personaltrainer` | Migrieren |
| luggageX | `apps/luggage` | Migrieren |
| zimmerpflanze | `apps/zimmerpflanze` | Migrieren |
| fintutto-your-financial-compass | Prüfen | Evtl. Duplikat zu apps/financial-compass |
| ablesung | `apps/ablesung` | Migrieren (Zählerstand-OCR) |
| admin | `apps/admin` | Migrieren |
| cloud | `packages/cloud` oder Infra | Prüfen |
| fintutto-command-center | `apps/command-center` | Migrieren |
| guidetranslator-sales | `apps/translator-sales` | Migrieren (Sales Page) |
| a-docs | `docs/` | Dokumentation migrieren |

---

## Phase 3: Repos aufräumen

### Sofort löschbar (archiviert + leer, 5 Repos)
- `vermietify`
- `FT_CALC_RENDITE`
- `ft_ocr_zaehler`
- `ft_hausmeister`
- `fintutto-admin-hub`

### Archivieren nach Migration (aktive Repos, 12 Repos)
Nach erfolgreicher Migration ins Portal:
- `vermietify_final`
- `bescheidboxer` (standalone)
- `bescheid-boxer` + `bescheid-boxer-a40c1def`
- `fintutto-your-financial-compass`
- `hausmeisterPro`
- `mieter`
- `LernApp`
- `Personaltrainer`
- `luggageX`
- `zimmerpflanze`
- `ablesung`
- `admin`, `cloud`, `fintutto-command-center`
- `guidetranslator-sales`
- `a-docs`

### Bereits archiviert (31 Repos) — Behalten oder löschen
Alte Base44-Exporte und Duplikate. Können gelöscht werden:

**Duplikate:**
- `miet-check-pro` + `miet-check-pro-458b8dcf` + `miet-check-pro-87`
- `kaution-klar` + `mietkaution-klar`
- `my-deposit-calculator` + `deposit-check-pro`
- `ft_mieter` (→ mieter)
- `ft_hausmeisterPro` (→ hausmeisterPro)
- `ft_vermietify` + `vermietify-altausbase` (→ vermietify_final)

**Alte Einzel-Tools (alle in financial-compass konsolidiert):**
- `ft_nebenkostenabrechnung`
- `betriebskosten`
- `fintutto-rent-wizard`
- `mietenplus-rechner`
- `check-mieterhoehung2-fintutto`
- `fintutto-miet-recht`
- `your-property-costs`
- `property-equity-partner`
- `grundsteuer-easy`
- `property-calc-hub`
- `schoenheit-fintutto`
- `rent-check-buddy`
- `k-ndigungs-check-pro`
- `ft_fromulare_alle`
- `ft_calc_rendite-9bb37c94`
- `Google-API-f-r-Fintutto`

---

## Phase 4: Verifizierung

- [ ] Alle Apps im Portal builden (`pnpm build`)
- [ ] Alle Supabase Functions deployen
- [ ] DB-Migrationen verifizieren
- [ ] CI/CD Pipeline einrichten
- [ ] Alte Repos archivieren
- [ ] DNS/Hosting auf Portal umstellen

---

## Tech-Stack (bleibt gleich)

| Kategorie | Technologie |
|-----------|-------------|
| Frontend | React 18.3, Vite 5.4, TypeScript |
| UI | Radix UI + Tailwind CSS 3.4 |
| State | React Hook Form, TanStack Query |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Monorepo | pnpm 9.15, Turborepo 2.5 |
| Banking | FinAPI |
| Steuer | ELSTER-Integration |
| Kommunikation | WhatsApp, E-Mail, Briefversand |

---

## Priorität / Reihenfolge

1. **JETZT:** Packages (ui, shared, supabase) + Supabase-Infra ins Portal
2. **DANN:** vermietify, bescheidboxer, financial-compass migrieren
3. **DANACH:** Kleinere Apps (hausmeister, mieter, etc.) migrieren
4. **ZULETZT:** Alte Repos löschen/archivieren
