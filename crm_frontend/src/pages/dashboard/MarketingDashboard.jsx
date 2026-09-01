import { useNavigate } from "react-router-dom";
import {
  Megaphone, Target, BarChart2, MousePointerClick, 
  ArrowRight, Sparkles, Plus, Play, Pause, Edit, Link, Activity
} from "lucide-react";
import { LeadSourceChart, RevenueChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Button, LoadingState, EmptyState } from "../../components/common";
import { ROLE_LABELS } from "../../constants/roles";
import { formatCompactCurrency } from "../../utils/format";
import {
  useGetMarketingDashboardSummaryQuery, useGetRevenueOverviewQuery
} from "../../store/api/apiSlice";

export default function MarketingDashboard({ user }) {
  const navigate = useNavigate();
  const { data: summaryWrapper, isLoading: loadingSummary } = useGetMarketingDashboardSummaryQuery();
  const { data: revenueWrapper } = useGetRevenueOverviewQuery(); // Mock monthly analytics
  
  const summary = summaryWrapper?.data || summaryWrapper || {};
  const kpis = summary.kpis || {};
  const leadSources = summary.leadSources || [];
  const revenueData = revenueWrapper?.data || [];

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
              Hello, {user?.name?.split(" ")[0]}.
            </h1>
            <p className="text-primary-100 text-sm mt-1.5 max-w-md">
              You are currently running {kpis.totalCampaigns || 0} active campaigns generating {kpis.leadsGenerated || 0} leads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => navigate("/campaigns")} className="flex items-center gap-2 rounded-xl bg-white text-primary-700 px-3.5 py-2.5 text-sm font-semibold hover:bg-primary-50">
              <Plus size={15} /> New Campaign
            </button>
            <button onClick={() => navigate("/reports")} className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur px-3.5 py-2.5 text-sm font-medium">
              <BarChart2 size={15} /> Analytics
            </button>
          </div>
        </div>
      </div>

      {loadingSummary ? (
        <LoadingState label="Loading marketing data..." />
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Campaigns" value={kpis.totalCampaigns || 0} tone="primary" />
            <KpiCard title="Leads Generated" value={kpis.leadsGenerated || 0} tone="primary" />
            <KpiCard title="Qualified Leads" value={kpis.qualifiedLeads || 0} tone="amber" />
            <KpiCard title="Conversions" value={kpis.conversions || 0} tone="green" />
            <KpiCard title="Conversion Rate" value={`${kpis.conversionRate || 0}%`} tone="green" />
            <KpiCard title="Campaign Spend" value={formatCompactCurrency(kpis.campaignSpend || 0)} tone="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="flex flex-col gap-6">
              {/* Marketing Analytics Charts */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Marketing Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LeadSourceChart data={leadSources} />
                  {/* Using Revenue chart as mock Monthly Performance */}
                  <RevenueChart data={revenueData} /> 
                </div>
              </section>

              {/* Campaign Management Grid */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Campaign Management</h2>
                <Card>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-y divide-slate-100 [&>div]:p-4">
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <Plus className="text-primary-500 mb-1" size={20}/>
                      <a href="/campaigns" className="text-sm text-slate-700 font-medium hover:text-primary-600">Create Campaign</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <Edit className="text-primary-500 mb-1" size={20}/>
                      <a href="/campaigns" className="text-sm text-slate-700 font-medium hover:text-primary-600">Edit Campaign</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <Play className="text-primary-500 mb-1" size={20}/>
                      <a href="/campaigns" className="text-sm text-slate-700 font-medium hover:text-primary-600">Start / Stop</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <Link className="text-primary-500 mb-1" size={20}/>
                      <a href="/campaigns" className="text-sm text-slate-700 font-medium hover:text-primary-600">Add Content</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <MousePointerClick className="text-primary-500 mb-1" size={20}/>
                      <a href="/leads" className="text-sm text-slate-700 font-medium hover:text-primary-600">Track Leads</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <Target className="text-primary-500 mb-1" size={20}/>
                      <a href="/reports" className="text-sm text-slate-700 font-medium hover:text-primary-600">Track Conversions</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <Activity className="text-primary-500 mb-1" size={20}/>
                      <a href="/reports" className="text-sm text-slate-700 font-medium hover:text-primary-600">View Performance</a>
                    </div>
                  </div>
                </Card>
              </section>
            </div>

            {/* Lead Sources Breakdown List */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Lead Sources</h2>
              </div>
              <Card className="h-full">
                {leadSources.length === 0 ? (
                  <EmptyState icon={Target} title="No leads generated yet" />
                ) : (
                  <div className="flex flex-col gap-4">
                    {leadSources.map((s, idx) => (
                      <div key={idx} className="flex gap-3 border-b border-slate-50 pb-4 last:border-0 last:pb-0 items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                        </div>
                        <div className="text-sm font-bold text-slate-600 text-right">
                          {s.value} <span className="text-xs font-normal text-slate-400">leads</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
