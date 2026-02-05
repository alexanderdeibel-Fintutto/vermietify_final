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

// New Detail Pages
import BuildingDetail from "./pages/buildings/BuildingDetail";
import UnitDetail from "./pages/einheiten/UnitDetail";
import TenantDetail from "./pages/tenants/TenantDetail";
import TenantDetailNew from "./pages/mieter/TenantDetail";
import ContractList from "./pages/contracts/ContractList";
import ContractDetail from "./pages/contracts/ContractDetail";
import NewContract from "./pages/contracts/NewContract";
import PaymentList from "./pages/payments/PaymentList";
import OperatingCosts from "./pages/operating-costs/OperatingCosts";
import NewBilling from "./pages/operating-costs/NewBilling";
import OperatingCostDetail from "./pages/operating-costs/OperatingCostDetail";
import CostTypes from "./pages/operating-costs/CostTypes";
import MeterList from "./pages/meters/MeterList";
import MeterDetail from "./pages/meters/MeterDetail";
import Auswertung from "./pages/zaehler/Auswertung";
import TaskList from "./pages/tasks/TaskList";
import TaskDetail from "./pages/tasks/TaskDetail";
import NewTask from "./pages/tasks/NewTask";
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

 // Tax Pages
 import AnlageVWizard from "./pages/taxes/AnlageVWizard";
 import TaxDocuments from "./pages/taxes/TaxDocuments";
 import AITaxAdvisor from "./pages/taxes/AITaxAdvisor";

 // ELSTER Pages
 import ElsterDashboard from "./pages/elster/ElsterDashboard";
 import ElsterSubmit from "./pages/elster/ElsterSubmit";

 // Handover Pages
 import HandoverList from "./pages/handover/HandoverList";
 import NewHandover from "./pages/handover/NewHandover";
 import HandoverProtocol from "./pages/handover/HandoverProtocol";

 // Rent Adjustment Pages
 import RentAdjustments from "./pages/rent/RentAdjustments";
 import HandoverPDF from "./pages/handover/HandoverPDF";

 // CO2 Pages
 import CO2Dashboard from "./pages/co2/CO2Dashboard";
 
 // Admin Pages
 import AdminDashboard from "./pages/admin/AdminDashboard";
 import UserManagement from "./pages/admin/UserManagement";
 import OrgManagement from "./pages/admin/OrgManagement";
 import Analytics from "./pages/Analytics";
 import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";

 // Tenant Portal Pages
 import MieterDashboard from "./pages/tenant-portal/MieterDashboard";
 import DefectReport from "./pages/tenant-portal/DefectReport";
 import TenantMeterReading from "./pages/tenant-portal/TenantMeterReading";
 import TenantDocuments from "./pages/tenant-portal/TenantDocuments";
 import TenantFinances from "./pages/tenant-portal/TenantFinances";
 import TenantUnit from "./pages/tenant-portal/TenantUnit";
 import { TenantProtectedRoute } from "./components/tenant-portal/TenantProtectedRoute";

 // Communication Pages
 import EmailTemplates from "./pages/communication/EmailTemplates";
 import ComposeEmail from "./pages/communication/ComposeEmail";
 import EmailHistory from "./pages/communication/EmailHistory";

 // Listings Pages
 import ListingsManagement from "./pages/listings/ListingsManagement";

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
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <OnboardingWizard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/properties" element={
              <ProtectedRoute>
                <Properties />
              </ProtectedRoute>
            } />
            <Route path="/gebaeude/:id" element={
              <ProtectedRoute>
                <BuildingDetail />
              </ProtectedRoute>
            } />
            <Route path="/einheiten/:id" element={
              <ProtectedRoute>
                <UnitDetail />
              </ProtectedRoute>
            } />
            <Route path="/tenants" element={
              <ProtectedRoute>
                <Tenants />
              </ProtectedRoute>
            } />
            <Route path="/mieter/:id" element={
              <ProtectedRoute>
                <TenantDetailNew />
              </ProtectedRoute>
            } />
            <Route path="/vertraege" element={
              <ProtectedRoute>
                <ContractList />
              </ProtectedRoute>
            } />
            <Route path="/vertraege/neu" element={
              <ProtectedRoute>
                <NewContract />
              </ProtectedRoute>
            } />
            <Route path="/vertraege/:id" element={
              <ProtectedRoute>
                <ContractDetail />
              </ProtectedRoute>
            } />
            <Route path="/zahlungen" element={
              <ProtectedRoute>
                <PaymentList />
              </ProtectedRoute>
            } />
            <Route path="/finances" element={
              <ProtectedRoute>
                <Finances />
              </ProtectedRoute>
            } />
            <Route path="/betriebskosten" element={
              <ProtectedRoute>
                <OperatingCosts />
              </ProtectedRoute>
            } />
            <Route path="/betriebskosten/neu" element={
              <ProtectedRoute>
                <NewBilling />
              </ProtectedRoute>
            } />
            <Route path="/betriebskosten/:id" element={
              <ProtectedRoute>
                <OperatingCostDetail />
              </ProtectedRoute>
            } />
            <Route path="/betriebskosten/kostenarten" element={
              <ProtectedRoute>
                <CostTypes />
              </ProtectedRoute>
            } />
            <Route path="/zaehler" element={
              <ProtectedRoute>
                <MeterList />
              </ProtectedRoute>
            } />
            <Route path="/zaehler/auswertung" element={
              <ProtectedRoute>
                <Auswertung />
              </ProtectedRoute>
            } />
            <Route path="/zaehler/:id" element={
              <ProtectedRoute>
                <MeterDetail />
              </ProtectedRoute>
            } />
            <Route path="/aufgaben" element={
              <ProtectedRoute>
                <TaskList />
              </ProtectedRoute>
            } />
            <Route path="/aufgaben/neu" element={
              <ProtectedRoute>
                <NewTask />
              </ProtectedRoute>
            } />
            <Route path="/aufgaben/:id" element={
              <ProtectedRoute>
                <TaskDetail />
              </ProtectedRoute>
            } />
            <Route path="/kalender" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />
             <Route path="/briefe" element={
               <ProtectedRoute>
                 <LetterManagement />
               </ProtectedRoute>
             } />
             <Route path="/briefe/einstellungen" element={
               <ProtectedRoute>
                 <LetterSettings />
               </ProtectedRoute>
             } />
             <Route path="/briefe/vorlagen" element={
               <ProtectedRoute>
                 <LetterTemplates />
               </ProtectedRoute>
             } />
             <Route path="/unterschriften" element={
               <ProtectedRoute>
                 <SignatureManagement />
               </ProtectedRoute>
             } />
            <Route path="/whatsapp" element={
              <ProtectedRoute>
                <WhatsAppDashboard />
              </ProtectedRoute>
            } />
            <Route path="/banking" element={
              <ProtectedRoute>
                <BankingDashboard />
              </ProtectedRoute>
            } />
            <Route path="/banking/verbinden" element={
              <ProtectedRoute>
                <BankConnect />
              </ProtectedRoute>
            } />
            <Route path="/banking/transaktionen" element={
              <ProtectedRoute>
                <BankTransactions />
              </ProtectedRoute>
            } />
            <Route path="/banking/regeln" element={
              <ProtectedRoute>
                <MatchingRules />
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            } />
            <Route path="/billing" element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            } />
            <Route path="/taxes" element={
              <ProtectedRoute>
                <Taxes />
              </ProtectedRoute>
            } />
             <Route path="/steuern/anlage-v" element={
               <ProtectedRoute>
                 <AnlageVWizard />
               </ProtectedRoute>
             } />
             <Route path="/steuern/belege" element={
               <ProtectedRoute>
                 <TaxDocuments />
               </ProtectedRoute>
             } />
             <Route path="/steuern/ki-berater" element={
               <ProtectedRoute>
                 <AITaxAdvisor />
               </ProtectedRoute>
             } />
            <Route path="/steuern/elster" element={
              <ProtectedRoute>
                <ElsterDashboard />
              </ProtectedRoute>
            } />
            <Route path="/steuern/elster/senden" element={
              <ProtectedRoute>
                <ElsterSubmit />
              </ProtectedRoute>
            } />
             <Route path="/uebergaben" element={
               <ProtectedRoute>
                 <HandoverList />
               </ProtectedRoute>
             } />
             <Route path="/uebergaben/neu" element={
               <ProtectedRoute>
                 <NewHandover />
               </ProtectedRoute>
             } />
             <Route path="/uebergaben/:id" element={
               <ProtectedRoute>
                 <HandoverProtocol />
               </ProtectedRoute>
             } />
             <Route path="/uebergaben/:id/pdf" element={
               <ProtectedRoute>
                 <HandoverPDF />
               </ProtectedRoute>
             } />
            <Route path="/miete/anpassungen" element={
              <ProtectedRoute>
                <RentAdjustments />
              </ProtectedRoute>
            } />
            <Route path="/co2" element={
              <ProtectedRoute>
                <CO2Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/communication" element={
              <ProtectedRoute>
                <Communication />
              </ProtectedRoute>
            } />
            <Route path="/kommunikation/vorlagen" element={
              <ProtectedRoute>
                <EmailTemplates />
              </ProtectedRoute>
            } />
            <Route path="/kommunikation/senden" element={
              <ProtectedRoute>
                <ComposeEmail />
              </ProtectedRoute>
            } />
            <Route path="/kommunikation/verlauf" element={
              <ProtectedRoute>
                <EmailHistory />
              </ProtectedRoute>
            } />
            <Route path="/inserate" element={
              <ProtectedRoute>
                <ListingsManagement />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/payment-success" element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/benutzer" element={
              <AdminProtectedRoute>
                <UserManagement />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/organisationen" element={
              <AdminProtectedRoute>
                <OrgManagement />
              </AdminProtectedRoute>
            } />

             {/* Tenant Portal Routes */}
             <Route path="/mieter-portal" element={
               <TenantProtectedRoute>
                 <MieterDashboard />
               </TenantProtectedRoute>
             } />
             <Route path="/mieter-portal/mangel-melden" element={
               <TenantProtectedRoute>
                 <DefectReport />
               </TenantProtectedRoute>
             } />
             <Route path="/mieter-portal/zaehler" element={
               <TenantProtectedRoute>
                 <TenantMeterReading />
               </TenantProtectedRoute>
             } />
             <Route path="/mieter-portal/dokumente" element={
               <TenantProtectedRoute>
                 <TenantDocuments />
               </TenantProtectedRoute>
             } />
             <Route path="/mieter-portal/finanzen" element={
               <TenantProtectedRoute>
                 <TenantFinances />
               </TenantProtectedRoute>
             } />
             <Route path="/mieter-portal/wohnung" element={
               <TenantProtectedRoute>
                 <TenantUnit />
               </TenantProtectedRoute>
             } />

             {/* Catch-all */}
             <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
