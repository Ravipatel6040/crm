import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal, Button, Field, Select, Badge } from "../common";
import { ROLE_LABELS } from "../../constants/roles";
import { useGetUserWorkloadQuery } from "../../store/api/apiSlice";

/**
 * Archiving a team member has to answer one question first: who takes over
 * their leads, clients and projects? Without this the records silently keep
 * pointing at an account nobody can see.
 */
export default function UserArchiveModal({ open, onClose, onConfirm, user, users = [], saving }) {
  const [reassignTo, setReassignTo] = useState("");

  const userId = user?.id || user?._id;
  const { data, isLoading } = useGetUserWorkloadQuery(userId, { skip: !open || !userId });
  const workload = data?.data ?? data ?? {};
  const total = workload.total ?? 0;

  useEffect(() => {
    setReassignTo("");
  }, [user, open]);

  const candidates = users.filter(
    (u) => (u.id || u._id) !== userId && !u.isArchived && u.status === "ACTIVE"
  );

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Archive team account"
      subtitle={`${user.name} · ${ROLE_LABELS[user.role] || user.role}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            loading={saving}
            onClick={() => onConfirm({ id: userId, reassignTo: reassignTo || null })}
          >
            Archive account
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3.5">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <p className="font-semibold mb-0.5">{user.name} will lose access immediately.</p>
            <p>
              The account is archived, not deleted — their name stays readable in
              historical records and the audit log.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Records currently owned
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Checking…
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Leads", value: workload.leads ?? 0 },
                { label: "Clients", value: workload.clients ?? 0 },
                { label: "Projects", value: workload.projects ?? 0 },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {total > 0 && (
          <Field
            label="Reassign their records to"
            hint="Leave as Unassigned to clear the owner instead of transferring."
          >
            <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
              <option value="">Unassigned</option>
              {candidates.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.name} — {ROLE_LABELS[u.role] || u.role}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {total === 0 && !isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Badge tone="green">Nothing to reassign</Badge>
            This account owns no active records.
          </div>
        )}
      </div>
    </Modal>
  );
}
