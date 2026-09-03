import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/common";
import { RequireAuth, RequirePermission } from "./routes/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import Dashboard from "./pages/dashboard/Dashboard";
import MarketingDashboard from "./pages/dashboard/MarketingDashboard";
import FinanceDashboard from "./pages/dashboard/FinanceDashboard";
import Leads from "./pages/leads/Leads";
import Clients from "./pages/clients/Clients";
import ClientDetail from "./pages/clients/ClientDetail";
import Projects from "./pages/projects/Projects";
import ProjectDetail from "./pages/projects/ProjectDetail";
import Invoices from "./pages/invoices/Invoices";
import Payments from "./pages/payments/Payments";
import Expenses from "./pages/finance/Expenses";
import Campaigns from "./pages/marketing/Campaigns";
import LeadSources from "./pages/marketing/LeadSources";
import Communication from "./pages/communication/Communication";
import FollowUps from "./pages/followups/FollowUps";
import Documents from "./pages/documents/Documents";
import Reports from "./pages/reports/Reports";
import Notifications from "./pages/notifications/Notifications";
import Profile from "./pages/settings/Profile";
import Settings from "./pages/settings/Settings";
import Accounts from "./pages/users/Accounts";
import ActivityLogs from "./pages/activity/ActivityLogs";
import { Wrench } from "lucide-react";

function Placeholder({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
        <Wrench size={32} />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{title} Page</h1>
      <p className="text-slate-500 max-w-md">This page is currently under construction. Check back soon for updates!</p>
    </div>
  );
}

function Protected({ routeKey, children }) {
  return (
    <RequireAuth>
      <RequirePermission routeKey={routeKey}>{children}</RequirePermission>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              element={
                <RequireAuth>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route path="/dashboard" element={<Protected routeKey="dashboard"><Dashboard /></Protected>} />
              <Route path="/sales" element={<Navigate to="/dashboard" replace />} />
              <Route path="/sales/dashboard" element={<Navigate to="/dashboard" replace />} />
              {/* Login responses still hand out these role-specific paths. */}
              <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/pm/dashboard" element={<Navigate to="/dashboard" replace />} />

              <Route path="/leads" element={<Protected routeKey="leads"><Leads /></Protected>} />
              <Route path="/my-leads" element={<Navigate to="/leads" replace />} />
              <Route path="/follow-ups" element={<Protected routeKey="follow_ups"><FollowUps /></Protected>} />
              <Route path="/clients" element={<Protected routeKey="clients"><Clients /></Protected>} />
              <Route path="/clients/:id" element={<Protected routeKey="clients"><ClientDetail /></Protected>} />
              
              <Route path="/projects" element={<Protected routeKey="projects"><Projects /></Protected>} />
              <Route path="/projects/:id" element={<Protected routeKey="projects"><ProjectDetail /></Protected>} />
              <Route path="/requirements" element={<Navigate to="/projects" replace />} />
              <Route path="/tasks" element={<Protected routeKey="tasks"><Placeholder title="Tasks" /></Protected>} />

              <Route path="/marketing" element={<Protected routeKey="marketing"><MarketingDashboard /></Protected>} />
              <Route path="/marketing/dashboard" element={<Navigate to="/marketing" replace />} />
              <Route path="/marketing/campaigns" element={<Protected routeKey="campaigns"><Campaigns /></Protected>} />
              <Route path="/marketing/lead-sources" element={<Protected routeKey="lead_sources"><LeadSources /></Protected>} />

              <Route path="/finance" element={<Protected routeKey="finance"><FinanceDashboard /></Protected>} />
              <Route path="/finance/dashboard" element={<Navigate to="/finance" replace />} />
              <Route path="/invoices" element={<Protected routeKey="invoices"><Invoices /></Protected>} />
              <Route path="/payments" element={<Protected routeKey="payments"><Payments /></Protected>} />
              <Route path="/expenses" element={<Protected routeKey="expenses"><Expenses /></Protected>} />

              <Route path="/reports" element={<Protected routeKey="reports"><Reports /></Protected>} />
              <Route path="/communication" element={<Protected routeKey="calls"><Communication /></Protected>} />
              <Route path="/documents" element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/activity" element={<Protected routeKey="audit"><ActivityLogs /></Protected>} />
              <Route path="/accounts" element={<Protected routeKey="team"><Accounts /></Protected>} />
              
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Protected routeKey="settings"><Settings /></Protected>} />
              <Route path="/profile" element={<Protected routeKey="settings"><Profile /></Protected>} />

              <Route index element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
