import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Wallet, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, SearchBar, FilterSelect, Button,
  Pagination, ActionsMenu, ConfirmDialog, EmptyState, useToast, LoadingState
} from "../../components/common";
import KpiCard from "../../components/dashboard/KpiCard";
import PaymentFormModal from "../../components/payments/PaymentFormModal";
import { paymentStatuses } from "../../services/mockData";
import { formatCurrency, formatDate } from "../../utils/format";
import usePagination from "../../hooks/usePagination";
import {
  useGetPaymentsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useGetProjectsQuery
} from "../../store/api/apiSlice";

export default function Payments() {
  const toast = useToast();
  
  // RTK Query Hooks
  const { data: paymentsData, isLoading } = useGetPaymentsQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const [createPayment] = useCreatePaymentMutation();
  const [updatePayment] = useUpdatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();

  const payments = paymentsData?.data ?? paymentsData ?? [];
  const projects = projectsData?.data ?? projectsData ?? [];

  const projectName = (id) => {
    return projects.find((p) => p.id === id)?.name || id;
  };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totals = useMemo(() => {
    const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalPaid = payments.reduce((s, p) => s + (p.paid || 0), 0);
    const totalPending = payments.reduce((s, p) => s + (p.pending || 0), 0);
    const overdue = payments.filter((p) => p.status === "Overdue").reduce((s, p) => s + (p.pending || 0), 0);
    return { totalRevenue, totalPaid, totalPending, overdue };
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch = !search || 
        (p.client && p.client.toLowerCase().includes(search.toLowerCase())) || 
        (p.id && p.id.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 6);

  const handleSave = async (payment) => {
    try {
      if (editing) {
        await updatePayment({ id: payment.id, ...payment }).unwrap();
        toast?.push("Payment updated successfully");
      } else {
        await createPayment(payment).unwrap();
        toast?.push("Payment recorded successfully");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving payment", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePayment(deleteTarget.id).unwrap();
      toast?.push("Payment record deleted", "info");
      setDeleteTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error deleting payment", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Track invoices, collections and outstanding dues"
        action={<Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>Record Payment</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Wallet} title="Total Revenue" value={formatCurrency(totals.totalRevenue)} tone="primary" />
        <KpiCard icon={CheckCircle2} title="Total Paid" value={formatCurrency(totals.totalPaid)} tone="green" />
        <KpiCard icon={Clock} title="Total Pending" value={formatCurrency(totals.totalPending)} tone="amber" />
        <KpiCard icon={AlertTriangle} title="Overdue" value={formatCurrency(totals.overdue)} tone="red" />
      </div>

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by client or invoice ID..." className="flex-1" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={paymentStatuses} label="All Statuses" />
        </div>

        {isLoading ? (
          <LoadingState label="Loading payments..." />
        ) : pageItems.length === 0 ? (
          <EmptyState title="No payments found" description="Try adjusting your search or filters." />
        ) : (
          <Table columns={["Invoice", "Project", "Client", "Amount", "Paid", "Pending", "Due Date", "Status", "Actions"]}>
            {pageItems.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium text-slate-700">{p.id}</Td>
                <Td>{projectName(p.project)}</Td>
                <Td>{p.client}</Td>
                <Td>{formatCurrency(p.amount)}</Td>
                <Td className="text-emerald-600 font-medium">{formatCurrency(p.paid)}</Td>
                <Td className="text-amber-600 font-medium">{formatCurrency(p.pending)}</Td>
                <Td>{formatDate(p.dueDate)}</Td>
                <Td><Badge>{p.status}</Badge></Td>
                <Td>
                  <ActionsMenu actions={[
                    { label: "Edit Payment", icon: Pencil, onClick: () => { setEditing(p); setModalOpen(true); } },
                    { divider: true },
                    { label: "Delete Record", icon: Trash2, danger: true, onClick: () => setDeleteTarget(p) },
                  ]} />
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </Card>

      <PaymentFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.id}?`}
        description="This invoice record will be permanently removed."
      />
    </div>
  );
}
