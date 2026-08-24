import { useNavigate } from "react-router-dom";
import { Megaphone, Radio, LineChart, Sparkles, Plus, TrendingUp, ArrowRight, Users } from "lucide-react";
import { LeadSourceChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, LoadingState, EmptyState } from "../../components/common";
import { ROLE_LABELS } from "../../constants/roles";
import { formatCompactCurrency } from "../../utils/format";
import {
  useGetCampaignsQuery, useGetMarketingLeadSourcesQuery, useGetLeadSourcesSummaryQuery, useGetLeadsQuery,
} from "../../store/api/apiSlice";

export default function MarketingDashboard({ user }) {
  const navigate = useNavigate();
  const { data: campaignsData, isLoading: loadingCampaigns } = useGetCampaignsQuery();
  const { data: sourcesData, isLoading: loadingSources } = useGetMarketingLeadSourcesQuery();
  const { data: leadSourceSummary } = useGetLeadSourcesSummaryQuery();
  const { data: leadsData } = useGetLeadsQuery();

  const campaigns = campaignsData ?? [];
  const sources = sourcesData ?? [];
  const leads = leadsData?.data ?? leadsData ?? [];

  const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalCampaignLeads = campaigns.reduce((s, c) => s + (c.leads || 0), 0);
  const roi = totalSpend ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl bg-primary-500 px-6 sm:px-8 py-7 text-white">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 rounded-full px-3 py-1 mb-3">
              <Sparkles size={12} /> {ROLE_LABELS[user?.role]} workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Good to see you, {user?.name?.split(" ")[0]}.
            </h1>
            <p className="text-primary-100 text-sm mt-1.5 max-w-md">
              {campaigns.length} active campaigns generating {totalCampaignLeads} leads this period.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => navigate("/marketing/campaigns")} className="flex items-center gap-2 rounded-xl bg-white text-primary-700 px-3.5 py-2.5 text-sm font-semibold hover:bg-primary-50">
              <Plus size={15} /> New Campaign
            </button>
            <button onClick={() => navigate("/marketing/analytics")} className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur px-3.5 py-2.5 text-sm font-medium">
              <LineChart size={15} /> Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon={Megaphone} title="Active Campaigns" value={campaigns.length} tone="primary" />
        <KpiCard icon={Users} title="Leads Generated" value={totalCampaignLeads} tone="green" />
        <KpiCard icon={TrendingUp} title="ROI" value={`${roi}%`} tone={roi >= 0 ? "green" : "red"} />
        <KpiCard icon={Radio} title="Total Ad Spend" value={formatCompactCurrency(totalSpend)} tone="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Top Campaigns</h3>
            <button onClick={() => navigate("/marketing/campaigns")} className="text-xs font-medium text-primary-600 flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {loadingCampaigns ? (
            <LoadingState label="Loading campaigns..." />
          ) : campaigns.length === 0 ? (
            <EmptyState icon={Megaphone} title="No campaigns yet" description="Create your first campaign to start tracking spend, leads and revenue." />
          ) : (
            <div className="flex flex-col divide-y divide-slate-50">
              {[...campaigns].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 truncate">{c.leads || 0} leads · {formatCompactCurrency(c.spend || 0)} spend</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 shrink-0">{formatCompactCurrency(c.revenue || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <LeadSourceChart data={leadSourceSummary} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Channel Performance</h3>
          <button onClick={() => navigate("/marketing/lead-sources")} className="text-xs font-medium text-primary-600 flex items-center gap-1 hover:underline">
            View details <ArrowRight size={12} />
          </button>
        </div>
        {loadingSources ? (
          <LoadingState label="Loading lead sources..." />
        ) : sources.length === 0 ? (
          <EmptyState icon={Radio} title="No channel data yet" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((s) => (
              <div key={s.name || s.channel} className="rounded-xl border border-slate-100 p-4">
                <p className="text-sm font-medium text-slate-700">{s.name || s.channel}</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{s.leads ?? s.volume ?? 0}</p>
                <p className="text-xs text-slate-400">leads</p>
                {s.conversionRate != null && <Badge tone="green" className="mt-2">{s.conversionRate}% conversion</Badge>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Recent Marketing Leads</h3>
          <button onClick={() => navigate("/leads")} className="text-xs font-medium text-primary-600 flex items-center gap-1 hover:underline">
            View all leads <ArrowRight size={12} />
          </button>
        </div>
        {leads.length === 0 ? (
          <EmptyState icon={Users} title="No leads yet" />
        ) : (
          <div className="flex flex-col divide-y divide-slate-50">
            {leads.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{l.name}</p>
                  <p className="text-xs text-slate-400 truncate">{l.company}</p>
                </div>
                <Badge>{l.source}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
