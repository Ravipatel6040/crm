import { useMemo, useState } from "react";
import { Plus, Eye, Pencil, Trash2, UserCog, Phone, Mail } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, Avatar, SearchBar, FilterSelect, Button,
  Pagination, ActionsMenu, ConfirmDialog, EmptyState, useToast, LoadingState
} from "../../components/common";
import LeadFormModal from "../../components/leads/LeadFormModal";
import { leadSources, pipelineStages } from "../../services/mockData";
import { formatCurrency, formatDate } from "../../utils/format";
import usePagination from "../../hooks/usePagination";
import {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useGetUsersQuery
} from "../../store/api/apiSlice";

export default function Leads() {
  const toast = useToast();
  
  // RTK Query Hooks
  const { data: leadsData, isLoading } = useGetLeadsQuery();
  const { data: usersData } = useGetUsersQuery();
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();

  const leads = leadsData?.data ?? leadsData ?? [];
  const users = usersData?.data ?? usersData ?? [];

  const userName = (id) => {
    return users.find((u) => u.id === id)?.name || "Unassigned";
  };

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch =
        !search ||
        (l.name && l.name.toLowerCase().includes(search.toLowerCase())) ||
        (l.company && l.company.toLowerCase().includes(search.toLowerCase()));
      const matchesSource = !sourceFilter || l.source === sourceFilter;
      const matchesStatus = !statusFilter || l.status === statusFilter;
      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [leads, search, sourceFilter, statusFilter]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 6);

  const handleSave = async (lead) => {
    try {
      if (editing) {
        await updateLead({ id: lead.id, ...lead }).unwrap();
        toast?.push("Lead updated successfully");
      } else {
        await createLead(lead).unwrap();
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
      await deleteLead(deleteTarget.id).unwrap();
      toast?.push("Lead deleted", "info");
      setDeleteTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error deleting lead", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${totalItems} total leads in your funnel`}
        action={
          <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Add Lead
          </Button>
        }
      />

      <Card padding="p-4 sm:p-5">
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
              <Tr key={l.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={l.name} size="sm" />
                    <div>
                      <p className="font-medium text-slate-700">{l.name}</p>
                      <p className="text-xs text-slate-400">{l.id}</p>
                    </div>
                  </div>
                </Td>
                <Td>{l.company}</Td>
                <Td><Badge tone="slate">{l.source}</Badge></Td>
                <Td className="max-w-[160px] truncate">{l.interestedIn || "-"}</Td>
                <Td>{formatCurrency(l.budget)}</Td>
                <Td>{userName(l.assignedTo)}</Td>
                <Td><Badge>{l.status}</Badge></Td>
                <Td>{formatDate(l.nextFollowUp)}</Td>
                <Td>
                  <ActionsMenu
                    actions={[
                      { label: "View Lead", icon: Eye, onClick: () => toast?.push(`Viewing ${l.name}`, "info") },
                      { label: "Edit Lead", icon: Pencil, onClick: () => { setEditing(l); setModalOpen(true); } },
                      { label: "Assign BD", icon: UserCog, onClick: () => toast?.push("Open assign panel", "info") },
                      { label: "Call", icon: Phone, onClick: () => toast?.push(`Calling ${l.phone}`, "info") },
                      { label: "Email", icon: Mail, onClick: () => toast?.push(`Emailing ${l.email}`, "info") },
                      { divider: true },
                      { label: "Delete Lead", icon: Trash2, danger: true, onClick: () => setDeleteTarget(l) },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </Card>

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
