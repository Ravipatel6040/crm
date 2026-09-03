import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Handshake, FolderKanban, ArrowRight, Sparkles, Target,
  Receipt, BarChart3, ShieldCheck, DollarSign, Clock, ChevronRight
} from "lucide-react";
import { LeadSourceChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Avatar, Button, LoadingState, Table, Tr, Td, ProgressBar } from "../../components/common";
import { ROLE_LABELS, ROLES } from "../../constants/roles";
import { formatCompactCurrency, formatCurrency, formatDate } from "../../utils/format";
import {
  useGetDashboardSummaryQuery, useGetUsersQuery,
  useGetPipelineSummaryQuery, useGetLeadSourcesSummaryQuery,
  useGetLeadsQuery
} from "../../store/api/apiSlice";

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const { data: summaryWrapper, isLoading: loadingSummary } = useGetDashboardSummaryQuery();
  const { data: usersData } = useGetUsersQuery();
  const { data: pipelineData } = useGetPipelineSummaryQuery();
  const { data: leadSourceData } = useGetLeadSourcesSummaryQuery();
  const { data: leadsData } = useGetLeadsQuery();

  const summary = summaryWrapper?.data || summaryWrapper || {};
  const business = summary.business || {};
  const leads = summary.leads || {};
  const clients = summary.clients || {};
  const projects = summary.projects || {};
  const finance = summary.finance || {};

  const users = usersData?.data ?? usersData ?? [];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl px-6 sm:px-10 py-8 sm:py-10 text-white shadow-lg bg-slate-900 border border-slate-800">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 opacity-70 mix-blend-screen"
          style={{
            backgroundImage: 'url(/images/dashboard-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 z-0 h-full w-1/2 bg-gradient-to-l from-primary-500/20 to-transparent mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary-500/20 text-primary-200 border border-primary-500/30 rounded-full px-3 py-1 mb-4 shadow-sm backdrop-blur-md">
              <Sparkles size={12} className="text-primary-300" /> {ROLE_LABELS[user?.role]} workspace
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              Welcome back, {(user?.name && user?.name !== "User") ? user.name.split(" ")[0] : "Admin"}.
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-lg font-medium drop-shadow">
              Manage every account, team and module in CRM Gangatara from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => navigate("/accounts")}
              className="flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2.5 text-sm font-bold transition-all hover:bg-slate-100 hover:scale-105 hover:shadow-xl shadow-lg shadow-white/10 active:scale-95"
            >
              <UserPlus size={16} /> Create Account
            </button>
            <button
              onClick={() => navigate("/reports")}
              className="flex items-center gap-2 rounded-xl bg-slate-800/60 border border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 text-white backdrop-blur-md px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-lg active:scale-95"
            >
              <BarChart3 size={16} /> View Reports
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
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">A. Business Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard title="Total Revenue" value={formatCompactCurrency(business.totalRevenue ?? 0)} tone="green" />
              <KpiCard title="Pending Payments" value={formatCompactCurrency(business.pendingPayments ?? 0)} tone="amber" />
              <KpiCard title="Total Expenses" value={formatCompactCurrency(business.totalExpenses ?? 0)} tone="red" />
              <KpiCard title="Net Revenue" value={formatCompactCurrency(business.netRevenue ?? 0)} tone="primary" />
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

                <div onClick={() => navigate("/leads?status=Proposal")} className="cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
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


            {/* Executive BD / Sales Quick Action Hub */}
            <Card className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary-500" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Executive BD / Sales Operations</h3>
                  </div>
                  <span className="text-xs text-slate-400">Admin Control</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
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
                  <button onClick={() => navigate("/reports")} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:text-primary-600 transition-all text-left flex flex-col gap-1 border border-slate-100 dark:border-slate-800">
                    <BarChart3 size={16} className="text-primary-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Sales Reports</span>
                    <span className="text-[11px] text-slate-400">Conversion analytics</span>
                  </button>
                </div>
            </Card>
          </section>


          {/* C. Project Overview */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">C. Project Overview</h2>
              <Button size="sm" variant="outline" onClick={() => navigate("/projects")}>Manage Projects</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard title="Active Projects" value={projects.active ?? 0} tone="primary" />
              <KpiCard title="Completed Projects" value={projects.completed ?? 0} tone="green" />
              <KpiCard title="Pending Projects" value={projects.pending ?? 0} tone="slate" />
              <KpiCard title="Delayed Projects" value={projects.delayed ?? 0} tone="red" />
            </div>
          </section>



        </>
      )}
    </div>
  );
}
