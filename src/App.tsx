import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OnboardingWizard from "./pages/auth/OnboardingWizard";
import OnboardingWizardPage from "./pages/onboarding/OnboardingWizardPage";

// App Pages
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import Finances from "./pages/Finances";
import Documents from "./pages/Documents";
import Billing from "./pages/Billing";
import Taxes from "./pages/Taxes";
import Communication from "./pages/Communication";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";

// Building & Unit Pages
import BuildingDetail from "./pages/buildings/BuildingDetail";
import UnitDetail from "./pages/einheiten/UnitDetail";
import UnitsList from "./pages/units/UnitsList";
import TenantDetailNew from "./pages/mieter/TenantDetail";

// Contract Pages
import ContractList from "./pages/contracts/ContractList";
import ContractDetail from "./pages/contracts/ContractDetail";
import NewContract from "./pages/contracts/NewContract";

// Payment & Operating Cost Pages
import PaymentList from "./pages/payments/PaymentList";
import OperatingCosts from "./pages/betriebskosten";
import NewBilling from "./pages/betriebskosten/neu";
import OperatingCostDetail from "./pages/betriebskosten/[id]";
import CostTypes from "./pages/betriebskosten/kostenarten";

// Meter Pages
import MeterList from "./pages/zaehler";
import MeterDetail from "./pages/zaehler/[id]";
import Auswertung from "./pages/zaehler/Auswertung";

// Task Pages
import TaskList from "./pages/tasks/TaskList";
import TaskDetail from "./pages/tasks/TaskDetail";
import NewTask from "./pages/tasks/NewTask";

// Calendar
import CalendarPage from "./pages/calendar/CalendarPage";

// Letter Pages
import LetterManagement from "./pages/letters/LetterManagement";
import LetterSettings from "./pages/letters/LetterSettings";
import LetterTemplates from "./pages/letters/LetterTemplates";

// Signature Pages
import SignatureManagement from "./pages/signatures/SignatureManagement";

// WhatsApp Pages
import WhatsAppDashboard from "./pages/whatsapp/WhatsAppDashboard";

// Banking Pages
import BankingDashboard from "./pages/banking/BankingDashboard";
import BankConnect from "./pages/banking/BankConnect";
import BankTransactions from "./pages/banking/Transactions";
import MatchingRules from "./pages/banking/MatchingRules";

// Tax Pages (existing)
import AnlageVWizard from "./pages/taxes/AnlageVWizard";
import TaxDocuments from "./pages/taxes/TaxDocuments";
import AITaxAdvisor from "./pages/taxes/AITaxAdvisor";

// Tax Pages (NEW - Phase 1)
import TaxDashboard from "./pages/taxes/TaxDashboard";
import TaxDeclarations from "./pages/taxes/TaxDeclarations";
import TaxDeductions from "./pages/taxes/TaxDeductions";
import TaxDeadlines from "./pages/taxes/TaxDeadlines";
import TaxScenarioSimulator from "./pages/taxes/TaxScenarioSimulator";
import TaxOptimization from "./pages/taxes/TaxOptimization";
import TaxFormLibrary from "./pages/taxes/TaxFormLibrary";
import AnlageKAPEditor from "./pages/taxes/AnlageKAPEditor";
import AnlageSOEditor from "./pages/taxes/AnlageSOEditor";
import TaxComplianceChecker from "./pages/taxes/TaxComplianceChecker";
import TaxExportHub from "./pages/taxes/TaxExportHub";
import DatevSync from "./pages/taxes/DatevSync";

// ELSTER Pages
import ElsterDashboard from "./pages/elster/ElsterDashboard";
import ElsterSubmit from "./pages/elster/ElsterSubmit";

// Finance Pages (NEW - Phase 2)
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import InvoiceList from "./pages/finance/InvoiceList";
import InvoiceDetail from "./pages/finance/InvoiceDetail";
import NewInvoice from "./pages/finance/NewInvoice";
import BudgetManagement from "./pages/finance/BudgetManagement";
import PortfolioDashboard from "./pages/finance/PortfolioDashboard";
import WealthDashboard from "./pages/finance/WealthDashboard";

// Calculator Pages (NEW - Phase 3)
import CalculatorHub from "./pages/calculators/CalculatorHub";
import AfACalculator from "./pages/calculators/AfACalculator";
import KaufpreisRechner from "./pages/calculators/KaufpreisRechner";
import RenditeRechner from "./pages/calculators/RenditeRechner";
import TilgungsRechner from "./pages/calculators/TilgungsRechner";
import CashflowRechner from "./pages/calculators/CashflowRechner";
import WertentwicklungsRechner from "./pages/calculators/WertentwicklungsRechner";

// Admin Pages (existing + NEW Phase 4)
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import OrgManagement from "./pages/admin/OrgManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import PermissionManagement from "./pages/admin/PermissionManagement";
import ModuleManagement from "./pages/admin/ModuleManagement";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";

// Communication Pages (existing + NEW Phase 5)
import EmailTemplates from "./pages/communication/EmailTemplates";
import ComposeEmail from "./pages/communication/ComposeEmail";
import EmailHistory from "./pages/communication/EmailHistory";
import BulkMessaging from "./pages/communication/BulkMessaging";
import CommunicationAnalytics from "./pages/communication/CommunicationAnalytics";

// Compliance Pages (NEW - Phase 6)
import ComplianceDashboard from "./pages/compliance/ComplianceDashboard";
import ComplianceChecklist from "./pages/compliance/ComplianceChecklist";
import AuditReadiness from "./pages/compliance/AuditReadiness";

// Report Pages (NEW - Phase 7)
import ReportHub from "./pages/reports/ReportHub";
import ReportBuilder from "./pages/reports/ReportBuilder";
import AdvancedAnalytics from "./pages/reports/AdvancedAnalytics";

// Data Import/Export Pages (NEW - Phase 8)
import ImportExportHub from "./pages/data/ImportExportHub";
import UniversalImport from "./pages/data/UniversalImport";

// Handover Pages
import HandoverList from "./pages/handover/HandoverList";
import NewHandover from "./pages/handover/NewHandover";
import HandoverProtocol from "./pages/handover/HandoverProtocol";
import HandoverPDF from "./pages/handover/HandoverPDF";

// Rent Adjustment Pages
import RentAdjustments from "./pages/rent/RentAdjustments";

// CO2 Pages
import CO2Dashboard from "./pages/co2/CO2Dashboard";

// Tenant Portal Pages (existing + NEW Phase 9)
import MieterDashboard from "./pages/tenant-portal/MieterDashboard";
import DefectReport from "./pages/tenant-portal/DefectReport";
import TenantMeterReading from "./pages/tenant-portal/TenantMeterReading";
import TenantDocuments from "./pages/tenant-portal/TenantDocuments";
import TenantFinances from "./pages/tenant-portal/TenantFinances";
import TenantUnit from "./pages/tenant-portal/TenantUnit";
import TenantCommunity from "./pages/tenant-portal/TenantCommunity";
import TenantSelfService from "./pages/tenant-portal/TenantSelfService";
import TenantMessages from "./pages/tenant-portal/TenantMessages";
import TenantSatisfaction from "./pages/tenant-portal/TenantSatisfaction";
import TenantPaymentHistory from "./pages/tenant-portal/TenantPaymentHistory";
import { TenantProtectedRoute } from "./components/tenant-portal/TenantProtectedRoute";

// Insurance Pages (NEW - Phase 10)
import InsuranceDashboard from "./pages/insurance/InsuranceDashboard";
import InsuranceClaims from "./pages/insurance/InsuranceClaims";

// Energy Pages (NEW - Phase 10)
import EnergyDashboard from "./pages/energy/EnergyDashboard";

// Owner Pages (NEW - Phase 10)
import OwnerList from "./pages/owners/OwnerList";
import OwnerDetail from "./pages/owners/OwnerDetail";

// Termination Pages (NEW - Phase 10)
import TerminationList from "./pages/terminations/TerminationList";
import TerminationWizard from "./pages/terminations/TerminationWizard";

// Knowledge Base (NEW - Phase 10)
import KnowledgeBase from "./pages/knowledge/KnowledgeBase";

// Inbound Email Pages
import InboundEmailSettings from "./pages/inbound/InboundEmailSettings";
import InboundEmailQueue from "./pages/inbound/InboundEmailQueue";

// Listings Pages
import ListingsManagement from "./pages/listings/ListingsManagement";

// Offer Pages
import OfferList from "./pages/offers/OfferList";
import NewOffer from "./pages/offers/NewOffer";
import OfferDetail from "./pages/offers/OfferDetail";
import KduRatesManagement from "./pages/offers/KduRatesManagement";

// Automation Pages
import AutomationDashboard from "./pages/automation/AutomationDashboard";
import WorkflowBuilder from "./pages/automation/WorkflowBuilder";

// Notifications Pages
import NotificationList from "./pages/notifications/NotificationList";
import NotificationSettings from "./pages/notifications/NotificationSettings";

// Help & Settings Pages
import HelpCenter from "./pages/help/HelpCenter";
import AuditLog from "./pages/settings/AuditLog";
import PrivacySettings from "./pages/settings/PrivacySettings";
import Analytics from "./pages/Analytics";

// Ecosystem Pages
import ReferralDashboard from "./pages/ecosystem/ReferralDashboard";

// Portal Pages
import PortalHub from "./pages/portal/PortalHub";

import { AIAssistant } from "./components/ai/AIAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
           <AIAssistant />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Protected Routes */}
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizardPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
            <Route path="/gebaeude/:id" element={<ProtectedRoute><BuildingDetail /></ProtectedRoute>} />
            <Route path="/einheiten" element={<ProtectedRoute><UnitsList /></ProtectedRoute>} />
            <Route path="/einheiten/:id" element={<ProtectedRoute><UnitDetail /></ProtectedRoute>} />
            <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
            <Route path="/mieter/:id" element={<ProtectedRoute><TenantDetailNew /></ProtectedRoute>} />

            {/* Offers */}
            <Route path="/angebote" element={<ProtectedRoute><OfferList /></ProtectedRoute>} />
            <Route path="/angebote/neu" element={<ProtectedRoute><NewOffer /></ProtectedRoute>} />
            <Route path="/angebote/:id" element={<ProtectedRoute><OfferDetail /></ProtectedRoute>} />
            <Route path="/kdu-richtwerte" element={<ProtectedRoute><KduRatesManagement /></ProtectedRoute>} />

            {/* Contracts */}
            <Route path="/vertraege" element={<ProtectedRoute><ContractList /></ProtectedRoute>} />
            <Route path="/vertraege/neu" element={<ProtectedRoute><NewContract /></ProtectedRoute>} />
            <Route path="/vertraege/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />

            {/* Payments */}
            <Route path="/zahlungen" element={<ProtectedRoute><PaymentList /></ProtectedRoute>} />
            <Route path="/finances" element={<ProtectedRoute><Finances /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />

            {/* Operating Costs */}
            <Route path="/betriebskosten" element={<ProtectedRoute><OperatingCosts /></ProtectedRoute>} />
            <Route path="/betriebskosten/neu" element={<ProtectedRoute><NewBilling /></ProtectedRoute>} />
            <Route path="/betriebskosten/:id" element={<ProtectedRoute><OperatingCostDetail /></ProtectedRoute>} />
            <Route path="/betriebskosten/kostenarten" element={<ProtectedRoute><CostTypes /></ProtectedRoute>} />

            {/* Meters */}
            <Route path="/zaehler" element={<ProtectedRoute><MeterList /></ProtectedRoute>} />
            <Route path="/zaehler/auswertung" element={<ProtectedRoute><Auswertung /></ProtectedRoute>} />
            <Route path="/zaehler/:id" element={<ProtectedRoute><MeterDetail /></ProtectedRoute>} />

            {/* Tasks */}
            <Route path="/aufgaben" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
            <Route path="/aufgaben/neu" element={<ProtectedRoute><NewTask /></ProtectedRoute>} />
            <Route path="/aufgaben/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />

            {/* Calendar */}
            <Route path="/kalender" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />

            {/* Letters */}
            <Route path="/briefe" element={<ProtectedRoute><LetterManagement /></ProtectedRoute>} />
            <Route path="/briefe/einstellungen" element={<ProtectedRoute><LetterSettings /></ProtectedRoute>} />
            <Route path="/briefe/vorlagen" element={<ProtectedRoute><LetterTemplates /></ProtectedRoute>} />

            {/* Signatures */}
            <Route path="/unterschriften" element={<ProtectedRoute><SignatureManagement /></ProtectedRoute>} />

            {/* WhatsApp */}
            <Route path="/whatsapp" element={<ProtectedRoute><WhatsAppDashboard /></ProtectedRoute>} />

            {/* Banking */}
            <Route path="/banking" element={<ProtectedRoute><BankingDashboard /></ProtectedRoute>} />
            <Route path="/banking/verbinden" element={<ProtectedRoute><BankConnect /></ProtectedRoute>} />
            <Route path="/banking/transaktionen" element={<ProtectedRoute><BankTransactions /></ProtectedRoute>} />
            <Route path="/banking/regeln" element={<ProtectedRoute><MatchingRules /></ProtectedRoute>} />

            {/* Documents */}
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />

            {/* Tax Routes (Phase 1) */}
            <Route path="/taxes" element={<ProtectedRoute><Taxes /></ProtectedRoute>} />
            <Route path="/steuern" element={<ProtectedRoute><TaxDashboard /></ProtectedRoute>} />
            <Route path="/steuern/erklaerungen" element={<ProtectedRoute><TaxDeclarations /></ProtectedRoute>} />
            <Route path="/steuern/absetzungen" element={<ProtectedRoute><TaxDeductions /></ProtectedRoute>} />
            <Route path="/steuern/fristen" element={<ProtectedRoute><TaxDeadlines /></ProtectedRoute>} />
            <Route path="/steuern/szenarien" element={<ProtectedRoute><TaxScenarioSimulator /></ProtectedRoute>} />
            <Route path="/steuern/optimierung" element={<ProtectedRoute><TaxOptimization /></ProtectedRoute>} />
            <Route path="/steuern/formulare" element={<ProtectedRoute><TaxFormLibrary /></ProtectedRoute>} />
            <Route path="/steuern/anlage-v" element={<ProtectedRoute><AnlageVWizard /></ProtectedRoute>} />
            <Route path="/steuern/anlage-kap" element={<ProtectedRoute><AnlageKAPEditor /></ProtectedRoute>} />
            <Route path="/steuern/anlage-so" element={<ProtectedRoute><AnlageSOEditor /></ProtectedRoute>} />
            <Route path="/steuern/compliance" element={<ProtectedRoute><TaxComplianceChecker /></ProtectedRoute>} />
            <Route path="/steuern/export" element={<ProtectedRoute><TaxExportHub /></ProtectedRoute>} />
            <Route path="/steuern/datev" element={<ProtectedRoute><DatevSync /></ProtectedRoute>} />
            <Route path="/steuern/belege" element={<ProtectedRoute><TaxDocuments /></ProtectedRoute>} />
            <Route path="/steuern/ki-berater" element={<ProtectedRoute><AITaxAdvisor /></ProtectedRoute>} />
            <Route path="/steuern/elster" element={<ProtectedRoute><ElsterDashboard /></ProtectedRoute>} />
            <Route path="/steuern/elster/senden" element={<ProtectedRoute><ElsterSubmit /></ProtectedRoute>} />

            {/* Finance Routes (Phase 2) */}
            <Route path="/finanzen" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
            <Route path="/rechnungen" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
            <Route path="/rechnungen/neu" element={<ProtectedRoute><NewInvoice /></ProtectedRoute>} />
            <Route path="/rechnungen/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute><BudgetManagement /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><PortfolioDashboard /></ProtectedRoute>} />
            <Route path="/vermoegen" element={<ProtectedRoute><WealthDashboard /></ProtectedRoute>} />

            {/* Calculator Routes (Phase 3) */}
            <Route path="/rechner" element={<ProtectedRoute><CalculatorHub /></ProtectedRoute>} />
            <Route path="/rechner/afa" element={<ProtectedRoute><AfACalculator /></ProtectedRoute>} />
            <Route path="/rechner/kaufpreis" element={<ProtectedRoute><KaufpreisRechner /></ProtectedRoute>} />
            <Route path="/rechner/rendite" element={<ProtectedRoute><RenditeRechner /></ProtectedRoute>} />
            <Route path="/rechner/tilgung" element={<ProtectedRoute><TilgungsRechner /></ProtectedRoute>} />
            <Route path="/rechner/cashflow" element={<ProtectedRoute><CashflowRechner /></ProtectedRoute>} />
            <Route path="/rechner/wertentwicklung" element={<ProtectedRoute><WertentwicklungsRechner /></ProtectedRoute>} />
            <Route path="/co2" element={<ProtectedRoute><CO2Dashboard /></ProtectedRoute>} />

            {/* Communication Routes (Phase 5) */}
            <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} />
            <Route path="/kommunikation/vorlagen" element={<ProtectedRoute><EmailTemplates /></ProtectedRoute>} />
            <Route path="/kommunikation/senden" element={<ProtectedRoute><ComposeEmail /></ProtectedRoute>} />
            <Route path="/kommunikation/verlauf" element={<ProtectedRoute><EmailHistory /></ProtectedRoute>} />
            <Route path="/kommunikation/eingang" element={<ProtectedRoute><InboundEmailQueue /></ProtectedRoute>} />
            <Route path="/kommunikation/empfang" element={<ProtectedRoute><InboundEmailSettings /></ProtectedRoute>} />
            <Route path="/kommunikation/bulk" element={<ProtectedRoute><BulkMessaging /></ProtectedRoute>} />
            <Route path="/kommunikation/analytics" element={<ProtectedRoute><CommunicationAnalytics /></ProtectedRoute>} />

            {/* Compliance Routes (Phase 6) */}
            <Route path="/compliance" element={<ProtectedRoute><ComplianceDashboard /></ProtectedRoute>} />
            <Route path="/compliance/checkliste" element={<ProtectedRoute><ComplianceChecklist /></ProtectedRoute>} />
            <Route path="/compliance/audit" element={<ProtectedRoute><AuditReadiness /></ProtectedRoute>} />

            {/* Report Routes (Phase 7) */}
            <Route path="/berichte" element={<ProtectedRoute><ReportHub /></ProtectedRoute>} />
            <Route path="/berichte/builder" element={<ProtectedRoute><ReportBuilder /></ProtectedRoute>} />
            <Route path="/berichte/analytics" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />

            {/* Data Import/Export Routes (Phase 8) */}
            <Route path="/daten" element={<ProtectedRoute><ImportExportHub /></ProtectedRoute>} />
            <Route path="/daten/import" element={<ProtectedRoute><UniversalImport /></ProtectedRoute>} />

            {/* Insurance Routes (Phase 10) */}
            <Route path="/versicherungen" element={<ProtectedRoute><InsuranceDashboard /></ProtectedRoute>} />
            <Route path="/versicherungen/schaeden" element={<ProtectedRoute><InsuranceClaims /></ProtectedRoute>} />

            {/* Energy Routes (Phase 10) */}
            <Route path="/energie" element={<ProtectedRoute><EnergyDashboard /></ProtectedRoute>} />

            {/* Owner Routes (Phase 10) */}
            <Route path="/eigentuemer" element={<ProtectedRoute><OwnerList /></ProtectedRoute>} />
            <Route path="/eigentuemer/:id" element={<ProtectedRoute><OwnerDetail /></ProtectedRoute>} />

            {/* Termination Routes (Phase 10) */}
            <Route path="/kuendigungen" element={<ProtectedRoute><TerminationList /></ProtectedRoute>} />
            <Route path="/kuendigungen/neu" element={<ProtectedRoute><TerminationWizard /></ProtectedRoute>} />

            {/* Knowledge Base (Phase 10) */}
            <Route path="/wissen" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />

            {/* Handover Pages */}
            <Route path="/uebergaben" element={<ProtectedRoute><HandoverList /></ProtectedRoute>} />
            <Route path="/uebergaben/neu" element={<ProtectedRoute><NewHandover /></ProtectedRoute>} />
            <Route path="/uebergaben/:id" element={<ProtectedRoute><HandoverProtocol /></ProtectedRoute>} />
            <Route path="/uebergaben/:id/pdf" element={<ProtectedRoute><HandoverPDF /></ProtectedRoute>} />

            {/* Rent Adjustments */}
            <Route path="/miete/anpassungen" element={<ProtectedRoute><RentAdjustments /></ProtectedRoute>} />

            {/* Analytics */}
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

            {/* Listings */}
            <Route path="/inserate" element={<ProtectedRoute><ListingsManagement /></ProtectedRoute>} />

            {/* Automation */}
            <Route path="/automatisierung" element={<ProtectedRoute><AutomationDashboard /></ProtectedRoute>} />
            <Route path="/automatisierung/neu" element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>} />
            <Route path="/automatisierung/:id" element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>} />

            {/* Ecosystem */}
            <Route path="/empfehlungen" element={<ProtectedRoute><ReferralDashboard /></ProtectedRoute>} />
            <Route path="/portal" element={<ProtectedRoute><PortalHub /></ProtectedRoute>} />

            {/* Notifications */}
            <Route path="/benachrichtigungen" element={<ProtectedRoute><NotificationList /></ProtectedRoute>} />
            <Route path="/einstellungen/benachrichtigungen" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />

            {/* Settings */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/einstellungen" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/hilfe" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
            <Route path="/einstellungen/aktivitaeten" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
            <Route path="/einstellungen/datenschutz" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/benutzer" element={<AdminProtectedRoute><UserManagement /></AdminProtectedRoute>} />
            <Route path="/admin/organisationen" element={<AdminProtectedRoute><OrgManagement /></AdminProtectedRoute>} />
            <Route path="/admin/rollen" element={<AdminProtectedRoute><RoleManagement /></AdminProtectedRoute>} />
            <Route path="/admin/berechtigungen" element={<AdminProtectedRoute><PermissionManagement /></AdminProtectedRoute>} />
            <Route path="/admin/module" element={<AdminProtectedRoute><ModuleManagement /></AdminProtectedRoute>} />

            {/* Tenant Portal Routes */}
            <Route path="/mieter-portal" element={<TenantProtectedRoute><MieterDashboard /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/mangel-melden" element={<TenantProtectedRoute><DefectReport /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/zaehler" element={<TenantProtectedRoute><TenantMeterReading /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/dokumente" element={<TenantProtectedRoute><TenantDocuments /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/finanzen" element={<TenantProtectedRoute><TenantFinances /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/wohnung" element={<TenantProtectedRoute><TenantUnit /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/community" element={<TenantProtectedRoute><TenantCommunity /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/self-service" element={<TenantProtectedRoute><TenantSelfService /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/nachrichten" element={<TenantProtectedRoute><TenantMessages /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/zufriedenheit" element={<TenantProtectedRoute><TenantSatisfaction /></TenantProtectedRoute>} />
            <Route path="/mieter-portal/zahlungen" element={<TenantProtectedRoute><TenantPaymentHistory /></TenantProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
