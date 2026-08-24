import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";
import AdminDashboard from "./AdminDashboard";
import SalesDashboard from "./SalesDashboard";
import MarketingDashboard from "./MarketingDashboard";
import ProjectDashboard from "./ProjectDashboard";
import FinanceDashboard from "./FinanceDashboard";

/**
 * Dashboard.jsx
 * ----------------------------------------------------------------------
 * Role-based dashboard router. Each role gets a dashboard tailored to
 * what it actually needs day-to-day; all of them pull live data through
 * RTK Query (src/store/api/apiSlice.js) rather than static mock data.
 */
const DASHBOARDS_BY_ROLE = {
  [ROLES.ADMIN]: AdminDashboard,
  [ROLES.SALES]: SalesDashboard,
  [ROLES.MARKETING]: MarketingDashboard,
  [ROLES.PROJECT_MANAGER]: ProjectDashboard,
  [ROLES.FINANCE]: FinanceDashboard,
};

export default function Dashboard() {
  const { user } = useAuth();
  const DashboardComponent = DASHBOARDS_BY_ROLE[user?.role] || AdminDashboard;
  return <DashboardComponent user={user} />;
}
