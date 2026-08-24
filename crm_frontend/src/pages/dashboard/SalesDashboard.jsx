import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Handshake, Trophy, ArrowRight, Sparkles, Plus, PhoneCall, Briefcase,
} from "lucide-react";
import { PipelineChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Avatar, LoadingState, EmptyState } from "../../components/common";
import { ROLE_LABELS } from "../../constants/roles";
import { formatDate } from "../../utils/format";
import { useGetLeadsQuery, useGetClientsQuery, useGetPipelineSummaryQuery } from "../../store/api/apiSlice";

export default function SalesDashboard({ user }) {
  const navigate = useNavigate();
  const { data: leadsData, isLoading: loadingLeads } = useGetLeadsQuery();
  const { data: clientsData, isLoading: loadingClients } = useGetClientsQuery();
  const { data: pipelineData } = useGetPipelineSummaryQuery();

  const leads = leadsData?.data ?? leadsData ?? [];
  const clients = clientsData?.data ?? clientsData ?? [];

  const myLeads = useMemo(() => leads.filter((l) => l.assignedTo === user?.id), [leads, user]);
  const followUps = useMemo(() => leads.filter((l) => l.nextFollowUp && l.nextFollowUp !== "-").slice(0, 6), [leads]);
  const wonThisMonth = leads.filter((l) => l.status === "Won").length;
  const activeDeals = leads.filter((l) => l.status && l.status !== "Won" && l.status !== "Lost").length;

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
              You have {myLeads.length} leads assigned and {followUps.length} follow-ups coming up.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => navigate("/leads")} className="flex items-center gap-2 rounded-xl bg-white text-primary-700 px-3.5 py-2.5 text-sm font-semibold hover:bg-primary-50">
              <Plus size={15} /> Add Lead
            </button>
            <button onClick={() => navigate("/communication")} className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur px-3.5 py-2.5 text-sm font-medium">
              <PhoneCall size={15} /> Log Call
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon={Users} title="Total Leads" value={leads.length} tone="primary" />
        <KpiCard icon={Handshake} title="Active Deals" value={activeDeals} tone="amber" />
        <KpiCard icon={Trophy} title="Won This Month" value={wonThisMonth} tone="green" />
        <KpiCard icon={Briefcase} title="Total Customers" value={clients.length} tone="primary" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5">
        <PipelineChart data={pipelineData} />

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Follow-ups Coming Up</h3>
            <button onClick={() => navigate("/leads")} className="text-xs font-medium text-primary-600 flex items-center gap-1 hover:underline">
              View all leads <ArrowRight size={12} />
            </button>
          </div>
          {loadingLeads ? (
            <LoadingState label="Loading leads..." />
          ) : followUps.length === 0 ? (
            <EmptyState title="No follow-ups scheduled" description="Add a lead and set a follow-up date to see it here." />
          ) : (
            <div className="flex flex-col divide-y divide-slate-50">
              {followUps.map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={l.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{l.name}</p>
                    <p className="text-xs text-slate-400 truncate">{l.company}</p>
                  </div>
                  <Badge tone="amber">{formatDate(l.nextFollowUp)}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">My Assigned Leads</h3>
            <button onClick={() => navigate("/leads")} className="text-xs font-medium text-primary-600 flex items-center gap-1 hover:underline">
              Manage <ArrowRight size={12} />
            </button>
          </div>
          {myLeads.length === 0 ? (
            <EmptyState icon={UserPlus} title="No leads assigned to you yet" />
          ) : (
            <div className="flex flex-col divide-y divide-slate-50">
              {myLeads.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={l.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{l.name}</p>
                    <p className="text-xs text-slate-400 truncate">{l.company}</p>
                  </div>
                  <Badge>{l.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Recent Customers</h3>
            <button onClick={() => navigate("/clients")} className="text-xs font-medium text-primary-600 flex items-center gap-1 hover:underline">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {loadingClients ? (
            <LoadingState label="Loading customers..." />
          ) : clients.length === 0 ? (
            <EmptyState icon={Briefcase} title="No customers yet" />
          ) : (
            <div className="flex flex-col divide-y divide-slate-50">
              {clients.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={c.company || c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{c.company || c.name}</p>
                    <p className="text-xs text-slate-400 truncate">{c.contactName || c.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
