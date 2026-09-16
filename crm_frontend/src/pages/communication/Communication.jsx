import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, MessageSquare, StickyNote, Plus, Trash2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Badge, Avatar, SearchBar, FilterSelect, Button, EmptyState, Modal,
  Field, Select, Textarea, useToast, LoadingState, ConfirmDialog,
} from "../../components/common";
import { formatRelative } from "../../utils/format";
import {
  useGetClientsQuery,
  useGetCommunicationsQuery,
  useCreateCommunicationMutation,
  useDeleteCommunicationMutation,
} from "../../store/api/apiSlice";

const EMPTY = [];
const typeIcon = { Call: Phone, Email: Mail, Message: MessageSquare, Note: StickyNote };
const typeTone = { Call: "primary", Email: "blue", Message: "green", Note: "amber" };

function LogModal({ open, onClose, clients }) {
  const toast = useToast();
  const [form, setForm] = useState({ client: "", type: "Call", summary: "" });
  const [createCommunication, { isLoading }] = useCreateCommunicationMutation();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.client || !form.summary.trim()) return;
    try {
      await createCommunication(form).unwrap();
      toast?.push("Communication logged");
      setForm({ client: clients[0]?.id || "", type: "Call", summary: "" });
      onClose();
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to log communication", "error");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Log Communication" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={isLoading}>Save Log</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Client" required>
          <Select value={form.client} onChange={(e) => set("client", e.target.value)}>
            <option value="">Select a client...</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
            {["Call", "Email", "Message", "Note"].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Summary" required>
          <Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="What was discussed..." />
        </Field>
      </div>
    </Modal>
  );
}

export default function Communication() {
  const toast = useToast();
  const navigate = useNavigate();
  const { data: clientsData } = useGetClientsQuery();
  const { data: commsData, isLoading } = useGetCommunicationsQuery();
  const [deleteCommunication] = useDeleteCommunicationMutation();

  const clients = clientsData?.data ?? clientsData?.clients ?? EMPTY;
  const comms = commsData?.data ?? EMPTY;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => comms.filter((c) => {
    const matchesSearch = !search ||
      (c.clientName || "").toLowerCase().includes(search.toLowerCase()) ||
      c.summary.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || c.type === typeFilter;
    return matchesSearch && matchesType;
  }), [comms, search, typeFilter]);

  const handleDelete = async () => {
    try {
      await deleteCommunication(deleteTarget.id).unwrap();
      toast?.push("Log entry deleted", "info");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to delete entry", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Communication"
        subtitle="Centralized timeline of every client interaction"
        action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Log Communication</Button>}
      />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by client or content..." className="flex-1" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} options={["Call", "Email", "Message", "Note"]} label="All Types" />
        </div>

        {isLoading ? (
          <LoadingState label="Loading communication log..." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No communication records" description="Log a call, email or note to start building the timeline." />
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-700 flex flex-col gap-7">
            {filtered.map((c) => {
              const Icon = typeIcon[c.type] || MessageSquare;
              return (
                <div key={c.id} className="relative group">
                  <span className="absolute -left-[31px] top-0.5 h-7 w-7 rounded-full bg-white dark:bg-slate-900 border-2 border-primary-100 dark:border-primary-900/50 flex items-center justify-center text-primary-500">
                    <Icon size={13} />
                  </span>
                  <div className="flex items-center gap-2 flex-wrap mb-1 justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => c.client && navigate(`/clients/${c.client}`)}
                        className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {c.clientName || "Client"}
                      </button>
                      <Badge tone={typeTone[c.type]}>{c.type}</Badge>
                      <span className="text-xs text-slate-300 dark:text-slate-600">{formatRelative(c.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                      title="Delete entry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{c.summary}</p>
                  {c.loggedBy?.name && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Avatar name={c.loggedBy.name} size="sm" />
                      <span className="text-xs text-slate-400 dark:text-slate-500">{c.loggedBy.name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <LogModal open={modalOpen} onClose={() => setModalOpen(false)} clients={clients} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this log entry?"
        description="This communication record will be permanently removed."
      />
    </div>
  );
}
