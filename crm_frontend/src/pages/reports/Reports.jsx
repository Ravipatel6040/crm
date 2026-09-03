import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import PageHeader from "../../components/layout/PageHeader";
import { Card, CardHeader, Tabs, Badge, Table, Tr, Td } from "../../components/common";
import KpiCard from "../../components/dashboard/KpiCard";
import {
  useGetLeadsQuery,
  useGetProjectsQuery,
  useGetPaymentsQuery,
  useGetCampaignsQuery,
  useGetRevenueOverviewQuery
} from "../../store/api/apiSlice";
import {
  leads as mockLeads, projects as mockProjects, payments as mockPayments,
  campaigns as mockCampaigns, revenueOverview, leadSources,
} from "../../services/mockData";
import { formatCurrency } from "../../utils/format";
import { Target, Trophy, XCircle, TrendingUp, Megaphone, Percent, FolderKanban, CheckCircle2, Clock3, Wallet, AlertTriangle } from "lucide-react";

const TABS = ["Sales", "Marketing", "Projects", "Financial"];
const PALETTE = ["#3a56b0", "#6480cf", "#8fa2dc", "#293e85", "#b7c3e9", "#192551", "#21326b"];

export default function Reports() {
  const [tab, setTab] = useState("Sales");

  // RTK Query live data
  const { data: leadsData } = useGetLeadsQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const { data: paymentsData } = useGetPaymentsQuery();
  const { data: campaignsData } = useGetCampaignsQuery();
  const { data: revenueData } = useGetRevenueOverviewQuery();

  const leads = (Array.isArray(leadsData?.data) ? leadsData.data : Array.isArray(leadsData) ? leadsData : mockLeads) || [];
  const projects = (Array.isArray(projectsData?.data) ? projectsData.data : Array.isArray(projectsData) ? projectsData : mockProjects) || [];
  const payments = (Array.isArray(paymentsData?.data) ? paymentsData.data : Array.isArray(paymentsData) ? paymentsData : mockPayments) || [];
  const campaigns = (Array.isArray(campaignsData?.data) ? campaignsData.data : Array.isArray(campaignsData) ? campaignsData : mockCampaigns) || [];
  const dynamicRevenue = (Array.isArray(revenueData?.data) && revenueData.data.length > 0)
    ? revenueData.data
    : (Array.isArray(revenueData) && revenueData.length > 0)
      ? revenueData
      : revenueOverview;

  const won = leads.filter((l) => l.status === "Won").length;
  const lost = leads.filter((l) => l.status === "Lost").length;
  const conversionRate = leads.length ? ((won / leads.length) * 100).toFixed(1) : 0;
  const revenueFromLeads = leads.filter((l) => l.status === "Won").reduce((s, l) => s + (l.budget || 0), 0);

  const activeProjects = projects.filter((p) => p.status === "In Progress" || p.status === "Active").length;
  const completedProjects = projects.filter((p) => p.status === "Completed").length;
  const delayedProjects = projects.filter((p) => p.status === "On Hold").length;
  const taskCompletion = projects.reduce((s, p) => s + (p.tasks?.done || 0), 0);
  const taskTotal = projects.reduce((s, p) => s + (p.tasks?.total || 1), 0);

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.paid || p.amount || 0), 0);
  const totalPending = payments.reduce((s, p) => s + (p.pending || 0), 0);
  const totalOverdue = payments.filter((p) => p.status === "Overdue").reduce((s, p) => s + (p.pending || 0), 0);

  let sourceData = leadSources
    .map((s) => ({ name: s, value: leads.filter((l) => l.source === s).length }))
    .filter((s) => s.value > 0);
    
  if (sourceData.length === 0) {
    sourceData = [{ name: "No Leads", value: 1 }];
  }

  const campSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
  const campRev = campaigns.reduce((s, c) => s + (c.revenue || 0), 0);
  const campLeads = campaigns.reduce((s, c) => s + (c.leads || 0), 0);
  const campRoi = campSpend > 0 ? Math.round(((campRev - campSpend) / campSpend) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Consolidated performance across sales, marketing, projects and finance"
      />

      <Card padding="p-0" className="mb-6">
        <div className="px-5 pt-2">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        <div className="p-5">
          {tab === "Sales" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard icon={Target} title="Total Leads" value={leads.length} tone="primary" />
                <KpiCard icon={Percent} title="Conversion Rate" value={`${conversionRate}%`} tone="green" />
                <KpiCard icon={Trophy} title="Won Deals" value={won} tone="green" />
                <KpiCard icon={XCircle} title="Lost Deals" value={lost} tone="red" />
              </div>
              <Table columns={["Lead", "Company", "Status", "Budget"]}>
                {leads.slice(0, 6).map((l) => (
                  <Tr key={l.id || l._id}>
                    <Td className="font-medium">{l.name}</Td>
                    <Td>{l.company}</Td>
                    <Td><Badge>{l.status}</Badge></Td>
                    <Td>{formatCurrency(l.budget)}</Td>
                  </Tr>
                ))}
              </Table>
            </>
          )}

          {tab === "Marketing" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard icon={Megaphone} title="Campaign Spend" value={formatCurrency(campSpend)} tone="amber" />
                <KpiCard icon={TrendingUp} title="Revenue Generated" value={formatCurrency(campRev)} tone="green" />
                <KpiCard icon={Target} title="Total Campaign Leads" value={campLeads} tone="primary" />
                <KpiCard icon={Percent} title="Avg ROI" value={`${campRoi}%`} tone="green" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {sourceData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.name === "No Leads" ? "#e2e8f0" : PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <Table columns={["Campaign", "Platform", "Leads", "Revenue"]}>
                  {campaigns.map((c) => (
                    <Tr key={c.id || c._id}>
                      <Td className="font-medium">{c.name}</Td>
                      <Td><Badge tone="slate">{c.platform}</Badge></Td>
                      <Td>{c.leads}</Td>
                      <Td>{formatCurrency(c.revenue)}</Td>
                    </Tr>
                  ))}
                </Table>
              </div>
            </>
          )}

          {tab === "Projects" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard icon={FolderKanban} title="Active Projects" value={activeProjects} tone="primary" />
                <KpiCard icon={CheckCircle2} title="Completed" value={completedProjects} tone="green" />
                <KpiCard icon={Clock3} title="Delayed / On Hold" value={delayedProjects} tone="amber" />
                <KpiCard icon={Percent} title="Task Completion" value={`${taskTotal ? Math.round((taskCompletion / taskTotal) * 100) : 0}%`} tone="primary" />
              </div>
              <Table columns={["Project", "Client", "Status", "Progress"]}>
                {projects.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-medium">{p.name}</Td>
                    <Td>{p.clientName}</Td>
                    <Td><Badge>{p.status}</Badge></Td>
                    <Td>{p.progress}%</Td>
                  </Tr>
                ))}
              </Table>
            </>
          )}

          {tab === "Financial" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard icon={Wallet} title="Total Revenue" value={formatCurrency(totalRevenue)} tone="primary" />
                <KpiCard icon={CheckCircle2} title="Total Paid" value={formatCurrency(totalPaid)} tone="green" />
                <KpiCard icon={Clock3} title="Total Pending" value={formatCurrency(totalPending)} tone="amber" />
                <KpiCard icon={AlertTriangle} title="Overdue" value={formatCurrency(totalOverdue)} tone="red" />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicRevenue} margin={{ left: -14, right: 8 }}>
                    <CartesianGrid vertical={false} stroke="#eef1fa" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="paid" name="Paid" fill="#3a56b0" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
