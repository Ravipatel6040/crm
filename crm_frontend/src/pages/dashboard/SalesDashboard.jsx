import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  Users, Trophy, PhoneCall, Handshake, Target, ArrowRight, Sparkles, Plus, Clock, FileText, CheckCircle2, XCircle, TrendingUp
} from "lucide-react";
import { PipelineChart, LeadSourceChart, RevenueChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Avatar, Button, LoadingState, EmptyState, useToast } from "../../components/common";
import LeadFormModal from "../../components/leads/LeadFormModal";
import { ROLE_LABELS } from "../../constants/roles";
import { formatCompactCurrency, formatDate } from "../../utils/format";
import {
  useGetSalesDashboardSummaryQuery, useGetRevenueOverviewQuery, useGetLeadSourcesSummaryQuery,
  useCreateLeadMutation, useGetUsersQuery
} from "../../store/api/apiSlice";

export default function SalesDashboard({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [createLead] = useCreateLeadMutation();
  const { data: usersData } = useGetUsersQuery();
  const users = usersData?.data ?? usersData ?? [];

  const { data: summaryWrapper, isLoading: loadingSummary } = useGetSalesDashboardSummaryQuery();
  const { data: revenueWrapper } = useGetRevenueOverviewQuery(); // Mock monthly sales
  const { data: leadSourceWrapper } = useGetLeadSourcesSummaryQuery();

  const summary = summaryWrapper?.data || summaryWrapper || {};
  const leads = summary.leads || {};
  const revenue = summary.revenue || 0;
  const followUps = summary.followUps || [];
  
  const revenueData = revenueWrapper?.data ?? revenueWrapper ?? [];
  const leadSourceData = leadSourceWrapper?.data ?? leadSourceWrapper ?? [];

  const handleSaveLead = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        source: formData.source || "Website",
        budget: Number(formData.budget) || 0,
        assignedTo: formData.assignedTo || user?.id || user?._id,
        status: formData.status || "New",
        interestedIn: formData.interestedIn,
        nextFollowUp: formData.nextFollowUp || undefined,
        notes: formData.notes,
      };
      await createLead(payload).unwrap();
      toast?.push("Lead added successfully");
      setIsAddLeadOpen(false);
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving lead", "error");
    }
  };
  
  const pipelineSteps = [
    { name: "New", status: "upcoming" },
    { name: "Contacted", status: "upcoming" },
    { name: "Qualified", status: "upcoming" },
    { name: "Follow-up", status: "upcoming" },
    { name: "Proposal", status: "upcoming" },
    { name: "Negotiation", status: "upcoming" },
    { name: "Won / Lost", status: "upcoming" }
  ];

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
              Good to see you, {user?.name ? user.name.split(" ")[0] : (user?.email ? user.email.split("@")[0] : "there")}.
            </h1>
            <p className="text-primary-100 text-sm mt-1.5 max-w-md">
              You have {leads.total || 0} leads assigned and {followUps.length} follow-ups scheduled for today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-white text-primary-700 px-3.5 py-2.5 text-sm font-semibold hover:bg-primary-50 transition-colors shadow-sm"
            >
              <Plus size={15} /> Add Lead
            </button>
            <button onClick={() => navigate("/communication")} className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur px-3.5 py-2.5 text-sm font-medium transition-colors">
              <PhoneCall size={15} /> Log Call
            </button>
          </div>
        </div>
      </div>

      {loadingSummary ? (
        <LoadingState label="Loading your sales data..." />
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="My Leads" value={leads.total || 0} tone="primary" />
            <KpiCard title="Follow-ups" value={leads.followUp || 0} tone="amber" />
            <KpiCard title="Proposals" value={leads.proposal || 0} tone="primary" />
            <KpiCard title="Won Deals" value={leads.won || 0} tone="green" />
            <KpiCard title="Lost Deals" value={leads.lost || 0} tone="red" />
            <KpiCard title="Revenue" value={formatCompactCurrency(revenue)} tone="green" />
          </div>

          {/* Lead Pipeline */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800">Lead Pipeline</h2>
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 overflow-x-auto">
                {pipelineSteps.map((step, idx) => (
                  <div key={step.name} className="flex items-center gap-2 flex-1 min-w-[100px]">
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs border-2 border-transparent">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold text-slate-600 text-center">{step.name}</span>
                    </div>
                    {idx < pipelineSteps.length - 1 && (
                      <ArrowRight className="text-slate-300 mx-auto hidden sm:block shrink-0" size={16} />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="flex flex-col gap-6">
              {/* Sales Analytics */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Sales Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LeadSourceChart data={leadSourceData} />
                  <RevenueChart data={revenueData} />
                </div>
              </section>
            </div>

            {/* Today's Follow-ups */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Today's Follow-ups</h2>
              </div>
              <Card className="h-full max-h-[600px] overflow-y-auto">
                {followUps.length === 0 ? (
                  <EmptyState icon={Clock} title="No follow-ups today" description="Take a breather, you're all caught up!" />
                ) : (
                  <div className="flex flex-col gap-4">
                    {followUps.map((f, idx) => {
                      const time = new Date(f.nextFollowUp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={idx} className="flex gap-3 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                          <div className="text-xs font-bold text-slate-400 w-16 pt-1 shrink-0">
                            {time}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{f.name}</p>
                            <p className="text-xs text-slate-500 mb-1.5">{f.company}</p>
                            <Badge tone="primary">Follow-up</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </section>
          </div>
        </>
      )}

      <LeadFormModal
        open={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSave={handleSaveLead}
        users={users}
      />
    </div>
  );
}
