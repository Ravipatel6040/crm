import { useNavigate } from "react-router-dom";
import {
  DollarSign, Receipt, CreditCard, Wallet, TrendingUp, AlertCircle, FileText, Send, CheckCircle2, Search, Plus, PieChart, Clock
} from "lucide-react";
import { RevenueChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Button, LoadingState, Badge } from "../../components/common";
import { ROLE_LABELS } from "../../constants/roles";
import { formatCurrency, formatCompactCurrency } from "../../utils/format";
import {
  useGetFinanceDashboardSummaryQuery, useGetRevenueOverviewQuery
} from "../../store/api/apiSlice";

export default function FinanceDashboard({ user }) {
  const navigate = useNavigate();
  const { data: summaryWrapper, isLoading } = useGetFinanceDashboardSummaryQuery();
  const { data: revenueWrapper } = useGetRevenueOverviewQuery(); // Monthly breakdown chart

  const summary = summaryWrapper?.data || summaryWrapper || {};
  const kpis = summary.kpis || { totalRevenue: 0, received: 0, pending: 0, overdue: 0, totalExpenses: 0, netRevenue: 0 };
  const revenueData = revenueWrapper?.data || [];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-primary-500 px-6 sm:px-8 py-7 text-white shadow-lg">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 rounded-full px-3 py-1 mb-3 backdrop-blur-sm shadow-sm border border-white/20">
              <DollarSign size={12} /> {ROLE_LABELS[user?.role] || "Finance"} workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
              Financial Overview
            </h1>
            <p className="text-primary-100 text-sm mt-2 max-w-md font-medium">
              You have {formatCurrency(kpis.pending)} in pending invoices to collect and {formatCurrency(kpis.overdue)} overdue.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button onClick={() => navigate("/payments")} className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-400 px-4 py-2.5 text-sm font-bold shadow-md hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors">
              <Plus size={16} /> New Invoice
            </button>
            <button onClick={() => navigate("/expenses")} className="flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur px-4 py-2.5 text-sm font-semibold transition-colors">
              <Receipt size={16} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Calculating financials..." />
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Total Revenue" value={formatCompactCurrency(kpis.totalRevenue)} tone="primary" />
            <KpiCard title="Received" value={formatCompactCurrency(kpis.received)} tone="green" />
            <KpiCard title="Pending" value={formatCompactCurrency(kpis.pending)} tone="amber" />
            <KpiCard title="Expenses" value={formatCompactCurrency(kpis.totalExpenses)} tone="red" />
            <KpiCard title="Overdue Invoices" value={formatCompactCurrency(kpis.overdue)} tone="red" />
            <KpiCard title="Net Revenue" value={formatCompactCurrency(kpis.netRevenue)} tone="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="flex flex-col gap-6">
              
              {/* Payment Status Visualizer */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Payment Status Overview</h2>
                <Card className="p-6">
                  <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    <div className="flex-1 p-4 sm:p-2 sm:pr-6 flex flex-col items-center justify-center text-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Paid</p>
                      <p className="text-2xl font-black text-slate-800">{formatCurrency(kpis.received)}</p>
                    </div>
                    <div className="flex-1 p-4 sm:p-2 sm:px-6 flex flex-col items-center justify-center text-center">
                      <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                        <Clock size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pending</p>
                      <p className="text-2xl font-black text-slate-800">{formatCurrency(kpis.pending)}</p>
                    </div>
                    <div className="flex-1 p-4 sm:p-2 sm:pl-6 flex flex-col items-center justify-center text-center">
                      <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                        <AlertCircle size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Overdue</p>
                      <p className="text-2xl font-black text-slate-800">{formatCurrency(kpis.overdue)}</p>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Monthly Revenue Chart */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Monthly Revenue Trend</h2>
                <div className="h-80">
                  <RevenueChart data={revenueData} />
                </div>
              </section>

            </div>

            {/* Quick Actions Sidebar */}
            <div className="flex flex-col gap-6">
              
              {/* Invoice Management Grid */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Invoice Actions</h2>
                <Card className="p-2">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <button onClick={() => navigate("/payments")} className="flex flex-col gap-2 items-center justify-center p-4 rounded-xl hover:bg-slate-50 transition-colors">
                      <FileText className="text-blue-500" size={24}/>
                      <span className="text-xs font-semibold text-slate-700">Create Invoice</span>
                    </button>
                    <button onClick={() => navigate("/payments")} className="flex flex-col gap-2 items-center justify-center p-4 rounded-xl hover:bg-slate-50 transition-colors">
                      <Send className="text-amber-500" size={24}/>
                      <span className="text-xs font-semibold text-slate-700">Send Invoice</span>
                    </button>
                    <button onClick={() => navigate("/payments")} className="flex flex-col gap-2 items-center justify-center p-4 rounded-xl hover:bg-slate-50 transition-colors">
                      <CheckCircle2 className="text-emerald-500" size={24}/>
                      <span className="text-xs font-semibold text-slate-700">Mark Received</span>
                    </button>
                    <button onClick={() => navigate("/payments")} className="flex flex-col gap-2 items-center justify-center p-4 rounded-xl hover:bg-slate-50 transition-colors">
                      <Search className="text-slate-500" size={24}/>
                      <span className="text-xs font-semibold text-slate-700">Track Pending</span>
                    </button>
                  </div>
                </Card>
              </section>

              {/* Expense Management Grid */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Expense Actions</h2>
                <Card className="p-2 border-dashed border-2 bg-slate-50">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <button onClick={() => navigate("/expenses")} className="flex flex-col gap-2 items-center justify-center p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all">
                      <Receipt className="text-red-500" size={24}/>
                      <span className="text-xs font-semibold text-slate-700">Add Expense</span>
                    </button>
                    <button onClick={() => navigate("/expenses")} className="flex flex-col gap-2 items-center justify-center p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all">
                      <CreditCard className="text-purple-500" size={24}/>
                      <span className="text-xs font-semibold text-slate-700">Categorize</span>
                    </button>
                    <button onClick={() => navigate("/expenses")} className="flex flex-col gap-2 items-center justify-center p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all">
                      <Wallet className="text-orange-500" size={24}/>
                      <span className="text-xs font-semibold text-slate-700">Add Receipt</span>
                    </button>
                    <button onClick={() => navigate("/reports")} className="flex flex-col gap-2 items-center justify-center p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all">
                      <PieChart className="text-primary-500" size={24}/>
                      <span className="text-xs font-semibold text-slate-700">Expense Report</span>
                    </button>
                  </div>
                </Card>
              </section>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
