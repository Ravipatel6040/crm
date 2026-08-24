import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, Avatar, SearchBar, FilterSelect, Button,
  Pagination, ActionsMenu, ConfirmDialog, EmptyState, useToast, LoadingState
} from "../../components/common";
import ClientFormModal from "../../components/clients/ClientFormModal";
import { formatCurrency, formatDate } from "../../utils/format";
import usePagination from "../../hooks/usePagination";
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation
} from "../../store/api/apiSlice";

export default function Clients() {
  const navigate = useNavigate();
  const toast = useToast();
  
  // RTK Query Hooks
  const { data: clientsData, isLoading } = useGetClientsQuery();
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const [deleteClient] = useDeleteClientMutation();

  const clients = clientsData?.data ?? clientsData ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch = !search || 
        (c.name && c.name.toLowerCase().includes(search.toLowerCase())) || 
        (c.company && c.company.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 6);

  const handleSave = async (client) => {
    try {
      if (editing) {
        await updateClient({ id: client.id, ...client }).unwrap();
        toast?.push("Client updated successfully");
      } else {
        await createClient(client).unwrap();
        toast?.push("Client added successfully");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving client", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClient(deleteTarget.id).unwrap();
      toast?.push("Client deleted", "info");
      setDeleteTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error deleting client", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${totalItems} clients on your roster`}
        action={<Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>Add Client</Button>}
      />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or company..." className="flex-1" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={["Active", "On Hold", "Inactive"]} label="All Statuses" />
        </div>

        {isLoading ? (
          <LoadingState label="Loading clients..." />
        ) : pageItems.length === 0 ? (
          <EmptyState title="No clients found" description="Try adjusting your search or filters." />
        ) : (
          <Table columns={["Client", "Company", "Projects", "Contract Value", "Paid", "Pending", "Status", "Last Activity", "Actions"]}>
            {pageItems.map((c) => (
              <Tr key={c.id} className="cursor-pointer" onClick={() => navigate(`/clients/${c.id}`)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size="sm" />
                    <div>
                      <p className="font-medium text-slate-700">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.id}</p>
                    </div>
                  </div>
                </Td>
                <Td>{c.company}</Td>
                <Td>{c.projects}</Td>
                <Td>{formatCurrency(c.contractValue)}</Td>
                <Td className="text-emerald-600 font-medium">{formatCurrency(c.paid)}</Td>
                <Td className="text-amber-600 font-medium">{formatCurrency(c.pending)}</Td>
                <Td><Badge>{c.status}</Badge></Td>
                <Td>{formatDate(c.lastActivity)}</Td>
                <Td onClick={(e) => e.stopPropagation()}>
                  <ActionsMenu
                    actions={[
                      { label: "View Client", icon: Eye, onClick: () => navigate(`/clients/${c.id}`) },
                      { label: "Edit Client", icon: Pencil, onClick: () => { setEditing(c); setModalOpen(true); } },
                      { divider: true },
                      { label: "Delete Client", icon: Trash2, danger: true, onClick: () => setDeleteTarget(c) },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </Card>

      <ClientFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.company}?`}
        description="This client's projects, invoices, and history will remain but be unlinked."
      />
    </div>
  );
}
