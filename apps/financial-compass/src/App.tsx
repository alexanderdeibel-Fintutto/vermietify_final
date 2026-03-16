import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Lazy-loaded pages
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Receipts = lazy(() => import("./pages/Receipts"));
const Contacts = lazy(() => import("./pages/Contacts"));
const BankAccounts = lazy(() => import("./pages/BankAccounts"));
const BankConnect = lazy(() => import("./pages/BankConnect"));
const Elster = lazy(() => import("./pages/Elster"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Companies = lazy(() => import("./pages/Companies"));
const Calendar = lazy(() => import("./pages/Calendar"));
const EmailTemplates = lazy(() => import("./pages/EmailTemplates"));
const Notifications = lazy(() => import("./pages/Notifications"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const BankCallback = lazy(() => import("./pages/BankCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RecurringTransactions = lazy(() => import("./pages/RecurringTransactions"));
const Quotes = lazy(() => import("./pages/Quotes"));
const OrderConfirmations = lazy(() => import("./pages/OrderConfirmations"));
const Automation = lazy(() => import("./pages/Automation"));
const SepaPayments = lazy(() => import("./pages/SepaPayments"));
const TaxAdvisorPortal = lazy(() => import("./pages/TaxAdvisorPortal"));
const EcommerceIntegration = lazy(() => import("./pages/EcommerceIntegration"));
const AssignmentRules = lazy(() => import("./pages/AssignmentRules"));
const Assets = lazy(() => import("./pages/Assets"));
const RealEstate = lazy(() => import("./pages/assets/RealEstate"));
const CompanySharesPage = lazy(() => import("./pages/assets/CompanyShares"));
const InvestmentAssets = lazy(() => import("./pages/assets/InvestmentAssets"));
const Insurance = lazy(() => import("./pages/assets/Insurance"));
const Vehicles = lazy(() => import("./pages/assets/Vehicles"));
const Invitations = lazy(() => import("./pages/Invitations"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <CompanyProvider>
      <NotificationProvider>
        <AppLayout>{children}</AppLayout>
      </NotificationProvider>
    </CompanyProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/passwort-vergessen" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
        <Route path="/passwort-zuruecksetzen" element={<ResetPassword />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/buchungen" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/wiederkehrend" element={<ProtectedRoute><RecurringTransactions /></ProtectedRoute>} />
        <Route path="/angebote" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
        <Route path="/auftraege" element={<ProtectedRoute><OrderConfirmations /></ProtectedRoute>} />
        <Route path="/rechnungen" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/belege" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
        <Route path="/kontakte" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/bankkonten" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
        <Route path="/bankverbindung" element={<ProtectedRoute><BankConnect /></ProtectedRoute>} />
        <Route path="/elster" element={<ProtectedRoute><Elster /></ProtectedRoute>} />
        <Route path="/berichte" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/automatisierung" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
        <Route path="/sepa" element={<ProtectedRoute><SepaPayments /></ProtectedRoute>} />
        <Route path="/steuerberater" element={<ProtectedRoute><TaxAdvisorPortal /></ProtectedRoute>} />
        <Route path="/ecommerce" element={<ProtectedRoute><EcommerceIntegration /></ProtectedRoute>} />
        <Route path="/zuordnungsregeln" element={<ProtectedRoute><AssignmentRules /></ProtectedRoute>} />
        <Route path="/einstellungen" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/vermoegen" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/vermoegen/immobilien" element={<ProtectedRoute><RealEstate /></ProtectedRoute>} />
        <Route path="/vermoegen/gesellschaften" element={<ProtectedRoute><CompanySharesPage /></ProtectedRoute>} />
        <Route path="/vermoegen/assets" element={<ProtectedRoute><InvestmentAssets /></ProtectedRoute>} />
        <Route path="/vermoegen/versicherungen" element={<ProtectedRoute><Insurance /></ProtectedRoute>} />
        <Route path="/vermoegen/fahrzeuge" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
        <Route path="/firmen" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
        <Route path="/einladungen" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
        <Route path="/kalender" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/vorlagen" element={<ProtectedRoute><EmailTemplates /></ProtectedRoute>} />
        <Route path="/benachrichtigungen" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/hilfe" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
        <Route path="/bank-callback" element={<BankCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
