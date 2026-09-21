import { useMemo, useState } from "react";
import { Plus, ScrollText, Send, CheckCircle2, Percent, Eye, Pencil, Trash2, Mail } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, Avatar, SearchBar, FilterSelect, Button,
  Pagination, EmptyState, ErrorState, useToast, LoadingState, ConfirmDialog,
} from "../../components/common";
import KpiCard from "../../components/dashboard/KpiCard";
import QuotationFormModal from "../../components/quotations/QuotationFormModal";
import QuotationViewModal from "../../components/quotations/QuotationViewModal";
import SendQuotationModal from "../../components/quotations/SendQuotationModal";
import { formatCurrency, formatDate } from "../../utils/format";
import { QUOTATION_STATUSES, QUOTATION_STATUS_TONE, displayStatus } from "../../utils/quotation";
import usePagination from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";
import {
  useGetQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useGetAppSettingsQuery,
} from "../../store/api/apiSlice";

// Stable identity so useMemo deps don't churn while a query is loading.
const EMPTY = [];

export default function Quotations() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const currentUserId = user?.id || user?._id;

  const { data, isLoading, isError, refetch } = useGetQuotationsQuery();
  const { data: settingsData } = useGetAppSettingsQuery();
  const [createQuotation, { isLoading: creating }] = useCreateQuotationMutation();
  const [updateQuotation, { isLoading: updating }] = useUpdateQuotationMutation();
  const [deleteQuotation] = useDeleteQuotationMutation();

  const quotations = data?.data ?? EMPTY;
  const organization = (settingsData?.data ?? settingsData ?? {}).organization ?? {};

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [senderFilter, setSenderFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Keep the open document in step with the list after a status change.
  const viewing = useMemo(
    () => quotations.find((q) => q.id === viewingId) || null,
    [quotations, viewingId]
  );

  const sending = useMemo(
    () => quotations.find((q) => q.id === sendingId) || null,
    [quotations, sendingId]
  );

  // Editing and deleting are limited to the author (or an admin) — the API
  // enforces this too; this just avoids offering buttons that would be refused.
  const canManage = (q) => isAdmin || q.createdBy?.id === currentUserId;
  const canDelete = (q) => isAdmin || (canManage(q) && q.status === "Draft");

  const senders = useMemo(() => {
    const names = new Set();
    quotations.forEach((q) => {
      const who = q.sentBy?.name || q.createdBy?.name;
      if (who) names.add(who);
    });
    return [...names].sort();
  }, [quotations]);

  const stats = useMemo(() => {
    const sentOut = quotations.filter((q) => q.status !== "Draft");
    const accepted = quotations.filter((q) => q.status === "Accepted");
    const awaiting = quotations.filter((q) => displayStatus(q) === "Sent");
    const sum = (list) => list.reduce((s, q) => s + (q.total || 0), 0);
    return {
      quotedValue: sum(sentOut),
      sentCount: sentOut.length,
      awaitingCount: awaiting.length,
      awaitingValue: sum(awaiting),
      acceptedValue: sum(accepted),
      acceptedCount: accepted.length,
      winRate: sentOut.length ? Math.round((accepted.length / sentOut.length) * 100) : 0,
    };
  }, [quotations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return quotations.filter((q) => {
      const matchesSearch =
        !term ||
        [q.quotationNumber, q.title, q.recipientName, q.recipientCompany]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term));
      const matchesStatus = !statusFilter || displayStatus(q) === statusFilter;
      const who = q.sentBy?.name || q.createdBy?.name;
      const matchesSender = !senderFilter || who === senderFilter;
      return matchesSearch && matchesStatus && matchesSender;
    });
  }, [quotations, search, statusFilter, senderFilter]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 8);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await updateQuotation(payload).unwrap();
        toast?.push("Quotation updated", "success");
      } else {
        await createQuotation(payload).unwrap();
        toast?.push(payload.status === "Sent" ? "Quotation created and marked as sent" : "Draft saved", "success");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Could not save the quotation", "error");
    }
  };

  const handleStatusChange = async (q, next) => {
    try {
      await updateQuotation({ id: q.id, status: next }).unwrap();
      toast?.push(`Marked as ${next}`, "success");
    } catch (err) {
      toast?.push(err?.data?.message || "Could not update the status", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuotation(deleteTarget.id).unwrap();
      toast?.push("Quotation deleted", "info");
      setDeleteTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Could not delete the quotation", "error");
      setDeleteTarget(null);
    }
  };

  const openNew = () => { setEditing(null); setFormOpen(true); };

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Every quotation sent to a client or lead — who sent it, when, and where it stands"
        action={<Button icon={Plus} onClick={openNew}>New Quotation</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={ScrollText} title="Quoted" value={formatCurrency(stats.quotedValue)} description={`${stats.sentCount} sent`} tone="primary" />
        <KpiCard icon={Send} title="Awaiting response" value={stats.awaitingCount} description={formatCurrency(stats.awaitingValue)} tone="amber" />
        <KpiCard icon={CheckCircle2} title="Accepted" value={formatCurrency(stats.acceptedValue)} description={`${stats.acceptedCount} quotation${stats.acceptedCount === 1 ? "" : "s"}`} tone="green" />
        <KpiCard icon={Percent} title="Acceptance rate" value={`${stats.winRate}%`} description="of quotations sent" tone="primary" />
      </div>

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by number, title or recipient..."
            className="flex-1"
          />
          <div className="flex flex-wrap gap-2">
            <FilterSelect value={statusFilter} onChange={setStatusFilter} options={QUOTATION_STATUSES} label="All Statuses" />
            <FilterSelect value={senderFilter} onChange={setSenderFilter} options={senders} label="All Senders" />
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading quotations..." />
        ) : isError ? (
          <ErrorState onRetry={refetch} description="Couldn't load quotations from the server." />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={quotations.length === 0 ? "No quotations yet" : "No quotations match these filters"}
            description={
              quotations.length === 0
                ? "Create your first quotation to start tracking what you've sent to clients."
                : "Try a different search or clear a filter."
            }
            action={quotations.length === 0 ? <Button icon={Plus} onClick={openNew}>New Quotation</Button> : undefined}
          />
        ) : (
          <Table columns={["Quotation", "Sent to", "Amount", "Status", "Sent by", "Valid until", "Actions"]}>
            {pageItems.map((q) => {
              const status = displayStatus(q);
              const sender = q.sentBy || q.createdBy;
              return (
                <Tr key={q.id}>
                  <Td>
                    <button onClick={() => setViewingId(q.id)} className="text-left group">
                      <span className="font-bold text-primary-600 dark:text-primary-400 group-hover:underline block">
                        {q.quotationNumber}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block max-w-[14rem] truncate">{q.title}</span>
                    </button>
                  </Td>
                  <Td>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{q.recipientCompany || q.recipientName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      {q.recipientCompany && q.recipientName ? q.recipientName : ""}
                      <Badge tone={q.recipientType === "Lead" ? "purple" : "slate"}>{q.recipientType}</Badge>
                    </p>
                  </Td>
                  <Td className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(q.total)}</Td>
                  <Td><Badge tone={QUOTATION_STATUS_TONE[status]}>{status}</Badge></Td>
                  <Td>
                    {sender ? (
                      <div className="flex items-center gap-2.5">
                        <Avatar name={sender.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{sender.name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            {q.sentAt ? `Sent ${formatDate(q.sentAt)}` : "Not sent yet"}
                            {q.emails?.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-primary-500" title={`Emailed ${q.emails.length} time${q.emails.length === 1 ? "" : "s"}`}>
                                <Mail size={11} />{q.emails.length}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ) : "—"}
                  </Td>
                  <Td className="text-xs whitespace-nowrap">
                    {q.validUntil ? (
                      <span className={status === "Expired" ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-600 dark:text-slate-300"}>
                        {formatDate(q.validUntil)}
                      </span>
                    ) : "—"}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingId(q.id)}
                        className="p-1.5 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="View quotation"
                      >
                        <Eye size={15} />
                      </button>
                      {canManage(q) && (
                        <button
                          onClick={() => setSendingId(q.id)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title={q.emails?.length ? "Email again" : "Email to client"}
                        >
                          <Mail size={15} />
                        </button>
                      )}
                      {canManage(q) && (
                        <button
                          onClick={() => { setEditing(q); setFormOpen(true); }}
                          className="p-1.5 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit quotation"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {canDelete(q) && (
                        <button
                          onClick={() => setDeleteTarget(q)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete quotation"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </Card>

      <QuotationFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        saving={creating || updating}
      />

      <QuotationViewModal
        quotation={viewing}
        open={!!viewing && !sending}
        onClose={() => setViewingId(null)}
        organization={organization}
        canManage={viewing ? canManage(viewing) : false}
        onStatusChange={handleStatusChange}
        onSend={(q) => setSendingId(q.id)}
        busy={updating}
      />

      <SendQuotationModal
        quotation={sending}
        open={!!sending}
        onClose={() => setSendingId(null)}
        isAdmin={isAdmin}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete quotation?"
        description={`${deleteTarget?.quotationNumber} will be permanently removed.`}
      />
    </div>
  );
}
