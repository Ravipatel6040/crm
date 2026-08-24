import { useMemo, useState } from "react";
import { Phone, Mail, MessageSquare, StickyNote, Plus } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { Card, Badge, Avatar, SearchBar, FilterSelect, Button, EmptyState, Modal, Field, Select, Textarea, useToast } from "../../components/common";
import { communications as initialComms, clients, users } from "../../services/mockData";

const typeIcon = { Call: Phone, Email: Mail, Message: MessageSquare, Note: StickyNote };
const typeTone = { Call: "primary", Email: "blue", Message: "green", Note: "amber" };

function LogModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ client: clients[0]?.id, type: "Call", summary: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.summary.trim()) return;
    const clientObj = clients.find((c) => c.id === form.client);
    onSave({
      ...form,
      id: `CO-${Math.floor(100 + Math.random() * 900)}`,
      clientName: clientObj?.company,
      user: "u1",
      date: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    });
    setForm({ client: clients[0]?.id, type: "Call", summary: "" });
  };
  return (
    <Modal open={open} onClose={onClose} title="Log Communication" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save Log</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Client">
          <Select value={form.client} onChange={(e) => set("client", e.target.value)}>
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
  const [comms, setComms] = useState(initialComms);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => comms.filter((c) => {
    const matchesSearch = !search || c.clientName.toLowerCase().includes(search.toLowerCase()) || c.summary.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || c.type === typeFilter;
    return matchesSearch && matchesType;
  }), [comms, search, typeFilter]);

  const handleSave = (log) => {
    setComms((cs) => [log, ...cs]);
    toast?.push("Communication logged");
    setModalOpen(false);
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

        {filtered.length === 0 ? (
          <EmptyState title="No communication records" />
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-100 flex flex-col gap-7">
            {filtered.map((c) => {
              const Icon = typeIcon[c.type] || MessageSquare;
              const user = users.find((u) => u.id === c.user);
              return (
                <div key={c.id} className="relative">
                  <span className="absolute -left-[31px] top-0.5 h-7 w-7 rounded-full bg-white border-2 border-primary-100 flex items-center justify-center text-primary-500">
                    <Icon size={13} />
                  </span>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-slate-700">{c.clientName}</p>
                    <Badge tone={typeTone[c.type]}>{c.type}</Badge>
                    <span className="text-xs text-slate-300">{c.date}</span>
                  </div>
                  <p className="text-sm text-slate-600">{c.summary}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Avatar name={user?.name || "?"} size="sm" />
                    <span className="text-xs text-slate-400">{user?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <LogModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
