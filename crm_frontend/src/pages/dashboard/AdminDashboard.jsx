import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Handshake, FolderKanban, Wallet, AlertTriangle, ArrowRight, Sparkles,
  UserCog, Pencil, UserCheck, Briefcase, Package, Wrench, Headphones,
  Receipt, BarChart3, CheckSquare, Bell, ShieldCheck, DollarSign, Target, CheckCircle2, XCircle,
  Megaphone, TrendingUp, CreditCard, Clock, Calendar, ChevronRight, ExternalLink
} from "lucide-react";
import { LeadSourceChart, PipelineChart, RevenueChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Avatar, Button, LoadingState, Table, Tr, Td, ProgressBar } from "../../components/common";
import { ROLE_LABELS, ROLES } from "../../constants/roles";
import { formatCompactCurrency, formatCurrency, formatDate } from "../../utils/format";
import {
  useGetDashboardSummaryQuery, useGetUsersQuery, useGetRevenueOverviewQuery,
  useGetPipelineSummaryQuery, useGetLeadSourcesSummaryQuery,
  useGetCampaignsQuery, useGetPaymentsQuery, useGetProjectsQuery, useGetLeadsQuery
} from "../../store/api/apiSlice";

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const { data: summaryWrapper, isLoading: loadingSummary } = useGetDashboardSummaryQuery();
  const { data: usersData, isLoading: loadingUsers } = useGetUsersQuery();
  const { data: revenueData } = useGetRevenueOverviewQuery();
  const { data: pipelineData } = useGetPipelineSummaryQuery();
  const { data: leadSourceData } = useGetLeadSourcesSummaryQuery();
  const { data: campaignsData } = useGetCampaignsQuery();
  const { data: paymentsData } = useGetPaymentsQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const { data: leadsData } = useGetLeadsQuery();

  const summary = summaryWrapper?.data || summaryWrapper || {};
  const business = summary.business || {};
  const leads = summary.leads || {};
  const clients = summary.clients || {};
  const projects = summary.projects || {};
  const finance = summary.finance || {};

  const users = usersData?.data ?? usersData ?? [];
  const salesTeam = users.filter((u) => u.role === ROLES.SALES);
  const supportTeam = users.filter((u) => u.role === ROLES.PROJECT_MANAGER);

  const campaigns = Array.isArray(campaignsData?.data) ? campaignsData.data : Array.isArray(campaignsData) ? campaignsData : [];
  const payments = Array.isArray(paymentsData?.data) ? paymentsData.data : Array.isArray(paymentsData) ? paymentsData : [];
  const projectsList = Array.isArray(projectsData?.data) ? projectsData.data : Array.isArray(projectsData) ? projectsData : [];

  const activeCampaigns = campaigns.filter((c) => c.status === "Active" || !c.status);
  const totalAdSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
  const totalMarketingLeads = campaigns.reduce((acc, c) => acc + (c.leads || 0), 0);
  const avgCpl = totalMarketingLeads > 0 ? Math.round(totalAdSpend / totalMarketingLeads) : 0;
  const topCampaigns = campaigns.slice(0, 4);

  const recentPayments = payments.slice(0, 5);
  const monthlyGoal = 1000000;
  const currentCollected = business.monthlyRevenue ?? finance.totalRevenue ?? 0;
  const goalProgress = Math.min(100, Math.round((currentCollected / monthlyGoal) * 100));

  const getProjectName = (id) => projectsList.find((p) => p.id === id || p._id === id)?.name || id || "Client Account";

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
              <RevenueChart data={revenueData?.data ?? revenueData} />
              <PipelineChart data={pipelineData?.data ?? pipelineData} />
            </div>
            <LeadSourceChart data={leadSourceData?.data ?? leadSourceData} />
          </section>

          {/* B. BD / Sales Control - Full Access Control */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">B. BD & Sales Control</h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={12} /> Full Control
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Lead pipelines, conversions, sales performance, and rep assignments</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate("/follow-ups")}>Follow-ups</Button>
                <Button size="sm" onClick={() => navigate("/leads")}>Manage Leads</Button>
              </div>
            </div>

            {/* 4 Core BD / Sales Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard title="Total Pipeline Leads" value={leads.total ?? 0} tone="slate" />
              <KpiCard title="Active In-Progress" value={(leads.contacted || 0) + (leads.followUp || 0) + (leads.proposal || 0)} tone="amber" />
              <KpiCard title="Deals Won" value={leads.won ?? 0} tone="green" />
              <KpiCard title="Win Conversion Rate" value={`${leads.total ? Math.round(((leads.won || 0) / leads.total) * 100) : 0}%`} tone="primary" />
            </div>

            {/* Pipeline Stage Funnel Breakdown */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-primary-500" />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Deal Stages & Pipeline Flow</h3>
                </div>
                <button onClick={() => navigate("/leads")} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5">
                  View Full Pipeline <ChevronRight size={13} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                <div onClick={() => navigate("/leads")} className="cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">New Leads</span>
                    <Badge tone="primary">New</Badge>
                  </div>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{leads.new ?? 0}</p>
                </div>

                <div onClick={() => navigate("/leads")} className="cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Contacted</span>
                    <Badge tone="amber">Contact</Badge>
                  </div>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{leads.contacted ?? 0}</p>
                </div>

                <div onClick={() => navigate("/follow-ups")} className="cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Follow-up</span>
                    <Badge tone="amber">Pending</Badge>
                  </div>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{leads.followUp ?? 0}</p>
                </div>

                <div onClick={() => navigate("/documents")} className="cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Proposal</span>
                    <Badge tone="primary">Review</Badge>
                  </div>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{leads.proposal ?? 0}</p>
                </div>

                <div onClick={() => navigate("/leads")} className="cursor-pointer p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 transition-colors border border-emerald-100 dark:border-emerald-900/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Deals Won</span>
                    <Badge tone="green">Closed</Badge>
                  </div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{leads.won ?? 0}</p>
                </div>

                <div onClick={() => navigate("/leads")} className="cursor-pointer p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 transition-colors border border-red-100 dark:border-red-900/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">Lost Leads</span>
                    <Badge tone="red">Lost</Badge>
                  </div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{leads.lost ?? 0}</p>
                </div>
              </div>
            </Card>

            {/* Sales Team & Quick Executive Dispatch */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-5">
              <Card className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">BD / Sales Roster</span>
                    <Badge tone="primary">{salesTeam.length} Active Reps</Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Sales Force Coverage</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {salesTeam.length > 0
                      ? `${salesTeam.length} executive(s) handling lead qualification, customer meetings, and negotiations.`
                      : "No dedicated sales representatives assigned yet."}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => navigate("/accounts")}>
                    Manage Sales Team
                  </Button>
                  <Button size="sm" className="w-full text-xs" onClick={() => navigate("/leads")}>
                    Assign Leads
                  </Button>
                </div>
              </Card>

              {/* Direct Full Control Quick Action Hub */}
              <Card className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary-500" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Executive BD / Sales Operations</h3>
                  </div>
                  <span className="text-xs text-slate-400">Admin Control</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <button onClick={() => navigate("/leads")} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-all text-left flex flex-col gap-1 border border-slate-100 dark:border-slate-800">
                    <UserPlus size={16} className="text-primary-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Add New Lead</span>
                    <span className="text-[11px] text-slate-400">Direct lead injection</span>
                  </button>
                  <button onClick={() => navigate("/follow-ups")} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-all text-left flex flex-col gap-1 border border-slate-100 dark:border-slate-800">
                    <Clock size={16} className="text-amber-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Follow-up Queue</span>
                    <span className="text-[11px] text-slate-400">Calls & meeting tasks</span>
                  </button>
                  <button onClick={() => navigate("/communication")} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-all text-left flex flex-col gap-1 border border-slate-100 dark:border-slate-800">
                    <Handshake size={16} className="text-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Client Comms</span>
                    <span className="text-[11px] text-slate-400">Call logs & emails</span>
                  </button>
                  <button onClick={() => navigate("/reports")} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-all text-left flex flex-col gap-1 border border-slate-100 dark:border-slate-800">
                    <BarChart3 size={16} className="text-primary-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Sales Reports</span>
                    <span className="text-[11px] text-slate-400">Conversion analytics</span>
                  </button>
                </div>
              </Card>
            </div>
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

          {/* E. Marketing Overview - Full Access Control */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">E. Marketing Control</h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={12} /> Full Control
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ad campaigns, marketing budget, and lead conversion</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate("/marketing/campaigns")}>All Campaigns</Button>
                <Button size="sm" onClick={() => navigate("/marketing")}>Open Marketing Page</Button>
              </div>
            </div>

            {/* 4 Core Marketing Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard title="Active Campaigns" value={activeCampaigns.length} tone="primary" />
              <KpiCard title="Total Ad Spend" value={formatCompactCurrency(totalAdSpend)} tone="amber" />
              <KpiCard title="Inbound Leads" value={totalMarketingLeads} tone="green" />
              <KpiCard title="Cost Per Lead (CPL)" value={formatCurrency(avgCpl)} tone="primary" />
            </div>

            {/* Top Active Campaigns Table (Full Width, Clutter-Free) */}
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Megaphone size={15} className="text-primary-500" /> Live Campaigns Snapshot
                </h3>
                <button onClick={() => navigate("/marketing/campaigns")} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5">
                  Manage Campaigns <ChevronRight size={13} />
                </button>
              </div>
              {topCampaigns.length === 0 ? (
                <p className="text-sm text-slate-400 p-6 text-center">No active campaigns running right now.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topCampaigns.map((c) => {
                    const spendPercent = Math.min(100, Math.round(((c.spend || 0) / (c.budget || 1)) * 100));
                    return (
                      <div key={c.id || c._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 gap-3 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{c.name}</p>
                            <Badge tone="slate">{c.platform || "Platform"}</Badge>
                          </div>
                          <p className="text-xs text-slate-400">Budget: {formatCurrency(c.budget)} • Spend: {formatCurrency(c.spend)}</p>
                        </div>
                        <div className="flex items-center gap-5 shrink-0 justify-between sm:justify-end">
                          <div className="w-28 hidden sm:block">
                            <span className="text-[11px] text-slate-400 block mb-0.5 text-right">{spendPercent}% spent</span>
                            <ProgressBar value={spendPercent} tone={spendPercent > 90 ? "red" : "primary"} className="h-1.5" />
                          </div>
                          <div className="text-right min-w-[70px]">
                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 block">{c.leads || 0} Leads</span>
                            <span className="text-[11px] text-slate-400">{c.won || 0} Won</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </section>

          {/* F. Finance Overview - Full Access Control */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">F. Finance Control</h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={12} /> Full Control
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cash collections, overdue monitoring, and financial health</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate("/payments")}>Invoices & Payments</Button>
                <Button size="sm" onClick={() => navigate("/finance")}>Open Finance Page</Button>
              </div>
            </div>

            {/* 4 Core Financial Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard title="Total Revenue" value={formatCompactCurrency(finance.totalRevenue ?? 0)} tone="green" />
              <KpiCard title="Pending Payments" value={formatCompactCurrency(finance.pendingPayments ?? 0)} tone="amber" />
              <KpiCard title="Overdue Invoices" value={formatCompactCurrency(finance.overduePayments ?? 0)} tone="red" />
              <KpiCard title="Net Profit" value={formatCompactCurrency(finance.netRevenue ?? 0)} tone="primary" />
            </div>

            {/* Monthly Goal Tracker & Recent Payments */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-5">
              <Card className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monthly Target</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">{goalProgress}% Achieved</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">{formatCurrency(currentCollected)}</p>
                  <ProgressBar value={goalProgress} tone="green" className="h-2.5 mb-3" />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block">Goal</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">₹10,00,000</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Remaining</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(Math.max(0, monthlyGoal - currentCollected))}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-0 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Receipt size={15} className="text-primary-500" /> Recent Invoices
                  </h3>
                  <button onClick={() => navigate("/payments")} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5">
                    View All <ChevronRight size={13} />
                  </button>
                </div>
                {recentPayments.length === 0 ? (
                  <p className="text-sm text-slate-400 p-6 text-center">No payment records logged yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentPayments.slice(0, 3).map((p) => (
                      <div key={p.id || p._id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{getProjectName(p.project)}</p>
                          <p className="text-xs text-slate-400">Due: {formatDate(p.dueDate)}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(p.amount)}</span>
                          <Badge tone={p.status === "Paid" ? "green" : p.status === "Overdue" ? "red" : "amber"}>
                            {p.status || "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </section>

          {/* G. Team Management */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">G. Team Management</h2>
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
