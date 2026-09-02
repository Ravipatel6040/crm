import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Megaphone, Target, BarChart2, MousePointerClick, 
  ArrowRight, Sparkles, Plus, Play, Pause, Edit, Link, Activity, Radio
} from "lucide-react";
import { LeadSourceChart, RevenueChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Button, LoadingState, EmptyState, useToast } from "../../components/common";
import CampaignFormModal from "../../components/campaigns/CampaignFormModal";
import { ROLE_LABELS } from "../../constants/roles";
import { formatCompactCurrency } from "../../utils/format";
import {
  useGetMarketingDashboardSummaryQuery, useGetRevenueOverviewQuery, useCreateCampaignMutation
} from "../../store/api/apiSlice";

export default function MarketingDashboard({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [createCampaign] = useCreateCampaignMutation();

  const { data: summaryWrapper, isLoading: loadingSummary } = useGetMarketingDashboardSummaryQuery();
  const { data: revenueWrapper } = useGetRevenueOverviewQuery(); // Mock monthly analytics
  
  const summary = summaryWrapper?.data || summaryWrapper || {};
  const kpis = summary.kpis || {};
  const leadSources = summary.leadSources || [];
  const revenueData = revenueWrapper?.data || [];

  const handleSaveCampaign = async (campaignData) => {
    try {
      await createCampaign(campaignData).unwrap();
      toast?.push("Campaign created successfully");
      setIsNewCampaignOpen(false);
    } catch (err) {
      toast?.push(err?.data?.message || "Error creating campaign", "error");
    }
  };

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
              Hello, {user?.name ? user.name.split(" ")[0] : (user?.email ? user.email.split("@")[0] : "there")}.
            </h1>
            <p className="text-primary-100 text-sm mt-1.5 max-w-md">
              You are currently running {kpis.totalCampaigns || 0} active campaigns generating {kpis.leadsGenerated || 0} leads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setIsNewCampaignOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-white text-primary-700 px-3.5 py-2.5 text-sm font-semibold hover:bg-primary-50 transition-colors shadow-sm"
            >
              <Plus size={15} /> New Campaign
            </button>
            <button
              onClick={() => navigate("/marketing/analytics")}
              className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur px-3.5 py-2.5 text-sm font-medium transition-colors"
            >
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
              {/* Marketing Analytics */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Marketing Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LeadSourceChart data={leadSources} />
                  {/* Using Revenue chart as mock Monthly Performance */}
                  <RevenueChart data={revenueData} /> 
                </div>
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

      <CampaignFormModal
        open={isNewCampaignOpen}
        onClose={() => setIsNewCampaignOpen(false)}
        onSave={handleSaveCampaign}
      />
    </div>
  );
}
