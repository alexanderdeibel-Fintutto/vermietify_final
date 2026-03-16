# Vermietify Final - Vollständiger Integrationsplan

## Übersicht

Migration ausgewählter Features aus `vermietify-altausbase` in `vermietify_final`.

**Architektur-Hinweis:** Die alte App nutzt Base44 SDK (`base44.entities.*`), die neue nutzt
Supabase direkt. Jedes Feature muss adaptiert werden:
- Base44 Entity-Aufrufe → Supabase `useQuery` + direkte DB-Queries
- Base44 Deno Functions → Supabase Edge Functions
- Base44 Auth → Supabase Auth (bereits vorhanden in `useAuth`)
- Neue DB-Tabellen via Supabase Migrations
- Alle neuen Seiten: i18n (DE/EN), Shadcn/ui, Tailwind, TypeScript

**Bestehende Patterns in _final (beibehalten):**
- Hooks: `src/hooks/use*.ts` mit `useQuery`/`useMutation`
- Pages: `src/pages/**/*.tsx` (leichtgewichtig, Komposition)
- Components: `src/components/<domain>/*.tsx`
- Edge Functions: `supabase/functions/<name>/index.ts`
- Routing: `src/App.tsx` (React Router v6, ProtectedRoute)
- UI: Shadcn/ui + Tailwind + Lucide Icons
- State: React Query + useAuth Context

---

## Phase 1: Steuer-System (Prio: HÖCHSTE)

Das größte fehlende Modul. Das alte Projekt hat ~150 Seiten dafür.
Wir portieren die Kernfunktionen, nicht alle 150 Varianten.

### 1.1 Datenbank (Migrations)

```
Neue Tabellen:
- tax_profiles          (Steuerprofil pro Jahr/Land)
- tax_declarations      (Steuererklärungen mit Status)
- tax_documents         (Steuerbelege, verknüpft mit documents)
- tax_deductions        (Absetzungen/Werbungskosten)
- tax_deadlines         (Fristen & Termine)
- tax_scenarios         (Szenarien-Vergleiche)
- tax_form_data         (Formulardaten: Anlage V, KAP, SO etc.)
- datev_connections     (DATEV-Sync Verbindungen)
- datev_sync_log        (Sync-Protokoll)
```

### 1.2 Hooks

```
src/hooks/
├── useTaxProfiles.ts       (CRUD Steuerprofile)
├── useTaxDeclarations.ts   (Erklärungen verwalten)
├── useTaxDeductions.ts     (Absetzungen)
├── useTaxDeadlines.ts      (Fristen)
├── useTaxScenarios.ts      (Szenarien-Vergleich)
├── useTaxForms.ts          (Anlage V/KAP/SO Formulardaten)
└── useDatev.ts             (DATEV-Sync)
```

### 1.3 Seiten

```
src/pages/taxes/
├── TaxDashboard.tsx             (Steuer-Übersicht mit KPIs)
├── TaxDashboardDE.tsx           (DE-spezifisch)
├── TaxDashboardAT.tsx           (AT-spezifisch)
├── TaxDashboardCH.tsx           (CH-spezifisch)
├── TaxDeclarations.tsx          (Liste aller Erklärungen)
├── TaxDeclarationDetail.tsx     (Einzelne Erklärung)
├── TaxFilingWizard.tsx          (Schritt-für-Schritt Abgabe)
├── TaxDeductions.tsx            (Absetzungen verwalten)
├── TaxDeadlines.tsx             (Fristen & Kalender)
├── TaxScenarioSimulator.tsx     (Szenarien vergleichen)
├── TaxOptimization.tsx          (Optimierungsvorschläge)
├── TaxFormLibrary.tsx           (Formularbibliothek)
├── TaxLawUpdates.tsx            (Gesetzesänderungen)
├── AnlageVWizard.tsx            (BEREITS VORHANDEN - erweitern)
├── AnlageKAPEditor.tsx          (Kapitalerträge)
├── AnlageSOEditor.tsx           (Sonstige Einkünfte)
├── TaxComplianceChecker.tsx     (Compliance-Prüfung)
├── TaxExportHub.tsx             (Export für Steuerberater)
├── DatevSync.tsx                (DATEV-Verbindung)
└── CrossBorderTax.tsx           (Grenzüberschreitend DACH)
```

### 1.4 Komponenten

```
src/components/tax/
├── TaxProfileCard.tsx
├── TaxYearSelector.tsx
├── TaxCountryTabs.tsx           (DE/AT/CH Tabs)
├── TaxDeductionTable.tsx
├── TaxDeadlineTimeline.tsx
├── TaxScenarioComparison.tsx
├── TaxOptimizationSuggestions.tsx
├── TaxFormWizardSteps.tsx
├── TaxComplianceStatus.tsx
├── TaxLawChangeAlert.tsx
├── TaxExportDialog.tsx
├── TaxAIChatbot.tsx             (Dedizierter Steuer-Bot)
├── AnlageVForm.tsx
├── AnlageKAPForm.tsx
├── AnlageSOForm.tsx
├── DatevSyncStatus.tsx
└── CrossBorderSummary.tsx
```

### 1.5 Edge Functions

```
supabase/functions/
├── tax-validate-data/           (Steuerdaten validieren)
├── tax-generate-report/         (Steuerbericht generieren)
├── tax-optimize-suggestions/    (KI-Optimierungsvorschläge)
├── tax-scenario-calculate/      (Szenarien berechnen)
├── tax-compliance-check/        (Compliance prüfen)
├── tax-export-datev/            (DATEV-Export)
├── tax-import-datev/            (DATEV-Import)
├── tax-deadline-reminders/      (Fristen-Erinnerungen)
└── tax-ai-chatbot/              (Steuer-KI-Chatbot)
```

### 1.6 Routen (App.tsx)

```tsx
// Tax Routes
<Route path="/steuern" element={<TaxDashboard />} />
<Route path="/steuern/de" element={<TaxDashboardDE />} />
<Route path="/steuern/at" element={<TaxDashboardAT />} />
<Route path="/steuern/ch" element={<TaxDashboardCH />} />
<Route path="/steuern/erklaerungen" element={<TaxDeclarations />} />
<Route path="/steuern/erklaerungen/:id" element={<TaxDeclarationDetail />} />
<Route path="/steuern/abgabe" element={<TaxFilingWizard />} />
<Route path="/steuern/absetzungen" element={<TaxDeductions />} />
<Route path="/steuern/fristen" element={<TaxDeadlines />} />
<Route path="/steuern/szenarien" element={<TaxScenarioSimulator />} />
<Route path="/steuern/optimierung" element={<TaxOptimization />} />
<Route path="/steuern/formulare" element={<TaxFormLibrary />} />
<Route path="/steuern/gesetze" element={<TaxLawUpdates />} />
<Route path="/steuern/anlage-v" element={<AnlageVWizard />} />  // bereits vorhanden
<Route path="/steuern/anlage-kap" element={<AnlageKAPEditor />} />
<Route path="/steuern/anlage-so" element={<AnlageSOEditor />} />
<Route path="/steuern/compliance" element={<TaxComplianceChecker />} />
<Route path="/steuern/export" element={<TaxExportHub />} />
<Route path="/steuern/datev" element={<DatevSync />} />
<Route path="/steuern/grenzueberschreitend" element={<CrossBorderTax />} />
```

---

## Phase 2: Finanz- & Vermögensverwaltung (Prio: HOCH)

### 2.1 Datenbank

```
Neue Tabellen:
- portfolios            (Anlageportfolios)
- investments           (Einzelne Investments: Aktien, ETFs, Krypto, etc.)
- investment_transactions (Kauf/Verkauf)
- budgets               (Budget pro Gebäude/Gesamt)
- budget_items           (Budget-Einzelposten)
- invoices              (Rechnungen)
- invoice_items         (Rechnungspositionen)
- financial_forecasts   (Prognosen)
- wealth_snapshots      (Vermögens-Snapshots für Zeitreihe)
```

### 2.2 Hooks

```
src/hooks/
├── usePortfolio.ts          (Portfolio-Verwaltung)
├── useInvestments.ts        (Investment CRUD + Tracking)
├── useBudgets.ts            (Budget-Planung)
├── useInvoices.ts           (Rechnungen)
├── useFinancialForecasts.ts (Prognosen)
└── useWealth.ts             (Vermögensübersicht)
```

### 2.3 Seiten

```
src/pages/finance/
├── FinanceDashboard.tsx         (Finanz-Übersicht, ersetzen/erweitern bestehend)
├── PortfolioDashboard.tsx       (Portfolio-Übersicht)
├── InvestmentTracking.tsx       (Investments verwalten)
├── BudgetManagement.tsx         (Budget-Planung)
├── InvoiceList.tsx              (Rechnungsliste)
├── InvoiceDetail.tsx            (Rechnungsdetail)
├── NewInvoice.tsx               (Neue Rechnung)
├── FinancialForecasting.tsx     (Prognose-Dashboard)
├── WealthDashboard.tsx          (Vermögens-Dashboard)
├── FinancialReporting.tsx       (Finanzberichte)
└── DividendOptimization.tsx     (Dividenden-Optimierung)
```

### 2.4 Komponenten

```
src/components/finance/
├── PortfolioChart.tsx
├── InvestmentTable.tsx
├── BudgetProgressBar.tsx
├── InvoiceForm.tsx
├── InvoicePreview.tsx
├── WealthAllocationChart.tsx
├── ForecastGraph.tsx
├── FinancialKPICards.tsx
├── DividendCalculator.tsx
└── IncomeExpenseChart.tsx
```

### 2.5 Edge Functions

```
supabase/functions/
├── generate-invoice-pdf/
├── analyze-portfolio-risk/
├── calculate-financial-forecast/
├── wealth-report-generate/
└── investment-tax-tracking/
```

---

## Phase 3: Rechner & Kalkulatoren (Prio: HOCH)

### 3.1 Datenbank

```
Neue Tabellen:
- calculation_history    (Berechnungshistorie)
- afa_assets             (AfA-Objekte / Abschreibungsgüter)
```

### 3.2 Hooks

```
src/hooks/
├── useAfaCalculator.ts      (AfA-Berechnung)
├── useCalculationHistory.ts (Berechnungshistorie)
└── usePropertyValuation.ts  (Immobilienbewertung)
```

### 3.3 Seiten

```
src/pages/calculators/
├── CalculatorHub.tsx            (Übersicht aller Rechner)
├── AfACalculator.tsx            (Abschreibungsrechner)
├── AfAAssetManagement.tsx       (AfA-Objekte verwalten)
├── KaufpreisRechner.tsx         (Kaufpreiskalkulator)
├── RenditeRechner.tsx           (Renditeberechnung)
├── TilgungsRechner.tsx          (Tilgungsplan)
├── CashflowRechner.tsx          (Cashflow-Analyse)
├── WertentwicklungsRechner.tsx  (Wertentwicklungs-Prognose)
├── PropertyValuation.tsx        (Immobilienbewertung)
└── CalculationHistory.tsx       (Berechnungshistorie)
```

### 3.4 Komponenten

```
src/components/calculators/
├── CalculatorCard.tsx           (Rechner-Kachel für Hub)
├── AfATable.tsx                 (Abschreibungstabelle)
├── AfAChart.tsx                 (AfA-Verlauf)
├── TilgungsplanTable.tsx        (Tilgungsplan-Tabelle)
├── TilgungsChart.tsx            (Tilgungsverlauf)
├── RenditeChart.tsx             (Rendite-Visualisierung)
├── CashflowChart.tsx            (Cashflow-Diagramm)
├── KaufpreisBreakdown.tsx       (Kaufnebenkosten-Aufschlüsselung)
├── PropertyValuationForm.tsx
└── CalculationHistoryTable.tsx
```

---

## Phase 4: Erweiterte Admin-Features (Prio: HOCH)

### 4.1 Datenbank

```
Neue Tabellen:
- roles                  (Benutzerdefinierte Rollen)
- permissions            (Berechtigungen)
- role_permissions       (Rollen-Berechtigungen Mapping)
- user_roles             (User-Rollen Zuordnung)
- mandants               (Mandanten/Verwaltungseinheiten)
- user_mandants          (User-Mandant Zuordnung)
- modules                (Verfügbare Module)
- module_access          (Modul-Zugang pro Organisation)
- pricing_tiers          (Preisstufen)
- pricing_features       (Features pro Tier)
- beta_testers           (Beta-Tester)
- tester_invitations     (Tester-Einladungen)
```

### 4.2 Hooks

```
src/hooks/
├── useRoles.ts              (Rollen-Verwaltung)
├── usePermissions.ts        (Berechtigungen)
├── useMandants.ts           (Mandantenwechsel)
├── useModules.ts            (Modul-Verwaltung)
├── usePricingAdmin.ts       (Pricing-Administration)
└── useBetaTesters.ts        (Tester-Management)
```

### 4.3 Seiten

```
src/pages/admin/
├── AdminDashboard.tsx           (BEREITS VORHANDEN - erweitern)
├── RoleManagement.tsx           (Rollen verwalten)
├── PermissionManagement.tsx     (Berechtigungen)
├── MandantManagement.tsx        (Mandanten verwalten)
├── MandantSwitcher.tsx          (Mandant wechseln)
├── ModuleManagement.tsx         (Module aktivieren/deaktivieren)
├── PricingAdmin.tsx             (Preise & Tiers verwalten)
├── PricingSimulator.tsx         (Preis-Simulator)
├── BetaTesterManagement.tsx     (Beta-Tester verwalten)
├── UserDetail.tsx               (Benutzer-Detail erweitert)
└── AdminSettings.tsx            (Admin-Einstellungen)
```

### 4.4 Komponenten

```
src/components/admin/
├── RoleEditor.tsx
├── PermissionMatrix.tsx
├── MandantSelector.tsx
├── ModuleToggleCard.tsx
├── PricingTierEditor.tsx
├── PricingFeatureMatrix.tsx
├── TesterInviteDialog.tsx
├── TesterActivityLog.tsx
└── AdminKPICards.tsx
```

### 4.5 Edge Functions

```
supabase/functions/
├── assign-role/
├── check-permission/
├── switch-mandant/
├── activate-module/
├── send-tester-invitation/
├── sync-pricing-to-stripe/
└── validate-module-access/
```

---

## Phase 5: Kommunikation erweitert (Prio: MITTEL-HOCH)

### 5.1 Datenbank

```
Neue Tabellen:
- slack_connections      (Slack-Workspace Verbindungen)
- slack_channels         (Verknüpfte Channels)
- bulk_messages          (Massen-Nachrichten Kampagnen)
- bulk_message_recipients (Empfänger pro Kampagne)
- communication_logs     (Kommunikations-Audit-Log)
- communication_workflows (Kommunikations-Automatisierungen)
```

### 5.2 Hooks

```
src/hooks/
├── useSlack.ts                  (Slack-Integration)
├── useBulkMessaging.ts          (Massen-Nachrichten)
├── useCommunicationLogs.ts      (Audit-Log)
└── useCommunicationWorkflows.ts (Komm.-Automatisierung)
```

### 5.3 Seiten

```
src/pages/communication/
├── CommunicationHub.tsx         (BEREITS VORHANDEN - erweitern)
├── BulkMessaging.tsx            (Massen-Nachrichten)
├── CommunicationAnalytics.tsx   (Kommunikations-Analytics)
├── CommunicationAuditLog.tsx    (Audit-Log)
├── CommunicationWorkflows.tsx   (Automatisierungen)
├── SlackSettings.tsx            (Slack-Einstellungen)
└── SlackDashboard.tsx           (Slack-Übersicht)
```

### 5.4 Edge Functions

```
supabase/functions/
├── send-slack-notification/
├── slack-webhook/
├── send-bulk-messages/
└── log-communication/
```

---

## Phase 6: Compliance & Audit (Prio: MITTEL-HOCH)

### 6.1 Datenbank

```
Neue/Erweiterte Tabellen:
- audit_logs             (BEREITS VORHANDEN - erweitern)
- compliance_checks      (Compliance-Prüfungen)
- compliance_rules       (Compliance-Regeln)
- compliance_violations  (Verstöße)
- audit_assessments      (Audit-Bereitschaftsprüfungen)
- data_retention_policies (Aufbewahrungsfristen)
```

### 6.2 Hooks

```
src/hooks/
├── useCompliance.ts         (Compliance-Checks)
├── useAuditLog.ts           (Audit-Log erweitert, baut auf bestehendem auf)
├── useAuditAssessment.ts    (Audit-Bereitschaft)
└── useDataRetention.ts      (Aufbewahrungsfristen)
```

### 6.3 Seiten

```
src/pages/compliance/
├── ComplianceDashboard.tsx      (Compliance-Übersicht)
├── ComplianceChecklist.tsx      (DACH-Compliance-Checkliste)
├── ComplianceMonitoring.tsx     (Monitoring-Dashboard)
├── AuditLog.tsx                 (BEREITS VORHANDEN - erweitern)
├── AuditReadiness.tsx           (Audit-Bereitschaftsprüfung)
├── AuditReports.tsx             (Audit-Berichte)
├── DataRetention.tsx            (Aufbewahrungsfristen verwalten)
└── ComplianceReporting.tsx      (Compliance-Berichte)
```

### 6.4 Edge Functions

```
supabase/functions/
├── check-compliance/
├── assess-audit-readiness/
├── generate-compliance-report/
└── enforce-data-retention/
```

---

## Phase 7: Erweiterte Berichte & Analytics (Prio: MITTEL)

### 7.1 Datenbank

```
Neue Tabellen:
- report_definitions     (Report-Definitionen)
- report_schedules       (Geplante Reports)
- report_executions      (Report-Ausführungen)
- saved_reports          (Gespeicherte Reports)
- dashboard_widgets      (Custom Dashboard Widgets)
- widget_configurations  (Widget-Konfigurationen)
```

### 7.2 Hooks

```
src/hooks/
├── useReportBuilder.ts      (Report-Builder)
├── useReportSchedules.ts    (Report-Planung)
├── useSavedReports.ts       (Gespeicherte Reports)
├── useCustomDashboard.ts    (Custom Dashboards)
└── useAnalyticsData.ts      (Analytics-Daten)
```

### 7.3 Seiten

```
src/pages/reports/
├── ReportHub.tsx                (Report-Übersicht)
├── ReportBuilder.tsx            (Report-Builder/Editor)
├── ReportDetail.tsx             (Einzelner Report)
├── ReportScheduling.tsx         (Report-Planung)
├── AdvancedAnalytics.tsx        (Erweiterte Analytics)
├── CustomDashboard.tsx          (Custom Dashboard Builder)
├── PerformanceAnalytics.tsx     (Performance-KPIs)
└── AutomatedReports.tsx         (Automatische Reports)
```

### 7.4 Komponenten

```
src/components/reports/
├── ReportBuilderCanvas.tsx      (Drag & Drop Report-Editor)
├── ReportWidgetPalette.tsx      (Widget-Auswahl)
├── ReportPreview.tsx            (Report-Vorschau)
├── ReportScheduleForm.tsx       (Planungs-Formular)
├── ChartWidget.tsx              (Diagramm-Widget)
├── TableWidget.tsx              (Tabellen-Widget)
├── KPIWidget.tsx                (KPI-Karte)
└── FilterPanel.tsx              (Filter-Panel)
```

### 7.5 Edge Functions

```
supabase/functions/
├── generate-report/
├── send-scheduled-report/
├── calculate-analytics/
└── export-report-pdf/
```

---

## Phase 8: Daten-Import/Export erweitert (Prio: MITTEL)

### 8.1 Datenbank

```
Neue Tabellen:
- import_jobs            (Import-Aufträge)
- import_mappings        (Feld-Zuordnungen)
- export_templates       (Export-Vorlagen)
- sync_connections       (Externe Sync-Verbindungen)
- sync_logs              (Sync-Protokolle)
```

### 8.2 Hooks

```
src/hooks/
├── useImportExport.ts       (Erweiterter Import/Export, baut auf bestehendem auf)
├── useSyncConnections.ts    (SharePoint/Google Drive/DATEV Sync)
└── useDataMigration.ts      (Daten-Migration)
```

### 8.3 Seiten

```
src/pages/data/
├── ImportExportHub.tsx          (Import/Export Übersicht)
├── UniversalImport.tsx          (Universal-Import Wizard)
├── ExportCenter.tsx             (Export-Center)
├── SyncConnections.tsx          (Sync-Verbindungen verwalten)
├── SharePointSync.tsx           (SharePoint Integration)
├── GoogleDriveSync.tsx          (Google Drive Integration)
├── DataMigration.tsx            (Daten-Migration Tool)
└── ImportHistory.tsx            (Import-Verlauf)
```

### 8.4 Komponenten

```
src/components/import/          (BEREITS VORHANDEN - erweitern)
├── UniversalImportWizard.tsx    (Multi-Format Wizard)
├── FieldMappingEditor.tsx       (Feld-Zuordnungen)
├── ImportPreviewTable.tsx       (BEREITS VORHANDEN)
├── SyncStatusCard.tsx
├── SyncLogTable.tsx
└── ExportTemplateEditor.tsx
```

### 8.5 Edge Functions

```
supabase/functions/
├── extract-import-data/         (BEREITS VORHANDEN - erweitern)
├── universal-import/
├── sync-sharepoint/
├── sync-google-drive/
├── sync-datev/
└── smart-data-migration/
```

---

## Phase 9: Mieter-Portal stark erweitert (Prio: HOCH)

### 9.1 Datenbank

```
Neue Tabellen:
- tenant_digital_keys    (Digitale Schlüssel)
- tenant_community_posts (Community-Posts)
- tenant_community_comments (Community-Kommentare)
- tenant_satisfaction_surveys (Zufriedenheitsumfragen)
- tenant_survey_responses (Umfrage-Antworten)
- tenant_self_service_requests (Self-Service Anfragen)
- tenant_chatbot_conversations (Chatbot-Gespräche)
```

### 9.2 Hooks

```
src/hooks/
├── useTenantPortal.ts           (BEREITS VORHANDEN - erweitern)
├── useTenantDigitalKey.ts       (Digitaler Schlüssel)
├── useTenantCommunity.ts        (Community-Features)
├── useTenantSatisfaction.ts     (Zufriedenheit)
├── useTenantSelfService.ts      (Self-Service)
└── useTenantChatbot.ts          (Mieter-Chatbot)
```

### 9.3 Seiten (Mieter-Portal)

```
src/pages/tenant-portal/
├── MieterDashboard.tsx          (BEREITS VORHANDEN - erweitern)
├── DefectReport.tsx             (BEREITS VORHANDEN - erweitern)
├── TenantMeterReading.tsx       (BEREITS VORHANDEN)
├── TenantDocuments.tsx          (BEREITS VORHANDEN - erweitern)
├── TenantFinances.tsx           (BEREITS VORHANDEN - erweitern)
├── TenantUnit.tsx               (BEREITS VORHANDEN)
├── TenantCommunity.tsx          (NEU: Community/Schwarzes Brett)
├── TenantChatbot.tsx            (NEU: KI-Chatbot)
├── TenantSelfService.tsx        (NEU: Self-Service Hub)
├── TenantDigitalKey.tsx         (NEU: Digitaler Schlüssel)
├── TenantSatisfaction.tsx       (NEU: Zufriedenheitsumfrage)
├── TenantMessages.tsx           (NEU: Nachrichten-Center)
├── TenantMaintenanceRequests.tsx (NEU: Wartungsanfragen)
└── TenantPaymentHistory.tsx     (NEU: Zahlungsverlauf)
```

### 9.4 Admin-Seiten (Mieter-Portal Verwaltung)

```
src/pages/admin/
├── TenantPortalAdmin.tsx        (Portal-Verwaltung)
├── TenantSurveyAdmin.tsx        (Umfragen verwalten)
├── TenantCommunityAdmin.tsx     (Community moderieren)
└── TenantOnboardingAdmin.tsx    (Onboarding verwalten)
```

### 9.5 Komponenten

```
src/components/tenant-portal/    (BEREITS VORHANDEN - erweitern)
├── TenantPortalNavigation.tsx   (Portal-Navigation erweitert)
├── CommunityFeed.tsx            (Community-Feed)
├── CommunityPostCard.tsx        (Post-Karte)
├── CommunityNewPost.tsx         (Neuer Post)
├── DigitalKeyCard.tsx           (Schlüssel-Karte)
├── SatisfactionSurveyForm.tsx   (Umfrage-Formular)
├── SelfServiceRequestForm.tsx   (Self-Service Formular)
├── TenantChatWidget.tsx         (Chat-Widget)
├── TenantMessageList.tsx        (Nachrichtenliste)
├── TenantPaymentTable.tsx       (Zahlungstabelle)
└── MaintenanceRequestForm.tsx   (Wartungsanfrage)
```

### 9.6 Edge Functions

```
supabase/functions/
├── tenant-chatbot/              (Mieter-KI-Chatbot)
├── tenant-digital-key-generate/ (Schlüssel generieren)
├── tenant-digital-key-verify/   (Schlüssel verifizieren)
├── send-satisfaction-survey/    (Umfrage versenden)
└── tenant-self-service-process/ (Self-Service verarbeiten)
```

### 9.7 Routen

```tsx
// Erweiterte Mieter-Portal Routen
<Route path="/mieter-portal" element={<TenantProtectedRoute />}>
  <Route index element={<MieterDashboard />} />
  <Route path="mangel-melden" element={<DefectReport />} />
  <Route path="zaehler" element={<TenantMeterReading />} />
  <Route path="dokumente" element={<TenantDocuments />} />
  <Route path="finanzen" element={<TenantFinances />} />
  <Route path="wohnung" element={<TenantUnit />} />
  <Route path="community" element={<TenantCommunity />} />
  <Route path="chatbot" element={<TenantChatbot />} />
  <Route path="self-service" element={<TenantSelfService />} />
  <Route path="schluessel" element={<TenantDigitalKey />} />
  <Route path="zufriedenheit" element={<TenantSatisfaction />} />
  <Route path="nachrichten" element={<TenantMessages />} />
  <Route path="wartung" element={<TenantMaintenanceRequests />} />
  <Route path="zahlungen" element={<TenantPaymentHistory />} />
</Route>
```

---

## Phase 10: Weitere fehlende Module (Prio: MITTEL)

### 10.1 Versicherungs-Verwaltung

```
DB:    insurance_policies, insurance_claims
Hook:  useInsurance.ts
Pages: InsuranceDashboard.tsx, InsurancePolicyDetail.tsx, InsuranceClaims.tsx
Comp:  src/components/insurance/
Route: /versicherungen, /versicherungen/:id, /versicherungen/schaeden
```

### 10.2 Energieausweis-Manager

```
DB:    energy_passports, energy_consumption_data
Hook:  useEnergyPassport.ts
Pages: EnergyPassportManager.tsx, EnergyConsumption.tsx
Comp:  src/components/energy/
Route: /energie/ausweise, /energie/verbrauch
```

### 10.3 Buchungssystem

```
DB:    bookings, booking_rules
Hook:  useBookings.ts
Pages: BookingDashboard.tsx, BookingDetail.tsx
Comp:  src/components/bookings/
Route: /buchungen, /buchungen/:id
```

### 10.4 Kündigungs-Management

```
DB:    terminations, termination_templates
Hook:  useTerminations.ts
Pages: TerminationList.tsx, TerminationDetail.tsx, TerminationWizard.tsx
Comp:  src/components/termination/
Route: /kuendigungen, /kuendigungen/:id, /kuendigungen/neu
```

### 10.5 Eigentümer-Verwaltung

```
DB:    owners, owner_properties (Eigentümer-Gebäude Zuordnung)
Hook:  useOwners.ts
Pages: OwnerList.tsx, OwnerDetail.tsx
Comp:  src/components/owners/
Route: /eigentuemer, /eigentuemer/:id
```

### 10.6 Wissensdatenbank

```
DB:    knowledge_articles, knowledge_categories
Hook:  useKnowledgeBase.ts
Pages: KnowledgeBase.tsx, KnowledgeArticle.tsx
Comp:  src/components/knowledge/
Route: /wissen, /wissen/:id
```

### 10.7 Gamification

```
DB:    user_points, achievements, badges
Hook:  useGamification.ts
Pages: GamificationDashboard.tsx
Comp:  src/components/gamification/ (PointsDisplay, AchievementBadge, Leaderboard)
Route: /gamification
```

### 10.8 Vermieter Go (Mobile-optimierte App)

```
Kein separates Projekt - mobile-optimierte Views der bestehenden App:
Pages: VermieterGoApp.tsx (Mobile Hub mit Touch-optimierten Quick Actions)
Comp:  src/components/mobile/ (MobileQuickActions, MobilePropertyCard, MobileTaskList)
Route: /app (mobile-optimierte Ansicht)
```

---

## Sidebar-Navigation (Erweiterung)

Die bestehende Sidebar in `src/components/layout/` muss um folgende Gruppen erweitert werden:

```
Navigation-Struktur (NEU):
├── Dashboard               (bestehend)
├── Immobilien              (bestehend)
│   ├── Gebäude
│   ├── Einheiten
│   └── Eigentümer          (NEU)
├── Mieter                  (bestehend)
│   ├── Mieterliste
│   ├── Kündigungen         (NEU)
│   └── Mieter-Portal       (bestehend, erweitert)
├── Verträge                (bestehend)
│   ├── Vertragsliste
│   └── Angebote
├── Finanzen                (erweitert)
│   ├── Übersicht
│   ├── Zahlungen           (bestehend)
│   ├── Betriebskosten      (bestehend)
│   ├── Rechnungen          (NEU)
│   ├── Budget              (NEU)
│   ├── Banking             (bestehend)
│   └── Portfolio           (NEU)
├── Steuern                 (NEU - komplett)
│   ├── Dashboard
│   ├── Erklärungen
│   ├── Formulare
│   ├── Optimierung
│   ├── ELSTER              (bestehend)
│   ├── DATEV               (NEU)
│   └── Compliance          (NEU)
├── Rechner                 (NEU)
│   ├── AfA
│   ├── Rendite
│   ├── Kaufpreis
│   ├── Tilgung
│   └── Cashflow
├── Kommunikation           (erweitert)
│   ├── E-Mail              (bestehend)
│   ├── WhatsApp            (bestehend)
│   ├── Briefe              (bestehend)
│   ├── Slack               (NEU)
│   └── Massen-Nachrichten  (NEU)
├── Dokumente               (bestehend)
├── Berichte                (NEU)
│   ├── Report-Builder
│   ├── Analytics
│   └── Geplante Reports
├── Daten                   (NEU)
│   ├── Import/Export
│   └── Sync-Verbindungen
├── Zähler                  (bestehend)
├── Energie                 (NEU)
├── Versicherungen          (NEU)
├── Aufgaben                (bestehend)
├── Kalender                (bestehend)
├── Automatisierung         (bestehend)
├── Wissen                  (NEU)
└── Admin                   (erweitert)
    ├── Dashboard           (bestehend)
    ├── Benutzer            (bestehend)
    ├── Rollen              (NEU)
    ├── Mandanten           (NEU)
    ├── Module              (NEU)
    ├── Pricing             (NEU)
    ├── Beta-Tester         (NEU)
    └── Audit               (bestehend, erweitert)
```

---

## Implementierungsreihenfolge & Aufwand

| Phase | Modul | Aufwand | Neue Dateien (ca.) |
|-------|-------|---------|--------------------|
| 1 | Steuer-System | XL | ~50 Dateien |
| 2 | Finanz- & Vermögensverwaltung | L | ~30 Dateien |
| 3 | Rechner & Kalkulatoren | M | ~22 Dateien |
| 4 | Erweiterte Admin-Features | L | ~30 Dateien |
| 5 | Kommunikation erweitert | M | ~18 Dateien |
| 6 | Compliance & Audit | M | ~18 Dateien |
| 7 | Erweiterte Berichte & Analytics | L | ~22 Dateien |
| 8 | Daten-Import/Export | M | ~16 Dateien |
| 9 | Mieter-Portal erweitert | L | ~35 Dateien |
| 10 | Weitere Module | L | ~35 Dateien |
| **GESAMT** | | | **~276 neue Dateien** |

### Pro Phase werden erstellt:
1. Supabase Migration(s) für neue Tabellen
2. Custom Hooks (React Query basiert)
3. Page-Komponenten (leichtgewichtig, Komposition)
4. Feature-Komponenten (domänenspezifisch)
5. Edge Functions (wo Backend-Logik nötig)
6. Routen in App.tsx
7. i18n Übersetzungen (de.json + en.json)
8. Sidebar-Navigation erweitern

---

## Querschnitts-Aufgaben (bei jeder Phase)

- [ ] i18n: Alle neuen Strings in de.json + en.json
- [ ] Sidebar: Navigation für neue Module ergänzen
- [ ] Permissions: Neue Seiten in ProtectedRoute/AdminProtectedRoute einbinden
- [ ] Tests: Grundlegende Tests für Hooks und kritische Komponenten
- [ ] Responsive: Mobile-Optimierung (Shadcn/ui + Tailwind)
- [ ] Dark Mode: Alle neuen Komponenten dark-mode-kompatibel
