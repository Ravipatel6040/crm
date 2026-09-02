import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Eye, ChevronDown } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, Avatar, SearchBar, FilterSelect, Button,
  Pagination, ConfirmDialog, EmptyState, useToast, LoadingState
} from "../../components/common";
import LeadFormModal from "../../components/leads/LeadFormModal";
import LeadViewModal from "../../components/leads/LeadViewModal";
import { leadSources, pipelineStages } from "../../services/mockData";
import { formatCurrency, formatDate, classNames } from "../../utils/format";
import usePagination from "../../hooks/usePagination";
import { useAuth } from "../../context/AuthContext";
import {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useGetUsersQuery
} from "../../store/api/apiSlice";

export default function Leads() {
  const toast = useToast();
  const { user } = useAuth();
  const isSales = user?.role === "BD_SALES";
  const [searchParams, setSearchParams] = useSearchParams();
  
  // RTK Query Hooks
  const { data: leadsData, isLoading } = useGetLeadsQuery();
  const { data: usersData } = useGetUsersQuery();
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();

  const leads = leadsData?.data ?? leadsData ?? [];
  const users = usersData?.data ?? usersData ?? [];

  const userName = (id) => {
    return users.find((u) => u.id === id || u._id === id)?.name || "Unassigned";
  };

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
    if (searchParams.get("new") === "true" || searchParams.get("create") === "true") {
      setEditing(null);
      setModalOpen(true);
    }
  }, [searchParams]);

  const [salesTab, setSalesTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (lead, newStatus) => {
    if (lead.status === newStatus) return;
    const targetId = lead.id || lead._id;
    setUpdatingId(targetId);
    try {
      await updateLead({ id: targetId, status: newStatus }).unwrap();
      toast?.push(`Status updated to "${newStatus}"`, "success");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const isAssignedToMe =
        l.assignedTo === user?.id ||
        l.assignedTo === user?._id ||
        l.assignedUser?.id === user?.id ||
        l.assignedUser?.id === user?._id;

      if (isSales && salesTab === "assigned" && !isAssignedToMe) {
        return false;
      }

      const matchesSearch =
        !search ||
        (l.name && l.name.toLowerCase().includes(search.toLowerCase())) ||
        (l.company && l.company.toLowerCase().includes(search.toLowerCase()));
      const matchesSource = !sourceFilter || l.source === sourceFilter;
      const matchesStatus = !statusFilter || l.status === statusFilter;
      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [leads, search, sourceFilter, statusFilter, isSales, salesTab, user]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 6);

  const handleSave = async (lead) => {
    try {
      const payload = { ...lead };
      if (isSales && !payload.assignedTo) {
        payload.assignedTo = user?.id || user?._id;
      }
      if (editing) {
        await updateLead({ id: lead.id || lead._id, ...payload }).unwrap();
        toast?.push("Lead updated successfully");
      } else {
        await createLead(payload).unwrap();
        toast?.push("Lead added successfully");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving lead", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLead(deleteTarget.id || deleteTarget._id).unwrap();
      toast?.push("Lead deleted successfully", "info");
      setDeleteTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error deleting lead", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title={isSales ? "My Leads" : "Leads"}
        subtitle={
          isSales
            ? "Track, manage, and convert leads in your sales pipeline"
            : `${totalItems} total leads in your funnel`
        }
        action={
          <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Add Lead
          </Button>
        }
      />

      <Card padding="p-4 sm:p-5">
        {isSales && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 w-fit">
            <button
              type="button"
              onClick={() => setSalesTab("all")}
              className={classNames(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
                salesTab === "all"
                  ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}
            >
              All Leads ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setSalesTab("assigned")}
              className={classNames(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
                salesTab === "assigned"
                  ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}
            >
              Assigned to Me (
              {
                leads.filter(
                  (l) =>
                    l.assignedTo === user?.id ||
                    l.assignedTo === user?._id ||
                    l.assignedUser?.id === user?.id ||
                    l.assignedUser?.id === user?._id
                ).length
              }
              )
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or company..." className="flex-1" />
          <div className="flex gap-3">
            <FilterSelect value={sourceFilter} onChange={setSourceFilter} options={leadSources} label="All Sources" />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} options={pipelineStages} label="All Statuses" />
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading leads..." />
        ) : pageItems.length === 0 ? (
          <EmptyState title="No leads found" description="Try adjusting your search or filters, or add a new lead." />
        ) : (
          <Table columns={["Lead", "Company", "Source", "Interested In", "Budget", "Assigned To", "Status", "Next Follow-up", "Actions"]}>
            {pageItems.map((l) => (
              <Tr key={l.id || l._id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={l.name} size="sm" />
                    <div>
                      <button
                        onClick={() => setViewing(l)}
                        className="font-medium text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 hover:underline text-left transition-colors"
                      >
                        {l.name}
                      </button>
                      <p className="text-xs text-slate-400">{l.id || l._id}</p>
                    </div>
                  </div>
                </Td>
                <Td className="font-medium text-slate-600 dark:text-slate-300">{l.company}</Td>
                <Td><Badge tone="slate">{l.source}</Badge></Td>
                <Td className="max-w-[160px] truncate">{l.interestedIn || "-"}</Td>
                <Td className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(l.budget)}</Td>
                <Td>{userName(l.assignedTo)}</Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-flex items-center">
                    <select
                      value={l.status || "New"}
                      disabled={updatingId === (l.id || l._id)}
                      onChange={(e) => handleStatusChange(l, e.target.value)}
                      className={classNames(
                        "text-xs font-semibold rounded-full pl-3 pr-6 py-1 cursor-pointer border transition-all appearance-none outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 shadow-sm",
                        l.status === "Won"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                          : l.status === "Lost"
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
                          : l.status === "Follow-up"
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60"
                          : l.status === "Proposal" || l.status === "Negotiation"
                          ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60"
                          : l.status === "Contacted"
                          ? "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60"
                          : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60"
                      )}
                      title="Click to update lead status"
                    >
                      {pipelineStages.map((stage) => (
                        <option
                          key={stage}
                          value={stage}
                          className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium py-1"
                        >
                          {stage}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 pointer-events-none opacity-60 text-current"
                    />
                  </div>
                </Td>
                <Td className="text-slate-500 whitespace-nowrap">{formatDate(l.nextFollowUp)}</Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setViewing(l)}
                      className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:bg-primary-950/50 dark:hover:text-primary-400 rounded-lg transition-colors border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
                      title="View Lead Details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </Card>

      <LeadViewModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        lead={viewing}
        userName={userName}
        onEdit={(lead) => {
          setViewing(null);
          setEditing(lead);
          setModalOpen(true);
        }}
        onDelete={(lead) => {
          setViewing(null);
          setDeleteTarget(lead);
        }}
      />

      <LeadFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        users={users}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.name}?`}
        description="This lead and all its associated data will be permanently removed."
      />
    </div>
  );
}
