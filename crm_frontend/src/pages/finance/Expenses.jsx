import { useMemo, useState } from "react";
import { Plus, Receipt, CalendarDays, ListOrdered, Tag, Pencil, Trash2, LayoutGrid } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, SearchBar, FilterSelect, Button,
  Pagination, EmptyState, useToast, LoadingState, ConfirmDialog, ProgressBar
} from "../../components/common";
import KpiCard from "../../components/dashboard/KpiCard";
import ExpenseFormModal from "../../components/finance/ExpenseFormModal";
import { formatCurrency, formatDate, classNames } from "../../utils/format";
import { FALLBACK_DEPARTMENTS, UNASSIGNED, departmentMeta } from "../../utils/expenseDepartments";
import usePagination from "../../hooks/usePagination";
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetAppSettingsQuery,
} from "../../store/api/apiSlice";

// Used only until Settings finishes loading — must match Settings.model.js's
// DEFAULT_OPTIONS on the backend.
const FALLBACK_CATEGORIES = ["Marketing", "Operations", "Salary", "Software", "Travel", "Other"];

export default function Expenses() {
  const toast = useToast();

  const { data: expensesData, isLoading } = useGetExpensesQuery();
  const { data: settingsData } = useGetAppSettingsQuery();
  const settings = settingsData?.data ?? settingsData ?? {};
  const categories = settings.options?.expenseCategories?.length ? settings.options.expenseCategories : FALLBACK_CATEGORIES;
  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const expenses = useMemo(() => expensesData?.data ?? expensesData ?? [], [expensesData]);
  const configured = settings.options?.expenseDepartments?.length ? settings.options.expenseDepartments : FALLBACK_DEPARTMENTS;

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(""); // "" = every department
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const amountOf = (e) => Number(e.amount) || 0;
  const deptOf = (e) => e.department || UNASSIGNED;

  // One card per department. A department that was removed from Settings but
  // still has spending on it keeps its card, and "Unassigned" (expenses that
  // predate departments) appears only while some exist.
  const departments = useMemo(() => {
    const byName = new Map();
    const add = (name) => byName.has(name) || byName.set(name, { name, total: 0, count: 0 });
    configured.forEach(add);
    expenses.forEach((e) => add(deptOf(e)));
    expenses.forEach((e) => {
      const d = byName.get(deptOf(e));
      d.total += amountOf(e);
      d.count += 1;
    });
    const grand = expenses.reduce((sum, e) => sum + amountOf(e), 0);
    return [...byName.values()]
      .filter((d) => d.name !== UNASSIGNED || d.count > 0)
      .map((d) => ({ ...d, share: grand ? Math.round((d.total / grand) * 100) : 0 }));
  }, [expenses, configured]);

  const grandTotal = useMemo(() => expenses.reduce((sum, e) => sum + amountOf(e), 0), [expenses]);

  // Everything below (KPIs, table) follows the selected department.
  const scoped = useMemo(
    () => (deptFilter ? expenses.filter((e) => deptOf(e) === deptFilter) : expenses),
    [expenses, deptFilter]
  );

  const totals = useMemo(() => {
    const now = new Date();
    const total = scoped.reduce((sum, e) => sum + amountOf(e), 0);
    const thisMonth = scoped
      .filter((e) => {
        const d = new Date(e.date || e.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, e) => sum + amountOf(e), 0);
    const byCategory = new Map();
    scoped.forEach((e) => byCategory.set(e.category || "Other", (byCategory.get(e.category || "Other") || 0) + amountOf(e)));
    const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    return { total, thisMonth, count: scoped.length, topCategory: top ? top[0] : "—", topAmount: top ? top[1] : 0 };
  }, [scoped]);

  const filtered = useMemo(() => {
    return scoped.filter((e) => {
      const q = search.toLowerCase();
      const matchesSearch = !search ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q));
      const matchesCategory = !categoryFilter || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [scoped, search, categoryFilter]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 8);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await updateExpense({ id: payload.id || editing.id, ...payload }).unwrap();
        toast?.push("Expense updated successfully", "success");
      } else {
        await createExpense(payload).unwrap();
        toast?.push("Expense recorded successfully", "success");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving expense", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteExpense(deleteTarget.id || deleteTarget._id).unwrap();
      toast?.push("Expense deleted successfully", "info");
      setDeleteTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error deleting expense", "error");
    }
  };

  const scopeLabel = deptFilter || "All departments";

  const getCategoryTone = (cat) => {
    switch (cat) {
      case "Software": return "blue";
      case "Marketing": return "amber";
      case "Salary": return "green";
      case "Operations": return "primary";
      case "Travel": return "purple";
      default: return "slate";
    }
  };

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Spending by department — development, marketing, sales, finance, day-to-day office and administration"
        action={
          <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Record Expense
          </Button>
        }
      />

      {/* Spending by department — click one to focus the page on it */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setDeptFilter("")}
          className={classNames(
            "outline-box text-left rounded-xl border p-4 transition-all bg-white dark:bg-slate-800",
            !deptFilter
              ? "border-primary-500 ring-2 ring-primary-500/25 dark:border-primary-400"
              : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-slate-600"
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
              <LayoutGrid size={16} />
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">All departments</span>
          </div>
          <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(grandTotal)}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{expenses.length} expense{expenses.length === 1 ? "" : "s"}</p>
        </button>

        {departments.map((d) => {
          const m = departmentMeta(d.name);
          const active = deptFilter === d.name;
          return (
            <button
              key={d.name}
              onClick={() => setDeptFilter(active ? "" : d.name)}
              className={classNames(
                "outline-box text-left rounded-xl border p-4 transition-all bg-white dark:bg-slate-800",
                active
                  ? "border-primary-500 ring-2 ring-primary-500/25 dark:border-primary-400"
                  : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-slate-600"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={classNames("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", m.icon)}>
                  <m.Icon size={16} />
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{d.name}</span>
              </div>
              <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(d.total)}</p>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>{d.count} expense{d.count === 1 ? "" : "s"}</span>
                <span className="tabular-nums">{d.share}%</span>
              </div>
              <ProgressBar value={d.share} className="mt-1.5 !h-1.5" />
            </button>
          );
        })}
      </div>

      {/* KPI Cards — for the selected department */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Receipt} title={`Total · ${scopeLabel}`} value={formatCurrency(totals.total)} tone="red" />
        <KpiCard icon={CalendarDays} title="This month" value={formatCurrency(totals.thisMonth)} tone="amber" />
        <KpiCard icon={ListOrdered} title="Entries" value={totals.count} tone="primary" />
        <KpiCard icon={Tag} title="Top category" value={totals.topCategory} description={totals.count ? formatCurrency(totals.topAmount) : undefined} tone="green" />
      </div>

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by expense title or notes..."
            className="flex-1"
          />
          <FilterSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categories}
            label="All Categories"
          />
        </div>

        {isLoading ? (
          <LoadingState label="Loading expenses..." />
        ) : pageItems.length === 0 ? (
          <EmptyState
            title={expenses.length === 0 ? "No expenses found" : `No expenses in ${scopeLabel.toLowerCase()}`}
            description={
              expenses.length === 0
                ? "Record your company's operational or tooling costs to track budget outflows."
                : "Try a different search or category, or pick another department."
            }
            action={
              <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
                Record Expense
              </Button>
            }
          />
        ) : (
          <Table columns={["Expense Title", "Department", "Category", "Date", "Amount", "Notes & Reference", "Actions"]}>
            {pageItems.map((e) => (
              <Tr key={e.id || e._id}>
                <Td className="font-bold text-slate-800 dark:text-slate-100">
                  {e.title}
                </Td>
                <Td>
                  <Badge tone={departmentMeta(deptOf(e)).badge}>{deptOf(e)}</Badge>
                </Td>
                <Td>
                  <Badge tone={getCategoryTone(e.category)}>
                    {e.category || "Other"}
                  </Badge>
                </Td>
                <Td className="text-xs text-slate-500">
                  {formatDate(e.date || e.createdAt)}
                </Td>
                <Td className="font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(e.amount || 0)}
                </Td>
                <Td className="text-xs text-slate-500 max-w-[200px] truncate">
                  {e.notes || "—"}
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditing(e); setFormOpen(true); }}
                      className="p-1.5 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Expense"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(e)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete Expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        {totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              pageSize={pageSize}
              totalItems={totalItems}
            />
          </div>
        )}
      </Card>

      {/* Expense Modal */}
      <ExpenseFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        defaultDepartment={deptFilter === UNASSIGNED ? "" : deptFilter}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        description={`Are you sure you want to delete expense "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
