import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend, AreaChart, Area,
} from "recharts";
import { Card, CardHeader, EmptyState } from "../common";
import { formatCompactCurrency } from "../../utils/format";
import { useTheme } from "../../context/ThemeContext";

const PALETTE = ["#3a56b0", "#6480cf", "#8fa2dc", "#b7c3e9", "#293e85", "#192551", "#21326b"];

/**
 * Recharts renders SVG, so Tailwind's dark: variants can't reach axis ticks,
 * grid lines or cursors — those need real color values per theme.
 */
function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    isDark,
    grid: isDark ? "#1e293b" : "#eef1fa",
    tick: isDark ? "#64748b" : "#94a3b8",
    cursor: isDark ? "rgba(148,163,184,0.08)" : "#f1f4fc",
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#f1f5f9",
    tooltipLabel: isDark ? "#e2e8f0" : "#334155",
  };
}

function TooltipCard({ active, payload, label, chartTheme }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-popover"
      style={{ background: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder }}
    >
      {label && (
        <p className="font-semibold mb-1" style={{ color: chartTheme.tooltipLabel }}>
          {label}
        </p>
      )}
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
 * Pulled from useGetLeadSourcesSummaryQuery() by the caller.
 */
export function LeadSourceChart({ data = [], title = "Lead Sources", subtitle = "Distribution by acquisition channel" }) {
  const chartTheme = useChartTheme();
  const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const displayData = raw
    .map((d) => ({
      name: String(d.name || d._id || "Other"),
      value: Number(d.value ?? d.count ?? 0),
    }))
    .filter((d) => d.value > 0);

  const total = displayData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {displayData.length === 0 ? (
        <EmptyState
          title="No lead source data yet"
          description="Source breakdown appears once leads are added to the pipeline."
        />
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-56 w-full sm:w-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={displayData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none">
                  {displayData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipCard chartTheme={chartTheme} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{total}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">leads</span>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 gap-1.5">
            {displayData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2.5 text-xs">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="truncate text-slate-600 dark:text-slate-400">{d.name}</span>
                <span className="ml-auto font-semibold text-slate-800 dark:text-slate-100">{d.value}</span>
                <span className="w-9 text-right text-slate-400 dark:text-slate-500 tabular-nums">
                  {total ? Math.round((d.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * PipelineChart — data: [{ stage: "New", count: 8 }, ...]
 */
export function PipelineChart({ data = [], title = "Sales Pipeline", subtitle = "Deals across each stage" }) {
  const chartTheme = useChartTheme();
  const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const chartData = raw.map((d) => ({
    stage: String(d.stage || d.name || "N/A"),
    count: Number(d.count ?? d.value ?? 0),
  }));

  const hasValues = chartData.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {!hasValues ? (
        <EmptyState
          title="No pipeline data yet"
          description="Add leads to see how deals are distributed across your stages."
        />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} stroke={chartTheme.grid} />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 10, fill: chartTheme.tick }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={55}
                axisLine={{ stroke: chartTheme.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartTheme.tick }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TooltipCard chartTheme={chartTheme} />} cursor={{ fill: chartTheme.cursor }} />
              <Bar dataKey="count" name="Deals" fill="#3a56b0" radius={[6, 6, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

/**
 * RevenueChart — data: [{ month: "Jan", paid, pending, expenses }, ...]
 */
export function RevenueChart({ data = [], title = "Revenue Overview", subtitle = "Monthly revenue, paid vs pending" }) {
  const chartTheme = useChartTheme();
  const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const chartData = raw.map((d) => ({
    month: String(d.month || d.name || "N/A"),
    paid: Number(d.paid ?? d.revenue ?? d.received ?? 0),
    pending: Number(d.pending ?? d.pendingAmount ?? 0),
  }));

  const hasValues = chartData.some((d) => d.paid > 0 || d.pending > 0);

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {!hasValues ? (
        <EmptyState
          title="No revenue recorded yet"
          description="Once payments are marked Paid or Pending, the last six months appear here."
        />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -14, right: 8 }}>
              <defs>
                <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3a56b0" stopOpacity={chartTheme.isDark ? 0.45 : 0.35} />
                  <stop offset="95%" stopColor="#3a56b0" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={chartTheme.isDark ? 0.4 : 0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={chartTheme.grid} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: chartTheme.tick }}
                axisLine={{ stroke: chartTheme.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: chartTheme.tick }}
                tickFormatter={(v) => formatCompactCurrency(v)}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TooltipCard chartTheme={chartTheme} />} />
              <Legend wrapperStyle={{ fontSize: 12, color: chartTheme.tick }} />
              <Area type="monotone" dataKey="paid" name="Paid" stroke="#3a56b0" fill="url(#paidGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fill="url(#pendingGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
