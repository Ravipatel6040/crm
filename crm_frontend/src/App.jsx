import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/common";
import { RequireAuth, RequirePermission } from "./routes/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import Dashboard from "./pages/dashboard/Dashboard";
import Leads from "./pages/leads/Leads";
import Pipeline from "./pages/pipeline/Pipeline";
import Clients from "./pages/clients/Clients";
import ClientDetail from "./pages/clients/ClientDetail";
import Projects from "./pages/projects/Projects";
import ProjectDetail from "./pages/projects/ProjectDetail";
import Payments from "./pages/payments/Payments";
import Campaigns from "./pages/marketing/Campaigns";
import LeadSources from "./pages/marketing/LeadSources";
import MarketingAnalytics from "./pages/marketing/MarketingAnalytics";
import Communication from "./pages/communication/Communication";
import Documents from "./pages/documents/Documents";
import Notifications from "./pages/notifications/Notifications";
import ActivityLogs from "./pages/activity/ActivityLogs";
import Reports from "./pages/reports/Reports";
import Profile from "./pages/settings/Profile";
import Settings from "./pages/settings/Settings";
import Products from "./pages/catalog/Products";
import Services from "./pages/catalog/Services";
import Accounts from "./pages/users/Accounts";

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

              <Route path="/leads" element={<Protected routeKey="leads"><Leads /></Protected>} />
              <Route path="/pipeline" element={<Protected routeKey="pipeline"><Pipeline /></Protected>} />

              <Route path="/clients" element={<Protected routeKey="clients"><Clients /></Protected>} />
              <Route path="/clients/:id" element={<Protected routeKey="clients"><ClientDetail /></Protected>} />

              <Route path="/projects" element={<Protected routeKey="projects"><Projects /></Protected>} />
              <Route path="/projects/:id" element={<Protected routeKey="projects"><ProjectDetail /></Protected>} />

              <Route path="/payments" element={<Protected routeKey="payments"><Payments /></Protected>} />

              <Route path="/marketing/campaigns" element={<Protected routeKey="campaigns"><Campaigns /></Protected>} />
              <Route path="/marketing/lead-sources" element={<Protected routeKey="lead-sources"><LeadSources /></Protected>} />
              <Route path="/marketing/analytics" element={<Protected routeKey="marketing-analytics"><MarketingAnalytics /></Protected>} />

              <Route path="/communication" element={<Protected routeKey="communication"><Communication /></Protected>} />
              <Route path="/documents" element={<Protected routeKey="documents"><Documents /></Protected>} />
              <Route path="/notifications" element={<Protected routeKey="notifications"><Notifications /></Protected>} />
              <Route path="/activity" element={<Protected routeKey="activity"><ActivityLogs /></Protected>} />
              <Route path="/reports" element={<Protected routeKey="reports"><Reports /></Protected>} />

              <Route path="/products" element={<Protected routeKey="products"><Products /></Protected>} />
              <Route path="/services" element={<Protected routeKey="services"><Services /></Protected>} />

              <Route path="/accounts" element={<Protected routeKey="accounts"><Accounts /></Protected>} />

              <Route path="/profile" element={<Protected routeKey="profile"><Profile /></Protected>} />
              <Route path="/settings" element={<Protected routeKey="settings"><Settings /></Protected>} />

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
