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
import ContractList from "./pages/contracts/ContractList";
import ContractDetail from "./pages/contracts/ContractDetail";
import PaymentList from "./pages/payments/PaymentList";
import OperatingCosts from "./pages/operating-costs/OperatingCosts";
import NewBilling from "./pages/operating-costs/NewBilling";
import MeterDashboard from "./pages/meters/MeterDashboard";
import MeterDetail from "./pages/meters/MeterDetail";
import TaskList from "./pages/tasks/TaskList";
import TaskDetail from "./pages/tasks/TaskDetail";
import NewTask from "./pages/tasks/NewTask";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
                <TenantDetail />
              </ProtectedRoute>
            } />
            <Route path="/vertraege" element={
              <ProtectedRoute>
                <ContractList />
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
            <Route path="/zaehler" element={
              <ProtectedRoute>
                <MeterDashboard />
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
            <Route path="/communication" element={
              <ProtectedRoute>
                <Communication />
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

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
