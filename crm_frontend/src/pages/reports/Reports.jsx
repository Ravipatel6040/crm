import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer
} from "recharts";
import PageHeader from "../../components/layout/PageHeader";
import { Card, Badge, Table, Tr, Td } from "../../components/common";
import KpiCard from "../../components/dashboard/KpiCard";
import {
  useGetLeadsQuery,
  useGetCampaignsQuery,
} from "../../store/api/apiSlice";
import {
  leads as mockLeads,
  campaigns as mockCampaigns, leadSources,
} from "../../services/mockData";
import { formatCurrency } from "../../utils/format";
import { Target, TrendingUp, Megaphone, Percent } from "lucide-react";

const PALETTE = ["#3a56b0", "#6480cf", "#8fa2dc", "#293e85", "#b7c3e9", "#192551", "#21326b"];

export default function Reports() {
  // RTK Query live data
  const { data: leadsData } = useGetLeadsQuery();
  const { data: campaignsData } = useGetCampaignsQuery();

  const leads = (Array.isArray(leadsData?.data) ? leadsData.data : Array.isArray(leadsData) ? leadsData : mockLeads) || [];
  const campaigns = (Array.isArray(campaignsData?.data) ? campaignsData.data : Array.isArray(campaignsData) ? campaignsData : mockCampaigns) || [];

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
        subtitle="Consolidated performance across marketing campaigns and channels"
      />

      <Card padding="p-0" className="mb-6">
        <div className="p-5">
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
        </div>
      </Card>
    </div>
  );
}
