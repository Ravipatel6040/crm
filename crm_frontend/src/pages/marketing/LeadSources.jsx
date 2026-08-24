import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import PageHeader from "../../components/layout/PageHeader";
import { Card, CardHeader, Badge, ProgressBar } from "../../components/common";
import { leads, leadSources } from "../../services/mockData";

const PALETTE = ["#3a56b0", "#6480cf", "#8fa2dc", "#293e85", "#b7c3e9", "#192551", "#21326b"];

export default function LeadSourcesPage() {
  const data = leadSources.map((s, i) => {
    const sourceLeads = leads.filter((l) => l.source === s);
    const won = sourceLeads.filter((l) => l.status === "Won").length;
    return {
      name: s,
      total: sourceLeads.length,
      won,
      conversion: sourceLeads.length ? ((won / sourceLeads.length) * 100).toFixed(0) : 0,
      color: PALETTE[i % PALETTE.length],
    };
  });

  return (
    <div>
      <PageHeader title="Lead Sources" subtitle="Which channels are driving the most qualified leads" />

      <Card className="mb-6">
        <CardHeader title="Leads by Source" subtitle="Total volume per acquisition channel" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef1fa" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={0} angle={-20} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-popover text-xs">
                      <p className="font-semibold text-slate-700 mb-1">{label}</p>
                      <p className="text-primary-600 font-medium">Leads: {payload[0].value}</p>
                    </div>
                  ) : null
                }
                cursor={{ fill: "#f1f4fc" }}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((d) => (
          <Card key={d.name} padding="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <p className="text-sm font-semibold text-slate-700">{d.name}</p>
              </div>
              <Badge tone="green">{d.conversion}% won</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-800 mb-2">{d.total}</p>
            <ProgressBar value={Number(d.conversion)} tone="green" />
            <p className="text-xs text-slate-400 mt-2">{d.won} won out of {d.total} leads</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
