import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Building2, FileText, Download } from "lucide-react";
import {
  Card, CardHeader, Badge, Avatar, Tabs, ProgressBar, Button, EmptyState,
} from "../../components/common";
import { clients, projects, payments, communications, documents, activityLogs } from "../../services/mockData";
import { formatCurrency, formatDate } from "../../utils/format";

const TABS = ["Overview", "Projects", "Financial", "Communication", "Documents", "Activity"];

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <EmptyState
        title="Client not found"
        description="This client may have been removed."
        action={<Button onClick={() => navigate("/clients")}>Back to Clients</Button>}
      />
    );
  }

  const clientProjects = projects.filter((p) => p.client === client.id);
  const clientPayments = payments.filter((p) => clientProjects.some((cp) => cp.id === p.project));
  const clientComms = communications.filter((c) => c.client === client.id);
  const clientDocs = documents.filter((d) => d.client === client.id);

  return (
    <div>
      <button onClick={() => navigate("/clients")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4">
        <ArrowLeft size={15} /> Back to Clients
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Avatar name={client.name} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-800">{client.company}</h1>
            <Badge>{client.status}</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{client.name} · {client.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Phone} size="sm">Call</Button>
          <Button icon={Mail} size="sm">Email</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card padding="p-4">
          <p className="text-xs text-slate-400">Contract Value</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{formatCurrency(client.contractValue)}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400">Paid</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(client.paid)}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400">Pending</p>
          <p className="text-lg font-bold text-amber-600 mt-1">{formatCurrency(client.pending)}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400">Active Projects</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{client.projects}</p>
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
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3">Contact Information</h4>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-2.5 text-slate-600"><Mail size={15} className="text-slate-400" /> {client.email}</div>
                  <div className="flex items-center gap-2.5 text-slate-600"><Phone size={15} className="text-slate-400" /> {client.phone}</div>
                  <div className="flex items-center gap-2.5 text-slate-600"><Building2 size={15} className="text-slate-400" /> {client.company}</div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3">Account Summary</h4>
                <div className="flex flex-col gap-2 text-sm text-slate-600">
                  <p>Status: <Badge>{client.status}</Badge></p>
                  <p>Last activity: {formatDate(client.lastActivity)}</p>
                  <p>Client since: {formatDate(client.lastActivity)}</p>
                </div>
              </div>
            </div>
          )}

          {tab === "Projects" && (
            clientProjects.length === 0 ? <EmptyState title="No projects yet" /> :
            <div className="flex flex-col gap-3">
              {clientProjects.map((p) => (
                <div key={p.id} className="border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Deadline: {formatDate(p.deadline)}</p>
                  </div>
                  <div className="w-full sm:w-40">
                    <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Progress</span><span>{p.progress}%</span></div>
                    <ProgressBar value={p.progress} />
                  </div>
                  <Badge>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {tab === "Financial" && (
            clientPayments.length === 0 ? <EmptyState title="No invoices yet" /> :
            <div className="flex flex-col gap-3">
              {clientPayments.map((p) => (
                <div key={p.id} className="border border-slate-100 rounded-xl p-4 flex flex-wrap items-center gap-4">
                  <FileText size={18} className="text-primary-400" />
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-sm font-medium text-slate-700">{p.id}</p>
                    <p className="text-xs text-slate-400">Due {formatDate(p.dueDate)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(p.amount)}</p>
                  <Badge>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {tab === "Communication" && (
            clientComms.length === 0 ? <EmptyState title="No communication logged" /> :
            <div className="relative pl-5 border-l-2 border-slate-100 flex flex-col gap-6">
              {clientComms.map((c) => (
                <div key={c.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-primary-50" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="slate">{c.type}</Badge>
                    <span className="text-xs text-slate-400">{c.date}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5">{c.summary}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "Documents" && (
            clientDocs.length === 0 ? <EmptyState title="No documents uploaded" /> :
            <div className="flex flex-col gap-2">
              {clientDocs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 border border-slate-100 rounded-lg p-3">
                  <FileText size={18} className="text-primary-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.type} · {d.size}</p>
                  </div>
                  <button className="text-slate-400 hover:text-primary-600"><Download size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {tab === "Activity" && (
            <div className="relative pl-5 border-l-2 border-slate-100 flex flex-col gap-6">
              {activityLogs.slice(0, 5).map((a) => (
                <div key={a.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-primary-50" />
                  <p className="text-sm text-slate-600"><span className="font-medium">{a.user}</span> — {a.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.date} · {a.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
