import { useMemo, useState } from "react";
import { Plus, Receipt, DollarSign, PieChart, Tag, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, SearchBar, FilterSelect, Button,
  Pagination, EmptyState, useToast, LoadingState, ConfirmDialog
} from "../../components/common";
import KpiCard from "../../components/dashboard/KpiCard";
import ExpenseFormModal from "../../components/finance/ExpenseFormModal";
import { formatCurrency, formatDate } from "../../utils/format";
import usePagination from "../../hooks/usePagination";
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation
} from "../../store/api/apiSlice";

const categories = ["Software", "Marketing", "Operations", "Salary", "Travel", "Other"];

export default function Expenses() {
  const toast = useToast();

  const { data: expensesData, isLoading } = useGetExpensesQuery();
  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const expenses = expensesData?.data ?? expensesData ?? [];

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totals = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const software = expenses.filter((e) => e.category === "Software").reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const operations = expenses.filter((e) => e.category === "Operations" || e.category === "Salary").reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const marketing = expenses.filter((e) => e.category === "Marketing").reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return { totalExpenses, software, operations, marketing };
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const q = search.toLowerCase();
      const matchesSearch = !search ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q));
      const matchesCategory = !categoryFilter || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

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
        subtitle="Track and manage organizational expenditures, software subscriptions, and operational costs"
        action={
          <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Record Expense
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Receipt} title="Total Expenses" value={formatCurrency(totals.totalExpenses)} tone="red" />
        <KpiCard icon={DollarSign} title="Software & Cloud" value={formatCurrency(totals.software)} tone="primary" />
        <KpiCard icon={PieChart} title="Operations & Staff" value={formatCurrency(totals.operations)} tone="amber" />
        <KpiCard icon={Tag} title="Marketing & Ads" value={formatCurrency(totals.marketing)} tone="green" />
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
            title="No expenses found"
            description="Record your company's operational or tooling costs to track budget outflows."
            action={
              <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
                Record Expense
              </Button>
            }
          />
        ) : (
          <Table columns={["Expense Title", "Category", "Date", "Amount", "Notes & Reference", "Actions"]}>
            {pageItems.map((e) => (
              <Tr key={e.id || e._id}>
                <Td className="font-bold text-slate-800 dark:text-slate-100">
                  {e.title}
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
              onPageChange={setPage}
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
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete expense "${deleteTarget?.title}"?`}
        confirmText="Delete"
        tone="danger"
      />
    </div>
  );
}
