import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import PageHeader from "../../components/layout/PageHeader";
import { Card, CardHeader } from "../../components/common";
import KpiCard from "../../components/dashboard/KpiCard";
import { campaigns } from "../../services/mockData";
import { formatCurrency } from "../../utils/format";
import { Megaphone, MousePointerClick, Percent, TrendingUp } from "lucide-react";

const trend = [
  { month: "Mar", leads: 180, spend: 62000 },
  { month: "Apr", leads: 210, spend: 71000 },
  { month: "May", leads: 260, spend: 84000 },
  { month: "Jun", leads: 305, spend: 98000 },
  { month: "Jul", leads: 340, spend: 112000 },
  { month: "Aug", leads: 380, spend: 130000 },
];

export default function MarketingAnalytics() {
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const cpl = totalLeads ? Math.round(totalSpend / totalLeads) : 0;
  const roi = totalSpend ? (((totalRevenue - totalSpend) / totalSpend) * 100).toFixed(0) : 0;

  const radarData = campaigns.map((c) => ({
    platform: c.platform,
    score: Math.min(100, Math.round((c.won / (c.leads || 1)) * 500)),
  }));

  return (
    <div>
      <PageHeader title="Marketing Analytics" subtitle="Cross-campaign performance and channel ROI" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Megaphone} title="Total Spend" value={formatCurrency(totalSpend)} tone="amber" />
        <KpiCard icon={MousePointerClick} title="Total Leads" value={totalLeads} tone="primary" />
        <KpiCard icon={Percent} title="Cost per Lead" value={formatCurrency(cpl)} tone="green" />
        <KpiCard icon={TrendingUp} title="Overall ROI" value={`${roi}%`} tone="primary" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Leads & Spend Trend" subtitle="Last 6 months" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -14, right: 8 }}>
                <CartesianGrid vertical={false} stroke="#eef1fa" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="#3a56b0" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="spend" name="Spend (₹)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Channel Effectiveness" subtitle="Relative win-rate score" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#eef1fa" />
                <PolarAngleAxis dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: "#cbd5e1" }} />
                <Radar dataKey="score" stroke="#3a56b0" fill="#3a56b0" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
