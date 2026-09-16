import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Building2, FileText, Download, Upload, Trash2,
  Send, Loader2, MessageSquare, PhoneCall, StickyNote,
} from "lucide-react";
import {
  Card, Badge, Avatar, Tabs, ProgressBar, Button, EmptyState, LoadingState,
  Field, Select, Textarea, Input, useToast, ConfirmDialog,
} from "../../components/common";
import { formatCurrency, formatDate, formatRelative } from "../../utils/format";
import {
  useGetClientQuery,
  useGetProjectsQuery,
  useGetInvoicesQuery,
  useGetCommunicationsQuery,
  useCreateCommunicationMutation,
  useDeleteCommunicationMutation,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} from "../../store/api/apiSlice";

const TABS = ["Overview", "Projects", "Financial", "Communication", "Documents", "Activity"];
const EMPTY = [];

const commTypeIcon = { Call: PhoneCall, Email: Mail, Message: MessageSquare, Note: StickyNote };

function LogCommunicationForm({ clientId, onLogged }) {
  const toast = useToast();
  const [type, setType] = useState("Call");
  const [summary, setSummary] = useState("");
  const [createCommunication, { isLoading }] = useCreateCommunicationMutation();

  const submit = async () => {
    if (!summary.trim()) return;
    try {
      await createCommunication({ client: clientId, type, summary: summary.trim() }).unwrap();
      setSummary("");
      onLogged?.();
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to log communication", "error");
    }
  };

  return (
    <div className="border border-slate-100 dark:border-slate-700/60 rounded-xl p-4 mb-5 bg-slate-50/50 dark:bg-slate-800/40">
      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Type" className="sm:w-40">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {["Call", "Email", "Message", "Note"].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Summary" className="flex-1">
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="What was discussed..." />
        </Field>
      </div>
      <div className="flex justify-end mt-3">
        <Button size="sm" icon={isLoading ? Loader2 : Send} onClick={submit} disabled={!summary.trim() || isLoading}>
          Log
        </Button>
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("Overview");
  const [deleteDocTarget, setDeleteDocTarget] = useState(null);
  const [deleteCommTarget, setDeleteCommTarget] = useState(null);

  const { data: clientData, isLoading, isError } = useGetClientQuery(id, { skip: !id });
  const client = clientData?.client ?? clientData?.data ?? clientData;

  const { data: projectsData } = useGetProjectsQuery({ client: id }, { skip: !id });
  const { data: invoicesData } = useGetInvoicesQuery({ client: id }, { skip: !id });
  const { data: commsData } = useGetCommunicationsQuery({ client: id }, { skip: !id });
  const { data: docsData } = useGetDocumentsQuery({ client: id }, { skip: !id });

  const [uploadDocument, { isLoading: uploading }] = useUploadDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [deleteCommunication] = useDeleteCommunicationMutation();

  const clientProjects = projectsData?.data ?? EMPTY;
  const clientInvoices = invoicesData?.data ?? EMPTY;
  const clientComms = commsData?.data ?? EMPTY;
  const clientDocs = docsData?.data ?? EMPTY;

  // A unified activity feed, derived from whatever's already been fetched
  // for the other tabs — there's no separate per-client audit trail, but
  // every one of these events already carries a real timestamp.
  const activityFeed = useMemo(() => {
    const events = [
      ...clientProjects.map((p) => ({ id: `proj-${p.id}`, date: p.createdAt, label: `Project "${p.name}" created`, tone: "primary" })),
      ...clientInvoices.map((i) => ({ id: `inv-${i.id}`, date: i.createdAt, label: `Invoice ${i.invoiceNumber} (${formatCurrency(i.total)}) — ${i.status}`, tone: "green" })),
      ...clientComms.map((c) => ({ id: `comm-${c.id}`, date: c.createdAt, label: `${c.type} logged by ${c.loggedBy?.name || "team"}`, tone: "blue" })),
      ...clientDocs.map((d) => ({ id: `doc-${d.id}`, date: d.createdAt, label: `Document "${d.name}" uploaded`, tone: "amber" })),
    ];
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [clientProjects, clientInvoices, clientComms, clientDocs]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client", id);
    try {
      await uploadDocument(formData).unwrap();
      toast?.push("Document uploaded", "success");
    } catch (err) {
      toast?.push(err?.data?.message || "Upload failed", "error");
    }
  };

  const handleDeleteDoc = async () => {
    try {
      await deleteDocument(deleteDocTarget.id).unwrap();
      toast?.push("Document deleted", "info");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to delete document", "error");
    } finally {
      setDeleteDocTarget(null);
    }
  };

  const handleDeleteComm = async () => {
    try {
      await deleteCommunication(deleteCommTarget.id).unwrap();
      toast?.push("Log entry deleted", "info");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to delete entry", "error");
    } finally {
      setDeleteCommTarget(null);
    }
  };

  if (isLoading) return <LoadingState label="Loading client..." />;

  if (isError || !client) {
    return (
      <EmptyState
        title="Client not found"
        description="This client may have been removed."
        action={<Button onClick={() => navigate("/clients")}>Back to Clients</Button>}
      />
    );
  }

  return (
    <div>
      <button onClick={() => navigate("/clients")} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4">
        <ArrowLeft size={15} /> Back to Clients
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Avatar name={client.name} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{client.company}</h1>
            <Badge>{client.status}</Badge>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{client.name} · {client.id}</p>
        </div>
        <div className="flex gap-2">
          {client.phone && (
            <Button variant="outline" icon={Phone} size="sm" onClick={() => { window.location.href = `tel:${client.phone}`; }}>
              Call
            </Button>
          )}
          {client.email && (
            <Button icon={Mail} size="sm" onClick={() => { window.location.href = `mailto:${client.email}`; }}>
              Email
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card padding="p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">Contract Value</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(client.contractValue)}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">Paid</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(client.paid)}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">Pending</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(client.pending)}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">Projects</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{client.projects}</p>
        </Card>
      </div>

      <Card padding="p-0">
        <div className="px-5 pt-2">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="p-5">
          {tab === "Overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-3">Contact Information</h4>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300"><Mail size={15} className="text-slate-400" /> {client.email || "—"}</div>
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300"><Phone size={15} className="text-slate-400" /> {client.phone || "—"}</div>
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300"><Building2 size={15} className="text-slate-400" /> {client.company}</div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-3">Account Summary</h4>
                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>Status: <Badge>{client.status}</Badge></p>
                  <p>Account manager: {client.accountManagerName || "Unassigned"}</p>
                  <p>Last activity: {formatRelative(client.lastActivity)}</p>
                  <p>Client since: {formatDate(client.createdAt)}</p>
                  {client.isHighValue && <Badge tone="amber">High Value</Badge>}
                </div>
              </div>
              {client.notes && (
                <div className="sm:col-span-2">
                  <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-2">Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{client.notes}</p>
                </div>
              )}
            </div>
          )}

          {tab === "Projects" && (
            clientProjects.length === 0 ? <EmptyState title="No projects yet" /> :
            <div className="flex flex-col gap-3">
              {clientProjects.map((p) => (
                <div key={p.id} className="border border-slate-100 dark:border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{p.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Deadline: {formatDate(p.deadline)}</p>
                  </div>
                  <div className="w-full sm:w-40">
                    <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1"><span>Progress</span><span>{p.progress}%</span></div>
                    <ProgressBar value={p.progress} />
                  </div>
                  <Badge>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {tab === "Financial" && (
            clientInvoices.length === 0 ? <EmptyState title="No invoices yet" /> :
            <div className="flex flex-col gap-3">
              {clientInvoices.map((inv) => (
                <div key={inv.id} className="border border-slate-100 dark:border-slate-700/60 rounded-xl p-4 flex flex-wrap items-center gap-4">
                  <FileText size={18} className="text-primary-400" />
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(inv.total)}</p>
                  <Badge>{inv.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {tab === "Communication" && (
            <div>
              <LogCommunicationForm clientId={id} />
              {clientComms.length === 0 ? <EmptyState title="No communication logged" /> : (
                <div className="relative pl-5 border-l-2 border-slate-100 dark:border-slate-700 flex flex-col gap-6">
                  {clientComms.map((c) => {
                    const Icon = commTypeIcon[c.type] || MessageSquare;
                    return (
                      <div key={c.id} className="relative group">
                        <span className="absolute -left-[27px] top-1 h-6 w-6 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-500 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center">
                          <Icon size={12} />
                        </span>
                        <div className="flex items-center gap-2 flex-wrap justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge tone="slate">{c.type}</Badge>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(c.createdAt)}</span>
                            {c.loggedBy?.name && <span className="text-xs text-slate-400 dark:text-slate-500">· {c.loggedBy.name}</span>}
                          </div>
                          <button
                            onClick={() => setDeleteCommTarget(c)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                            title="Delete entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">{c.summary}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "Documents" && (
            <div>
              <div className="flex justify-end mb-4">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium cursor-pointer transition-colors">
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  Upload Document
                  <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
              {clientDocs.length === 0 ? <EmptyState title="No documents uploaded" /> : (
                <div className="flex flex-col gap-2">
                  {clientDocs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 border border-slate-100 dark:border-slate-700/60 rounded-lg p-3">
                      <FileText size={18} className="text-primary-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{d.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(d.createdAt)} · {Math.round((d.size || 0) / 1024)} KB</p>
                      </div>
                      <a href={`${import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1$/, "") || ""}${d.url}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary-600" title="Download">
                        <Download size={16} />
                      </a>
                      <button onClick={() => setDeleteDocTarget(d)} className="text-slate-400 hover:text-red-500" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "Activity" && (
            activityFeed.length === 0 ? <EmptyState title="No activity yet" /> :
            <div className="relative pl-5 border-l-2 border-slate-100 dark:border-slate-700 flex flex-col gap-6">
              {activityFeed.slice(0, 20).map((a) => (
                <div key={a.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-white dark:ring-slate-900" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">{a.label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatRelative(a.date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={!!deleteDocTarget}
        onClose={() => setDeleteDocTarget(null)}
        onConfirm={handleDeleteDoc}
        title="Delete document?"
        description={`"${deleteDocTarget?.name}" will be permanently removed.`}
      />

      <ConfirmDialog
        open={!!deleteCommTarget}
        onClose={() => setDeleteCommTarget(null)}
        onConfirm={handleDeleteComm}
        title="Delete this log entry?"
        description="This communication record will be permanently removed."
      />
    </div>
  );
}
