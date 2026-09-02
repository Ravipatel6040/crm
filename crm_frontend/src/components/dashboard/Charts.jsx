import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend, AreaChart, Area,
} from "recharts";
import { Card, CardHeader } from "../common";
import { formatCompactCurrency } from "../../utils/format";

const PALETTE = ["#3a56b0", "#6480cf", "#8fa2dc", "#b7c3e9", "#293e85", "#192551", "#21326b"];

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-popover text-xs">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.value > 1000 ? formatCompactCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/**
 * LeadSourceChart — data: [{ name: "Website", value: 12 }, ...]
 * Pulled from useGetLeadSourcesSummaryQuery() by the caller (previously
 * hard-coded from mockData); this component only renders what it's given.
 */
export function LeadSourceChart({ data = [], title = "Lead Sources", subtitle = "Distribution by acquisition channel" }) {
  const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const chartData = raw.map((d) => ({
    name: String(d.name || d._id || "Other"),
    value: Number(d.value ?? d.count ?? 0),
  })).filter((d) => d.value > 0);

  // If no items have value > 0, fallback to raw mapping if exists
  const displayData = chartData.length > 0 ? chartData : raw.map((d) => ({
    name: String(d.name || d._id || "Other"),
    value: Number(d.value ?? d.count ?? 0),
  }));

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {displayData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate-400">No lead source data yet</div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={displayData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {displayData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipCard />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {displayData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="truncate">{d.name}</span>
                <span className="ml-auto font-medium text-slate-700 dark:text-slate-200">{d.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

/**
 * PipelineChart — data: [{ stage: "New", count: 8 }, ...]
 * Pulled from useGetPipelineSummaryQuery().
 */
export function PipelineChart({ data = [], title = "Sales Pipeline", subtitle = "Deals across each stage" }) {
  const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const chartData = raw.map((d) => ({
    stage: String(d.stage || d.name || "N/A"),
    count: Number(d.count ?? d.value ?? 0),
  }));

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate-400">No pipeline data yet</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef1fa" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={0} angle={-25} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip content={<TooltipCard />} cursor={{ fill: "#f1f4fc" }} />
              <Bar dataKey="count" name="Deals" fill="#3a56b0" radius={[6, 6, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

/**
 * RevenueChart — data: [{ month: "Jan", paid: 120000, pending: 20000 }, ...]
 * Pulled from useGetRevenueOverviewQuery().
 */
export function RevenueChart({ data = [], title = "Revenue Overview", subtitle = "Monthly revenue, paid vs pending" }) {
  const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const chartData = raw.map((d) => ({
    month: String(d.month || d.name || "N/A"),
    paid: Number(d.paid ?? d.revenue ?? d.received ?? 0),
    pending: Number(d.pending ?? d.pendingAmount ?? d.expenses ?? 0),
  }));

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {chartData.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-sm text-slate-400">No revenue data yet</div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -14, right: 8 }}>
              <defs>
                <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3a56b0" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3a56b0" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#eef1fa" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => formatCompactCurrency(v)} />
              <Tooltip content={<TooltipCard />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="paid" name="Paid" stroke="#3a56b0" fill="url(#paidGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fill="url(#pendingGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
