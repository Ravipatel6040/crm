import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Handshake, FolderKanban, Wallet, AlertTriangle, ArrowRight, Sparkles,
  UserCog, Pencil, UserCheck, Briefcase, Package, Wrench, Headphones,
  Receipt, BarChart3, CheckSquare, Bell, ShieldCheck, DollarSign, Target, CheckCircle2, XCircle
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

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const { data: summaryWrapper, isLoading: loadingSummary } = useGetDashboardSummaryQuery();
  const { data: usersData, isLoading: loadingUsers } = useGetUsersQuery();
  const { data: revenueData } = useGetRevenueOverviewQuery();
  const { data: pipelineData } = useGetPipelineSummaryQuery();
  const { data: leadSourceData } = useGetLeadSourcesSummaryQuery();

  const users = usersData?.data ?? usersData ?? [];
  const salesTeam = users.filter((u) => u.role === ROLES.SALES);
  const supportTeam = users.filter((u) => u.role === ROLES.PROJECT_MANAGER);
  
  const summary = summaryWrapper?.data || summaryWrapper || {};
  const business = summary.business || {};
  const leads = summary.leads || {};
  const clients = summary.clients || {};
  const projects = summary.projects || {};
  const finance = summary.finance || {};

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-primary-500 px-6 sm:px-8 py-7 text-white">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 rounded-full px-3 py-1 mb-3">
              <Sparkles size={12} /> {ROLE_LABELS[user?.role]} workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Welcome back, {(user?.name && user?.name !== "User") ? user.name.split(" ")[0] : "Admin"}.
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

      {loadingSummary ? (
        <LoadingState label="Loading dashboard data..." />
      ) : (
        <>
          {/* A. Business Overview */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800">A. Business Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
              <KpiCard title="Total Revenue" value={formatCompactCurrency(business.totalRevenue ?? 0)} tone="green" />
              <KpiCard title="Monthly Revenue" value={formatCompactCurrency(business.monthlyRevenue ?? 0)} tone="primary" />
              <KpiCard title="Pending Payments" value={formatCompactCurrency(business.pendingPayments ?? 0)} tone="amber" />
              <KpiCard title="Total Expenses" value={formatCompactCurrency(business.totalExpenses ?? 0)} tone="red" />
              <KpiCard title="Net Revenue" value={formatCompactCurrency(business.netRevenue ?? 0)} tone="primary" />
              <KpiCard title="New Clients" value={business.newClients ?? 0} tone="green" />
              <KpiCard title="Lost Clients" value={business.lostClients ?? 0} tone="red" />
              <KpiCard title="Active Projects" value={business.activeProjects ?? 0} tone="primary" />
            </div>
            
            {/* Charts for Business Overview */}
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 mt-2">
              <RevenueChart data={revenueData?.data} />
              <PipelineChart data={pipelineData?.data} />
            </div>
            <LeadSourceChart data={leadSourceData?.data} />
          </section>

          {/* B. Lead Overview */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">B. Lead Overview</h2>
              <Button size="sm" variant="outline" onClick={() => navigate("/leads")}>Manage Leads</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-4">
              <KpiCard title="Total Leads" value={leads.total ?? 0} tone="slate" />
              <KpiCard title="New Leads" value={leads.new ?? 0} tone="primary" />
              <KpiCard title="Contacted" value={leads.contacted ?? 0} tone="amber" />
              <KpiCard title="Follow-up" value={leads.followUp ?? 0} tone="amber" />
              <KpiCard title="Proposal" value={leads.proposal ?? 0} tone="primary" />
              <KpiCard title="Won" value={leads.won ?? 0} tone="green" />
              <KpiCard title="Lost" value={leads.lost ?? 0} tone="red" />
            </div>
            <Card>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-slate-100 dark:divide-slate-700">
                <div className="flex flex-col gap-1 p-2">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Actions</span>
                  <a href="/leads" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all leads</a>
                </div>
                <div className="flex flex-col gap-1 p-2">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Sales</span>
                  <a href="/leads" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Assign leads</a>
                </div>
                <div className="flex flex-col gap-1 p-2">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Status</span>
                  <a href="/leads" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Change status</a>
                </div>
                <div className="flex flex-col gap-1 p-2">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Analytics</span>
                  <a href="/reports" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Track conversion</a>
                </div>
              </div>
            </Card>
          </section>

          {/* C. Client Overview */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">C. Client Overview</h2>
              <Button size="sm" variant="outline" onClick={() => navigate("/clients")}>Manage Clients</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard title="Total Clients" value={clients.total ?? 0} tone="slate" />
              <KpiCard title="New Clients" value={clients.active ?? 0} tone="primary" />
              <KpiCard title="Active Clients" value={clients.active ?? 0} tone="green" />
              <KpiCard title="Inactive Clients" value={clients.inactive ?? 0} tone="red" />
              <KpiCard title="High-Value" value={clients.highValue ?? 0} tone="amber" />
              <KpiCard title="Pending Payments" value={clients.pendingPayments ?? 0} tone="red" />
            </div>
          </section>

          {/* D. Project Overview */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">D. Project Overview</h2>
              <Button size="sm" variant="outline" onClick={() => navigate("/projects")}>Manage Projects</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard title="Active Projects" value={projects.active ?? 0} tone="primary" />
              <KpiCard title="Completed Projects" value={projects.completed ?? 0} tone="green" />
              <KpiCard title="Pending Projects" value={projects.pending ?? 0} tone="slate" />
              <KpiCard title="Delayed Projects" value={projects.delayed ?? 0} tone="red" />
            </div>
          </section>

          {/* E. Finance Overview */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">E. Finance Overview</h2>
              <Button size="sm" variant="outline" onClick={() => navigate("/payments")}>Manage Finances</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard title="Total Revenue" value={formatCompactCurrency(finance.totalRevenue ?? 0)} tone="green" />
              <KpiCard title="Paid Invoices" value={formatCompactCurrency(finance.totalRevenue ?? 0)} tone="green" />
              <KpiCard title="Pending Invoices" value={formatCompactCurrency(finance.pendingPayments ?? 0)} tone="amber" />
              <KpiCard title="Overdue Invoices" value={formatCompactCurrency(finance.overduePayments ?? 0)} tone="red" />
              <KpiCard title="Total Expenses" value={formatCompactCurrency(finance.totalExpenses ?? 0)} tone="red" />
              <KpiCard title="Net Profit" value={formatCompactCurrency(finance.netRevenue ?? 0)} tone="primary" />
            </div>
          </section>

          {/* F. Team Management */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">F. Team Management</h2>
              <Button size="sm" variant="outline" onClick={() => navigate("/accounts")}>Manage Team</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <UserCog size={15} className="text-primary-500" /> Sales Team
                  </h3>
                </div>
                {loadingUsers ? (
                  <LoadingState label="Loading team..." />
                ) : salesTeam.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No BD/Sales accounts yet.</p>
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
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Headphones size={15} className="text-primary-500" /> Support / Delivery
                  </h3>
                </div>
                {loadingUsers ? (
                  <LoadingState label="Loading team..." />
                ) : supportTeam.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">No Project accounts yet.</p>
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
            <Card className="flex items-center gap-4 mt-2 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Full Access Control</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Create accounts, assign roles, change passwords, and track logins.</p>
              </div>
              <Button onClick={() => navigate("/accounts")}>Go to Accounts</Button>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
