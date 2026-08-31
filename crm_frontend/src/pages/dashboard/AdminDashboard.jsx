import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Handshake, FolderKanban, Wallet, AlertTriangle, ArrowRight, Sparkles,
  UserCog, Pencil, UserCheck, Briefcase, Package, Wrench, Headphones,
  Receipt, BarChart3, CheckSquare, Bell, ShieldCheck,
} from "lucide-react";
import { LeadSourceChart, PipelineChart, RevenueChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Avatar, Button, LoadingState } from "../../components/common";
import { ROLE_LABELS, ROLES } from "../../constants/roles";
import { formatCompactCurrency } from "../../utils/format";
import {
  useGetDashboardSummaryQuery, useGetUsersQuery, useGetRevenueOverviewQuery,
  useGetPipelineSummaryQuery, useGetLeadSourcesSummaryQuery,
} from "../../store/api/apiSlice";

// The full capability set an Admin has, per the workspace spec — each is a
// one-click shortcut into the module that owns it.
const CAPABILITIES = [
  { label: "View / Create / Edit Leads", to: "/leads", icon: Pencil },
  { label: "Assign Leads", to: "/leads", icon: UserCheck },
  { label: "View All Customers", to: "/clients", icon: Briefcase },
  { label: "Manage Products", to: "/products", icon: Package },
  { label: "Manage Services", to: "/services", icon: Wrench },
  { label: "View Invoices & Payments", to: "/payments", icon: Receipt },
  { label: "View Reports", to: "/reports", icon: BarChart3 },
  { label: "Manage Tasks", to: "/projects", icon: CheckSquare },
  { label: "Manage Notifications", to: "/notifications", icon: Bell },
];

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummaryQuery();
  const { data: usersData, isLoading: loadingUsers } = useGetUsersQuery();
  const { data: revenueData } = useGetRevenueOverviewQuery();
  const { data: pipelineData } = useGetPipelineSummaryQuery();
  const { data: leadSourceData } = useGetLeadSourcesSummaryQuery();

  const users = usersData?.data ?? usersData ?? [];
  const salesTeam = users.filter((u) => u.role === ROLES.SALES);
  const supportTeam = users.filter((u) => u.role === ROLES.PROJECT_MANAGER);
  const k = summary || {};

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-primary-500 px-6 sm:px-8 py-7 text-white">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 rounded-full px-3 py-1 mb-3">
              <Sparkles size={12} /> {ROLE_LABELS[user?.role]} workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Welcome back, {user?.name?.split(" ")[0]}.
            </h1>
            <p className="text-primary-100 text-sm mt-1.5 max-w-md">
              Manage every account, team and module in CRM Gangatara from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => navigate("/accounts")}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-400 px-3.5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-50 dark:hover:bg-slate-700"
            >
              <UserPlus size={15} /> Create Account
            </button>
            <button
              onClick={() => navigate("/reports")}
              className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur px-3.5 py-2.5 text-sm font-medium transition-colors"
            >
              <BarChart3 size={15} /> View Reports
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      {loadingSummary ? (
        <LoadingState label="Loading dashboard summary..." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard icon={Users} title="Total Leads" value={k.totalLeads ?? 0} tone="primary" />
          <KpiCard icon={Handshake} title="Active Deals" value={k.activeDeals ?? 0} tone="amber" />
          <KpiCard icon={Briefcase} title="Total Clients" value={k.totalClients ?? 0} tone="primary" />
          <KpiCard icon={FolderKanban} title="Active Projects" value={k.activeProjects ?? 0} tone="green" />
          <KpiCard icon={Wallet} title="Pending Payments" value={formatCompactCurrency(k.pendingPayments ?? 0)} tone="amber" />
          <KpiCard icon={AlertTriangle} title="Overdue Tasks" value={k.overdueTasks ?? 0} tone="red" />
        </div>
      )}

      {/* Capability shortcuts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Admin Capabilities</h3>
          <Badge tone="primary">Full access</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CAPABILITIES.map((c) => (
            <button
              key={c.label}
              onClick={() => navigate(c.to)}
              className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-700/50 px-4 py-3 text-left hover:border-primary-200 dark:hover:border-primary-500/30 hover:bg-primary-50/50 dark:hover:bg-primary-500/10 transition-colors"
            >
              <span className="h-9 w-9 rounded-lg bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <c.icon size={16} />
              </span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.label}</span>
              <ArrowRight size={14} className="ml-auto text-slate-300 dark:text-slate-500" />
            </button>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <RevenueChart data={revenueData} />
        <PipelineChart data={pipelineData} />
      </div>
      <LeadSourceChart data={leadSourceData} />

      {/* Team monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <UserCog size={15} className="text-primary-500" /> Monitor Sales Team
            </h3>
            <Button size="sm" variant="outline" icon={UserPlus} onClick={() => navigate("/accounts")}>
              Add
            </Button>
          </div>
          {loadingUsers ? (
            <LoadingState label="Loading team..." />
          ) : salesTeam.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No BD/Sales accounts yet. Create one to get started.</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-50 dark:divide-slate-700/50">
              {salesTeam.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={s.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.designation || "BD / Sales"}</p>
                  </div>
                  <Badge tone={s.status === "Inactive" ? "red" : "green"}>{s.status || "Active"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Headphones size={15} className="text-primary-500" /> Monitor Support / Delivery Team
            </h3>
            <Button size="sm" variant="outline" icon={UserPlus} onClick={() => navigate("/accounts")}>
              Add
            </Button>
          </div>
          {loadingUsers ? (
            <LoadingState label="Loading team..." />
          ) : supportTeam.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No Project accounts yet. Create one to get started.</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-50 dark:divide-slate-700/50">
              {supportTeam.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={s.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.designation || "Project Manager"}</p>
                  </div>
                  <Badge tone={s.status === "Inactive" ? "red" : "green"}>{s.status || "Active"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="flex items-center gap-4">
        <span className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck size={18} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{users.length} total team accounts</p>
          <p className="text-xs text-slate-400">Across Admin, BD/Sales, Marketing, Project and Finance roles</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/accounts")}>Manage Accounts</Button>
      </Card>
    </div>
  );
}
