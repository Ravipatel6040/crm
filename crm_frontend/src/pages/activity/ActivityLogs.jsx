import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck, UserPlus, Pencil, Trash2, LogIn, LogOut, KeyRound,
  Settings as SettingsIcon, Activity as ActivityIcon,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, FilterSelect, SearchBar, EmptyState,
  Avatar, Pagination, LoadingState, ErrorState,
} from "../../components/common";
import { formatRelative, formatDateTime, classNames } from "../../utils/format";
import { ROLE_LABELS } from "../../constants/roles";
import { useGetAuditLogsQuery, useGetUsersQuery } from "../../store/api/apiSlice";

// Stable identity so useMemo deps don't churn while a query is loading.
const EMPTY = [];

const ENTITY_TYPES = ["User", "Lead", "Client", "Project", "Settings", "Auth"];
const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "PASSWORD_RESET", "FORCE_LOGOUT"];

const actionMeta = {
  CREATE: { icon: UserPlus, tone: "green", label: "Created" },
  UPDATE: { icon: Pencil, tone: "blue", label: "Updated" },
  DELETE: { icon: Trash2, tone: "red", label: "Archived" },
  LOGIN: { icon: LogIn, tone: "slate", label: "Signed in" },
  LOGOUT: { icon: LogOut, tone: "slate", label: "Signed out" },
  PASSWORD_RESET: { icon: KeyRound, tone: "amber", label: "Password" },
  FORCE_LOGOUT: { icon: LogOut, tone: "amber", label: "Forced out" },
};

const COLUMNS = ["Who", "Action", "Module", "Detail", "When"];

export default function ActivityLogs() {
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilterLabel, setActionFilterLabel] = useState("");
  const [page, setPage] = useState(1);

  const { data: usersData } = useGetUsersQuery();
  const users = usersData?.data ?? usersData ?? EMPTY;

  // Filters are applied server-side, so any change resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [search, userFilter, entityFilter, actionFilterLabel]);

  const selectedUserId = useMemo(() => {
    if (!userFilter) return undefined;
    return users.find((u) => u.name === userFilter)?.id;
  }, [userFilter, users]);

  const selectedAction = useMemo(() => {
    if (!actionFilterLabel) return undefined;
    return Object.keys(actionMeta).find((k) => actionMeta[k].label === actionFilterLabel);
  }, [actionFilterLabel]);

  const { data, isLoading, isError, refetch, isFetching } = useGetAuditLogsQuery({
    page,
    limit: 20,
    search: search || undefined,
    user: selectedUserId,
    entityType: entityFilter || undefined,
    action: selectedAction,
  });

  const payload = data?.data ?? data ?? {};
  const items = payload.items ?? [];
  const totalPages = payload.totalPages ?? 1;
  const total = payload.total ?? 0;

  const ACTION_OPTIONS = ACTIONS.map((a) => actionMeta[a].label);

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle={`${total} recorded action${total === 1 ? "" : "s"} across your team`}
      />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search the audit trail..." className="flex-1" />
          <div className="flex flex-wrap gap-2">
            <FilterSelect value={userFilter} onChange={setUserFilter} options={users.map((u) => u.name)} label="All Users" />
            <FilterSelect value={entityFilter} onChange={setEntityFilter} options={ENTITY_TYPES} label="All Modules" />
            <FilterSelect value={actionFilterLabel} onChange={setActionFilterLabel} options={ACTION_OPTIONS} label="All Actions" />
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading audit trail..." />
        ) : isError ? (
          <ErrorState onRetry={refetch} description="Couldn't load the audit trail from the server." />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No activity recorded yet"
            description="Account changes, sign-ins and settings updates will appear here as your team uses the CRM."
          />
        ) : (
          <div className={classNames("transition-opacity", isFetching && "opacity-60")}>
            <Table columns={COLUMNS}>
              {items.map((a) => {
                const meta = actionMeta[a.action] || { icon: ActivityIcon, tone: "slate", label: a.action || "Action" };
                const Icon = a.entityType === "Settings" ? SettingsIcon : meta.icon;

                return (
                  <Tr key={a.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={a.actor?.name || "System"} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                            {a.actor?.name || "System"}
                          </p>
                          {a.actor?.role && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              {ROLE_LABELS[a.actor.role] || a.actor.role}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={meta.tone}>
                        <Icon size={11} /> {meta.label}
                      </Badge>
                    </Td>
                    <Td className="text-slate-500 dark:text-slate-400">{a.entityType}</Td>
                    <Td>
                      <p className="text-slate-700 dark:text-slate-300 max-w-md">{a.content}</p>
                      {a.ip && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">IP {a.ip}</p>}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span
                        className="text-xs text-slate-500 dark:text-slate-400"
                        title={formatDateTime(a.createdAt)}
                      >
                        {formatRelative(a.createdAt)}
                      </span>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={total} pageSize={20} />
      </Card>
    </div>
  );
}
