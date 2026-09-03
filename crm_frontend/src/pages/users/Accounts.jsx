import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, Mail, Phone, LogOut, Clock, AlertCircle } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, Avatar, SearchBar, FilterSelect, Button,
  Pagination, ConfirmDialog, EmptyState, LoadingState, ErrorState, useToast,
} from "../../components/common";
import UserFormModal from "../../components/users/UserFormModal";
import UserArchiveModal from "../../components/users/UserArchiveModal";
import usePagination from "../../hooks/usePagination";
import { ROLE_LABELS, ROLES } from "../../constants/roles";
import { formatRelative, daysSince, classNames } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";
import {
  useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation,
  useDeleteUserMutation, useForceLogoutUserMutation, useGetAppSettingsQuery,
} from "../../store/api/apiSlice";

// Stable identity so useMemo deps don't churn while a query is loading.
const EMPTY = [];

const roleTone = {
  [ROLES.ADMIN]: "primary",
  [ROLES.SALES]: "green",
  [ROLES.MARKETING]: "purple",
  [ROLES.PROJECT_MANAGER]: "amber",
  [ROLES.FINANCE]: "blue",
};

// Backend stores uppercase ACTIVE / INACTIVE / SUSPENDED.
const statusTone = { ACTIVE: "green", INACTIVE: "slate", SUSPENDED: "red" };
const statusLabel = { ACTIVE: "Active", INACTIVE: "Inactive", SUSPENDED: "Suspended" };

const ROLE_FILTER_OPTIONS = [ROLES.ADMIN, ROLES.SALES, ROLES.MARKETING, ROLES.PROJECT_MANAGER, ROLES.FINANCE].map(
  (r) => ROLE_LABELS[r]
);
const STATUS_FILTER_OPTIONS = ["Active", "Inactive", "Suspended"];

const COLUMNS = ["Name", "Contact", "Role", "Status", "Last active", "Actions"];

export default function Accounts() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const { data, isLoading, isError, refetch } = useGetUsersQuery();
  const { data: settingsData } = useGetAppSettingsQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: archiving }] = useDeleteUserMutation();
  const [forceLogout] = useForceLogoutUserMutation();

  const users = data?.data ?? data ?? EMPTY;
  const settings = settingsData?.data ?? settingsData ?? {};
  const staleAfterDays = settings?.preferences?.staleAccountDays ?? 30;

  const [search, setSearch] = useState("");
  const [roleFilterLabel, setRoleFilterLabel] = useState("");
  const [statusFilterLabel, setStatusFilterLabel] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [logoutTarget, setLogoutTarget] = useState(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilterLabel || ROLE_LABELS[u.role] === roleFilterLabel;
      const matchesStatus =
        !statusFilterLabel || statusLabel[u.status] === statusFilterLabel;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilterLabel, statusFilterLabel]);

  const { page, setPage, totalPages, pageItems, totalItems, pageSize } = usePagination(filtered, 8);

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const adminCount = users.filter((u) => u.role === ROLES.ADMIN && u.status === "ACTIVE").length;
  const staleCount = users.filter((u) => {
    const days = daysSince(u.lastLoginAt);
    return days === null || days > staleAfterDays;
  }).length;

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

  const handleArchive = async ({ id, reassignTo }) => {
    try {
      const res = await deleteUser({ id, reassignTo }).unwrap();
      toast?.push(res?.message || "Account archived", "info");
      setArchiveTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Could not archive account", "error");
    }
  };

  const handleForceLogout = async () => {
    try {
      const res = await forceLogout(logoutTarget.id || logoutTarget._id).unwrap();
      toast?.push(res?.message || "User signed out", "success");
    } catch (err) {
      toast?.push(err?.data?.message || "Could not sign the user out", "error");
    } finally {
      setLogoutTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Team Accounts"
        subtitle={`${totalItems} account${totalItems === 1 ? "" : "s"} · ${activeCount} active · ${adminCount} admin${adminCount === 1 ? "" : "s"}`}
        action={
          <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Create Account
          </Button>
        }
      />

      {staleCount > 0 && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
          <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <span className="font-semibold">{staleCount} account{staleCount === 1 ? "" : "s"}</span>{" "}
            {staleCount === 1 ? "has" : "have"} not signed in for over {staleAfterDays} days.
          </p>
        </div>
      )}

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." className="flex-1" />
          <FilterSelect value={roleFilterLabel} onChange={setRoleFilterLabel} options={ROLE_FILTER_OPTIONS} label="All Roles" />
          <FilterSelect value={statusFilterLabel} onChange={setStatusFilterLabel} options={STATUS_FILTER_OPTIONS} label="All Statuses" />
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
            {pageItems.map((u) => {
              const isSelf = (u.id || u._id) === (currentUser?.id || currentUser?._id);
              const days = daysSince(u.lastLoginAt);
              const isStale = days === null || days > staleAfterDays;

              return (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{u.name}</span>
                          {isSelf && (
                            <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        {u.designation && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{u.designation}</p>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><Mail size={12} /> {u.email}</span>
                      {u.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {u.phone}</span>}
                    </div>
                  </Td>
                  <Td><Badge tone={roleTone[u.role] || "slate"}>{ROLE_LABELS[u.role] || u.role}</Badge></Td>
                  <Td>
                    <Badge tone={statusTone[u.status] || "slate"}>
                      {statusLabel[u.status] || u.status || "Unknown"}
                    </Badge>
                  </Td>
                  <Td>
                    <span
                      className={classNames(
                        "flex items-center gap-1.5 text-xs",
                        isStale ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
                      )}
                      title={u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never signed in"}
                    >
                      <Clock size={12} /> {formatRelative(u.lastLoginAt)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditing(u); setModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 rounded-lg transition-colors"
                        title="Edit account"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setLogoutTarget(u)}
                        disabled={isSelf}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={isSelf ? "You cannot sign yourself out here" : "Sign out of all devices"}
                      >
                        <LogOut size={16} />
                      </button>
                      <button
                        onClick={() => setArchiveTarget(u)}
                        disabled={isSelf}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={isSelf ? "You cannot archive your own account" : "Archive account"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
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

      <UserArchiveModal
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        user={archiveTarget}
        users={users}
        saving={archiving}
      />

      <ConfirmDialog
        open={!!logoutTarget}
        title="Sign this user out?"
        description={`${logoutTarget?.name} will be signed out of every device and must log in again. Their account stays active.`}
        confirmLabel="Sign out"
        onConfirm={handleForceLogout}
        onClose={() => setLogoutTarget(null)}
      />
    </div>
  );
}
