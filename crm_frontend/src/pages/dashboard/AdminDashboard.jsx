import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, ArrowRight, Target, Receipt, BarChart3, ShieldCheck,
  TrendingUp, TrendingDown, Users, FolderKanban, Clock, AlertTriangle,
  Trophy, Banknote, CircleDollarSign, Activity, Settings2, ChevronRight,
} from "lucide-react";
import { LeadSourceChart, RevenueChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import {
  Card, CardHeader, Badge, Avatar, Button, LoadingState, EmptyState, ProgressBar,
} from "../../components/common";
import { ROLE_LABELS } from "../../constants/roles";
import { formatCompactCurrency, classNames } from "../../utils/format";
import {
  useGetDashboardSummaryQuery,
  useGetPipelineSummaryQuery,
  useGetLeadSourcesSummaryQuery,
  useGetRevenueOverviewQuery,
  useGetTeamPerformanceQuery,
} from "../../store/api/apiSlice";

// Stable identity so useMemo deps don't churn while a query is loading.
const EMPTY = [];

// Stages that represent live pipeline, in funnel order. Won/Lost are outcomes
// and are shown separately rather than as funnel steps.
const FUNNEL_STAGES = ["New", "Contacted", "Follow-up", "Proposal", "Negotiation"];

const stageAccent = {
  New: "bg-sky-500",
  Contacted: "bg-violet-500",
  "Follow-up": "bg-amber-500",
  Proposal: "bg-primary-500",
  Negotiation: "bg-fuchsia-500",
};

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Proportional horizontal funnel — replaces the flat grid of stage boxes. */
function PipelineFunnel({ stages, onSelect }) {
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {stages.map((s) => {
        const pct = Math.round((s.count / max) * 100);
        return (
          <button
            key={s.stage}
            type="button"
            onClick={() => onSelect(s.stage)}
            className="group grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
          >
            <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
              {s.stage}
            </span>
            <span className="relative h-7 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700/40">
              <span
                className={classNames(
                  "absolute inset-y-0 left-0 rounded-md transition-all duration-500 group-hover:brightness-110",
                  stageAccent[s.stage] || "bg-slate-400"
                )}
                style={{ width: `${Math.max(pct, s.count > 0 ? 4 : 0)}%` }}
              />
            </span>
            <span className="text-right text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
              {s.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TeamLeaderboard({ rows, onSelect }) {
  const topValue = Math.max(...rows.map((r) => r.wonValue), 1);

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
      {rows.map((rep, i) => (
        <div
          key={rep.id}
          className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer rounded-lg px-2 -mx-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
          onClick={() => onSelect(rep)}
        >
          <span
            className={classNames(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
              i === 0
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            )}
          >
            {i + 1}
          </span>
          <Avatar name={rep.name} size="sm" />

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {rep.name}
              </p>
              {rep.overdueFollowUps > 0 && (
                <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  <Clock size={9} /> {rep.overdueFollowUps} overdue
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <ProgressBar
                value={(rep.wonValue / topValue) * 100}
                tone={i === 0 ? "amber" : "primary"}
                className="h-1.5 max-w-[10rem]"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {rep.won}/{rep.total} won
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {formatCompactCurrency(rep.wonValue)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {rep.conversionRate}% conversion
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();

  const { data: summaryWrapper, isLoading: loadingSummary } = useGetDashboardSummaryQuery();
  const { data: pipelineData } = useGetPipelineSummaryQuery();
  const { data: leadSourceData } = useGetLeadSourcesSummaryQuery();
  const { data: revenueData } = useGetRevenueOverviewQuery();
  const { data: teamData, isLoading: loadingTeam } = useGetTeamPerformanceQuery();

  const summary = summaryWrapper?.data || summaryWrapper || {};
  const business = summary.business || {};
  const leads = summary.leads || {};
  const clients = summary.clients || {};
  const projects = summary.projects || {};

  const team = teamData?.data ?? teamData ?? [];
  const pipeline = pipelineData?.data ?? pipelineData ?? EMPTY;

  const funnelStages = useMemo(() => {
    const byStage = Object.fromEntries(
      (Array.isArray(pipeline) ? pipeline : []).map((p) => [p.stage || p.name, p.count ?? p.value ?? 0])
    );
    return FUNNEL_STAGES.map((stage) => ({ stage, count: byStage[stage] ?? 0 }));
  }, [pipeline]);

  const openPipelineValue = team.reduce((sum, r) => sum + (r.openValue || 0), 0);
  const overdueTotal = team.reduce((sum, r) => sum + (r.overdueFollowUps || 0), 0);
  const conversionRate = leads.total ? Math.round(((leads.won || 0) / leads.total) * 100) : 0;
  const netIsPositive = (business.netRevenue ?? 0) >= 0;

  const firstName =
    user?.name && user.name !== "User" ? user.name.split(" ")[0] : "Admin";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const quickActions = [
    { label: "Add Lead", hint: "Create a new opportunity", icon: UserPlus, to: "/leads?new=true" },
    { label: "Follow-up Queue", hint: "Calls & meetings due", icon: Clock, to: "/follow-ups" },
    { label: "Team Accounts", hint: "Manage access", icon: Users, to: "/accounts" },
    { label: "Audit Log", hint: "Who changed what", icon: Activity, to: "/activity" },
    { label: "Invoices", hint: "Billing & collections", icon: Receipt, to: "/invoices" },
    { label: "Settings", hint: "Configure the system", icon: Settings2, to: "/settings" },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className={classNames(
          "relative overflow-hidden rounded-2xl border px-6 py-7 sm:px-8",
          "border-slate-200/80 bg-white",
          "dark:border-slate-700/60 dark:bg-slate-800/70"
        )}
      >
        {/* Layered wash — subtle in light, luminous in dark */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-500/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-sky-400/[0.07] blur-3xl dark:bg-sky-500/10"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="primary">
                <ShieldCheck size={12} /> {ROLE_LABELS[user?.role] || "Admin"}
              </Badge>
              <span className="text-xs text-slate-400 dark:text-slate-500">{today}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
              Good to see you, {firstName}.
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-slate-500 dark:text-slate-400">
              {leads.total
                ? `${leads.total} leads in the funnel, ${formatCompactCurrency(openPipelineValue)} still open.`
                : "Your workspace is ready — add your first lead to start tracking the pipeline."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button icon={UserPlus} onClick={() => navigate("/leads?new=true")}>
              New Lead
            </Button>
            <Button variant="outline" icon={Users} onClick={() => navigate("/accounts")}>
              Team
            </Button>
            <Button variant="outline" icon={BarChart3} onClick={() => navigate("/reports")}>
              Reports
            </Button>
          </div>
        </div>

        {/* Inline signal strip */}
        <div className="relative mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-4 dark:border-slate-700/60">
          {[
            { label: "Open pipeline", value: formatCompactCurrency(openPipelineValue), icon: CircleDollarSign },
            { label: "Won this month", value: business.dealsWonThisMonth ?? 0, icon: Trophy },
            { label: "Active projects", value: projects.active ?? 0, icon: FolderKanban },
            {
              label: "Overdue follow-ups",
              value: overdueTotal,
              icon: AlertTriangle,
              alert: overdueTotal > 0,
            },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              <s.icon
                size={15}
                className={s.alert ? "text-amber-500" : "text-slate-400 dark:text-slate-500"}
              />
              <div className="min-w-0">
                <p
                  className={classNames(
                    "text-base font-bold leading-none",
                    s.alert ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-100"
                  )}
                >
                  {s.value}
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </header>

      {loadingSummary ? (
        <LoadingState label="Loading dashboard data..." />
      ) : (
        <>
          {/* ── Financial position ──────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <SectionHeading
              eyebrow="Overview"
              title="Financial position"
              description="Collected, outstanding and spent — from recorded payments and expenses only."
              action={
                <Button size="sm" variant="ghost" icon={ChevronRight} iconPosition="right" onClick={() => navigate("/finance")}>
                  Finance
                </Button>
              }
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon={Banknote}
                title="Total Revenue"
                value={formatCompactCurrency(business.totalRevenue ?? 0)}
                description={`${formatCompactCurrency(business.monthlyRevenue ?? 0)} this month`}
                tone="green"
                onClick={() => navigate("/payments")}
              />
              <KpiCard
                icon={Clock}
                title="Pending Payments"
                value={formatCompactCurrency(business.pendingPayments ?? 0)}
                description="Awaiting collection"
                tone="amber"
                onClick={() => navigate("/payments")}
              />
              <KpiCard
                icon={Receipt}
                title="Total Expenses"
                value={formatCompactCurrency(business.totalExpenses ?? 0)}
                description="All recorded spend"
                tone="red"
                onClick={() => navigate("/expenses")}
              />
              <KpiCard
                icon={netIsPositive ? TrendingUp : TrendingDown}
                title="Net Revenue"
                value={formatCompactCurrency(business.netRevenue ?? 0)}
                description={netIsPositive ? "Revenue exceeds spend" : "Spend exceeds revenue"}
                tone={netIsPositive ? "primary" : "red"}
              />
            </div>
          </section>

          {/* ── Trend + sources ─────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <RevenueChart
                data={revenueData}
                title="Revenue Trend"
                subtitle="Last six months — paid vs pending"
              />
            </div>
            <div className="xl:col-span-2">
              <LeadSourceChart data={leadSourceData} />
            </div>
          </section>

          {/* ── Pipeline ────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <SectionHeading
              eyebrow="Sales"
              title="Pipeline health"
              description="Where every open opportunity currently sits"
              action={
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate("/follow-ups")}>
                    Follow-ups
                  </Button>
                  <Button size="sm" onClick={() => navigate("/leads")}>
                    Manage Leads
                  </Button>
                </div>
              }
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader
                  title="Stage distribution"
                  subtitle="Open deals only — click a stage to filter"
                />
                {leads.total ? (
                  <PipelineFunnel
                    stages={funnelStages}
                    onSelect={(stage) => navigate(`/leads?status=${encodeURIComponent(stage)}`)}
                  />
                ) : (
                  <EmptyState
                    icon={Target}
                    title="No leads in the pipeline"
                    description="Add your first lead to start tracking deal stages."
                    action={<Button size="sm" icon={UserPlus} onClick={() => navigate("/leads?new=true")}>Add Lead</Button>}
                  />
                )}
              </Card>

              <Card>
                <CardHeader title="Conversion outcomes" subtitle="Closed deals across all time" />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate("/leads?status=Won")}
                    className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-left transition-colors hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
                  >
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{leads.won ?? 0}</p>
                    <p className="mt-0.5 text-xs font-medium text-emerald-700/80 dark:text-emerald-400/90">Deals won</p>
                  </button>
                  <button
                    onClick={() => navigate("/leads?status=Lost")}
                    className="rounded-xl border border-red-100 bg-red-50/60 p-4 text-left transition-colors hover:bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/15"
                  >
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{leads.lost ?? 0}</p>
                    <p className="mt-0.5 text-xs font-medium text-red-600/80 dark:text-red-400/90">Deals lost</p>
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 p-4 dark:border-slate-700/60">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Win rate</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{conversionRate}%</span>
                  </div>
                  <ProgressBar value={conversionRate} tone={conversionRate >= 30 ? "green" : "amber"} />
                  <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                    {leads.won ?? 0} won out of {leads.total ?? 0} total leads
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/60">
                  {[
                    { label: "Clients", value: clients.total ?? 0, to: "/clients" },
                    { label: "New this month", value: business.newClients ?? 0, to: "/clients" },
                    { label: "High value", value: clients.highValue ?? 0, to: "/clients" },
                  ].map((s) => (
                    <button key={s.label} onClick={() => navigate(s.to)} className="text-left">
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{s.label}</p>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </section>

          {/* ── Team performance ────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <SectionHeading
              eyebrow="People"
              title="Team performance"
              description="Ranked by closed-won value, across every assigned lead"
              action={
                <Button size="sm" variant="ghost" icon={ChevronRight} iconPosition="right" onClick={() => navigate("/accounts")}>
                  Team accounts
                </Button>
              }
            />
            <Card>
              {loadingTeam ? (
                <LoadingState label="Loading team performance..." />
              ) : team.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No assigned leads yet"
                  description="Assign leads to your BD/Sales team and their performance will appear here."
                  action={<Button size="sm" onClick={() => navigate("/leads")}>Go to Leads</Button>}
                />
              ) : (
                <TeamLeaderboard rows={team} onSelect={() => navigate("/leads")} />
              )}
            </Card>
          </section>

          {/* ── Delivery ────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <SectionHeading
              eyebrow="Delivery"
              title="Project overview"
              action={
                <Button size="sm" variant="ghost" icon={ChevronRight} iconPosition="right" onClick={() => navigate("/projects")}>
                  All projects
                </Button>
              }
            />
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <KpiCard icon={FolderKanban} title="Active" value={projects.active ?? 0} tone="primary" onClick={() => navigate("/projects")} />
              <KpiCard icon={Trophy} title="Completed" value={projects.completed ?? 0} tone="green" onClick={() => navigate("/projects")} />
              <KpiCard icon={Clock} title="Pending" value={projects.pending ?? 0} tone="slate" onClick={() => navigate("/projects")} />
              <KpiCard icon={AlertTriangle} title="Delayed" value={projects.delayed ?? 0} tone="red" onClick={() => navigate("/projects")} />
            </div>
          </section>

          {/* ── Quick actions ───────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <SectionHeading eyebrow="Shortcuts" title="Jump to" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className={classNames(
                    "group flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all duration-150",
                    "border-slate-200/80 bg-white hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-[0_8px_20px_-10px_rgba(58,86,176,0.35)]",
                    "dark:border-slate-700/60 dark:bg-slate-800/70 dark:hover:border-primary-500/40"
                  )}
                >
                  <a.icon size={17} className="text-primary-500 dark:text-primary-400" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{a.label}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{a.hint}</span>
                  <ArrowRight
                    size={13}
                    className="mt-0.5 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary-500 dark:text-slate-600"
                  />
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
