import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, AlertCircle, Sparkles, FileText, ArrowRight, Receipt } from "lucide-react";
import { RevenueChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, ProgressBar, LoadingState, EmptyState } from "../../components/common";
import { ROLE_LABELS } from "../../constants/roles";
import { formatCompactCurrency, formatDate } from "../../utils/format";
import { useGetPaymentsQuery, useGetPaymentsSummaryQuery, useGetRevenueOverviewQuery } from "../../store/api/apiSlice";

export default function FinanceDashboard({ user }) {
  const navigate = useNavigate();
  const { data: paymentsData, isLoading: loadingPayments } = useGetPaymentsQuery();
  const { data: summary, isLoading: loadingSummary } = useGetPaymentsSummaryQuery();
  const { data: revenueData } = useGetRevenueOverviewQuery();

  const payments = paymentsData?.data ?? paymentsData ?? [];
  const s = summary || {};
  const totalRevenue = s.totalRevenue ?? payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = s.paid ?? payments.reduce((sum, p) => sum + (p.paid || 0), 0);
  const totalPending = s.pending ?? payments.reduce((sum, p) => sum + (p.pending || 0), 0);
  const overdue = payments.filter((p) => p.status === "Overdue");
  const collectionRate = totalRevenue ? Math.round((totalPaid / totalRevenue) * 100) : 0;

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
              {formatCompactCurrency(totalPending)} pending across {overdue.length} overdue invoice{overdue.length === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => navigate("/payments")} className="flex items-center gap-2 rounded-xl bg-white text-primary-700 px-3.5 py-2.5 text-sm font-semibold hover:bg-primary-50">
              <FileText size={15} /> New Invoice
            </button>
          </div>
        </div>
      </div>

      {loadingSummary ? (
        <LoadingState label="Loading financial summary..." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard icon={Wallet} title="Total Revenue" value={formatCompactCurrency(totalRevenue)} tone="primary" />
          <KpiCard icon={TrendingUp} title="Collected" value={formatCompactCurrency(totalPaid)} tone="green" />
          <KpiCard icon={Receipt} title="Pending" value={formatCompactCurrency(totalPending)} tone="amber" />
          <KpiCard icon={AlertCircle} title="Overdue Invoices" value={overdue.length} tone="red" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <RevenueChart data={revenueData} />

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Collection Rate</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{collectionRate}%</p>
          <p className="text-xs text-slate-400 mb-3">of total revenue collected</p>
          <ProgressBar value={collectionRate} tone="green" />

          <div className="mt-5 pt-4 border-t border-slate-50 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Collected</p>
              <p className="font-semibold text-emerald-600">{formatCompactCurrency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Outstanding</p>
              <p className="font-semibold text-amber-600">{formatCompactCurrency(totalPending)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Overdue Invoices</h3>
          <button onClick={() => navigate("/payments")} className="text-xs font-medium text-primary-600 flex items-center gap-1 hover:underline">
            View all payments <ArrowRight size={12} />
          </button>
        </div>
        {loadingPayments ? (
          <LoadingState label="Loading payments..." />
        ) : overdue.length === 0 ? (
          <EmptyState icon={Receipt} title="Nothing overdue" description="All invoices are within their payment terms." />
        ) : (
          <div className="flex flex-col divide-y divide-slate-50">
            {overdue.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{p.client || p.clientName || p.id}</p>
                  <p className="text-xs text-slate-400">Due {formatDate(p.dueDate)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-red-600">{formatCompactCurrency(p.pending ?? p.amount)}</span>
                  <Badge tone="red">Overdue</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
