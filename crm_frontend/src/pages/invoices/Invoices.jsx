import { useMemo, useState } from "react";
import { Plus, FileText, CheckCircle2, Clock, AlertTriangle, Printer, Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, SearchBar, FilterSelect, Button,
  Pagination, EmptyState, useToast, LoadingState, ConfirmDialog
} from "../../components/common";
import KpiCard from "../../components/dashboard/KpiCard";
import InvoiceFormModal from "../../components/finance/InvoiceFormModal";
import InvoiceViewModal from "../../components/finance/InvoiceViewModal";
import { formatCurrency, formatDate } from "../../utils/format";
import usePagination from "../../hooks/usePagination";
import {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation
} from "../../store/api/apiSlice";

const invoiceStatuses = ["Draft", "Sent", "Paid", "Partially Paid", "Overdue"];

export default function Invoices() {
  const toast = useToast();

  const { data: invoicesData, isLoading } = useGetInvoicesQuery();
  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const invoices = invoicesData?.data ?? invoicesData ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totals = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, inv) => s + (inv.total || inv.amount || 0), 0);
    const totalPaid = invoices.reduce((s, inv) => s + (inv.paidAmount || (inv.status === "Paid" ? inv.total || 0 : 0)), 0);
    const totalPending = invoices.filter((inv) => inv.status !== "Paid").reduce((s, inv) => s + (inv.balanceDue ?? (inv.total || 0)), 0);
    const overdue = invoices.filter((inv) => inv.status === "Overdue").reduce((s, inv) => s + (inv.balanceDue ?? (inv.total || 0)), 0);
    return { totalInvoiced, totalPaid, totalPending, overdue };
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const q = search.toLowerCase();
      const matchesSearch = !search ||
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
        (inv.clientName && inv.clientName.toLowerCase().includes(q)) ||
        (inv.projectName && inv.projectName.toLowerCase().includes(q));
      const matchesStatus = !statusFilter || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 8);

  const handleSave = async (invoicePayload) => {
    try {
      if (editing) {
        await updateInvoice({ id: invoicePayload.id || editing.id, ...invoicePayload }).unwrap();
        toast?.push("Invoice updated successfully", "success");
      } else {
        await createInvoice(invoicePayload).unwrap();
        toast?.push("Invoice created successfully", "success");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving invoice", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(deleteTarget.id || deleteTarget._id).unwrap();
      toast?.push("Invoice deleted successfully", "info");
      setDeleteTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error deleting invoice", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Generate, track, and manage client billings, tax invoices, and payment requests"
        action={
          <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Create Invoice
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={FileText} title="Total Invoiced" value={formatCurrency(totals.totalInvoiced)} tone="primary" />
        <KpiCard icon={CheckCircle2} title="Total Paid" value={formatCurrency(totals.totalPaid)} tone="green" />
        <KpiCard icon={Clock} title="Total Pending" value={formatCurrency(totals.totalPending)} tone="amber" />
        <KpiCard icon={AlertTriangle} title="Overdue" value={formatCurrency(totals.overdue)} tone="red" />
      </div>

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by invoice #, client, or project..."
            className="flex-1"
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={invoiceStatuses}
            label="All Statuses"
          />
        </div>

        {isLoading ? (
          <LoadingState label="Loading invoices..." />
        ) : pageItems.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description="Generate your first invoice to start billing clients."
            action={
              <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
                Create Invoice
              </Button>
            }
          />
        ) : (
          <Table columns={["Invoice #", "Client", "Project", "Issue Date", "Due Date", "Amount", "Status", "Actions"]}>
            {pageItems.map((inv) => (
              <Tr key={inv.id || inv._id}>
                <Td className="font-bold text-primary-600 dark:text-primary-400">
                  <button
                    onClick={() => setViewing(inv)}
                    className="hover:underline cursor-pointer flex items-center gap-1 text-left"
                  >
                    {inv.invoiceNumber}
                  </button>
                </Td>
                <Td className="font-semibold text-slate-800 dark:text-slate-100">
                  {inv.clientName || "Direct Client"}
                </Td>
                <Td className="text-slate-500 text-xs">
                  {inv.projectName || "General"}
                </Td>
                <Td className="text-xs text-slate-500">
                  {formatDate(inv.issueDate || inv.createdAt)}
                </Td>
                <Td className="text-xs font-medium">
                  {inv.dueDate ? (
                    <span className={new Date(inv.dueDate) < new Date() && inv.status !== "Paid" ? "text-red-500 font-bold" : "text-slate-600 dark:text-slate-300"}>
                      {formatDate(inv.dueDate)}
                    </span>
                  ) : "—"}
                </Td>
                <Td className="font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(inv.total || inv.amount || 0)}
                </Td>
                <Td>
                  <Badge
                    tone={
                      inv.status === "Paid"
                        ? "green"
                        : inv.status === "Overdue"
                        ? "red"
                        : inv.status === "Partially Paid"
                        ? "blue"
                        : "amber"
                    }
                  >
                    {inv.status || "Sent"}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewing(inv)}
                      className="p-1.5 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="View / Print Invoice"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => { setEditing(inv); setFormOpen(true); }}
                      className="p-1.5 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Invoice"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(inv)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete Invoice"
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

      {/* Form Modal */}
      <InvoiceFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />

      {/* View / Print Modal */}
      <InvoiceViewModal
        invoice={viewing}
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteTarget?.invoiceNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        tone="danger"
      />
    </div>
  );
}
