import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, Mail, Phone } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, Avatar, SearchBar, FilterSelect, Button,
  Pagination, ActionsMenu, ConfirmDialog, EmptyState, LoadingState, ErrorState, useToast,
} from "../../components/common";
import UserFormModal from "../../components/users/UserFormModal";
import usePagination from "../../hooks/usePagination";
import { ROLE_LABELS, ROLES } from "../../constants/roles";
import {
  useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation,
} from "../../store/api/apiSlice";

const roleTone = {
  [ROLES.ADMIN]: "primary",
  [ROLES.SALES]: "green",
  [ROLES.MARKETING]: "purple",
  [ROLES.PROJECT_MANAGER]: "amber",
  [ROLES.FINANCE]: "blue",
};

const ROLE_FILTER_OPTIONS = [ROLES.ADMIN, ROLES.SALES, ROLES.MARKETING, ROLES.PROJECT_MANAGER, ROLES.FINANCE].map(
  (r) => ROLE_LABELS[r]
);

const COLUMNS = ["Name", "Contact", "Role", "Designation", "Status", "Actions"];

export default function Accounts() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const users = data?.data ?? data ?? [];

  const [search, setSearch] = useState("");
  const [roleFilterLabel, setRoleFilterLabel] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilterLabel || ROLE_LABELS[u.role] === roleFilterLabel;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilterLabel]);

  const { page, setPage, totalPages, pageItems, totalItems, pageSize } = usePagination(filtered, 8);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await updateUser(payload).unwrap();
        toast?.push("Account updated successfully");
      } else {
        await createUser(payload).unwrap();
        toast?.push(`${ROLE_LABELS[payload.role]} account created`);
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Something went wrong", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget.id).unwrap();
      toast?.push("Account removed", "info");
    } catch (err) {
      toast?.push(err?.data?.message || "Could not remove account", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Team Accounts"
        subtitle={`${totalItems} account${totalItems === 1 ? "" : "s"} · BD/Sales, Marketing, Project & Finance`}
        action={
          <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Create Account
          </Button>
        }
      />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." className="flex-1" />
          <FilterSelect value={roleFilterLabel} onChange={setRoleFilterLabel} options={ROLE_FILTER_OPTIONS} label="All Roles" />
        </div>

        {isLoading ? (
          <LoadingState label="Loading team accounts..." />
        ) : isError ? (
          <ErrorState onRetry={refetch} description="Couldn't load team accounts from the server." />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No accounts found"
            description="Create your first BD/Sales, Marketing, Project or Finance account to get your team started."
          />
        ) : (
          <Table columns={COLUMNS}>
            {pageItems.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <span className="font-medium text-slate-700">{u.name}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><Mail size={12} /> {u.email}</span>
                    {u.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {u.phone}</span>}
                  </div>
                </Td>
                <Td><Badge tone={roleTone[u.role] || "slate"}>{ROLE_LABELS[u.role] || u.role}</Badge></Td>
                <Td className="text-slate-500">{u.designation || "—"}</Td>
                <Td><Badge tone={u.status === "Inactive" ? "red" : "green"}>{u.status || "Active"}</Badge></Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setEditing(u); setModalOpen(true); }}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </Card>

      <UserFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        saving={creating || updating}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove team account?"
        description={`${deleteTarget?.name} will lose access immediately. This can't be undone.`}
        confirmLabel="Remove"
        tone="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
