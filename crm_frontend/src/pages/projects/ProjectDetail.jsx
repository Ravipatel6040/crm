import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, FileText, CheckCircle2, Circle } from "lucide-react";
import { Card, Badge, Avatar, Tabs, ProgressBar, Button, EmptyState } from "../../components/common";
import { projects, tasks, documents, activityLogs, users, clients } from "../../services/mockData";
import { formatDate, classNames } from "../../utils/format";

const TABS = ["Overview", "Requirements", "Tasks", "Documents", "Activity"];
const priorityTone = { Low: "slate", Medium: "blue", High: "amber", Critical: "red" };

function userName(id) {
  return users.find((u) => u.id === id)?.name || "Unassigned";
}

const mockRequirements = [
  { id: 1, text: "Responsive design across mobile, tablet and desktop", done: true },
  { id: 2, text: "Secure authentication with role-based access", done: true },
  { id: 3, text: "Payment gateway integration (Razorpay/Stripe)", done: false },
  { id: 4, text: "Admin dashboard with analytics", done: false },
  { id: 5, text: "Third-party API integrations as scoped", done: false },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <EmptyState title="Project not found" action={<Button onClick={() => navigate("/projects")}>Back to Projects</Button>} />
    );
  }

  const client = clients.find((c) => c.id === project.client);
  const projectTasks = tasks.filter((t) => t.project === project.id);
  const projectDocs = documents.filter((d) => d.project === project.id);

  return (
    <div>
      <button onClick={() => navigate("/projects")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4">
        <ArrowLeft size={15} /> Back to Projects
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-800">{project.name}</h1>
            <Badge>{project.status}</Badge>
            <Badge tone={priorityTone[project.priority]}>{project.priority}</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">{project.clientName} · {project.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar name={userName(project.manager)} size="sm" />
          <span className="text-sm text-slate-500">{userName(project.manager)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card padding="p-4">
          <p className="text-xs text-slate-400">Start Date</p>
          <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1.5"><Calendar size={14} /> {formatDate(project.startDate)}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400">Deadline</p>
          <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1.5"><Calendar size={14} /> {formatDate(project.deadline)}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400">Tasks Completed</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{project.tasks.done} / {project.tasks.total}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400 mb-1.5">Overall Progress</p>
          <div className="flex items-center gap-2">
            <ProgressBar value={project.progress} tone={project.progress === 100 ? "green" : "primary"} />
            <span className="text-xs font-semibold text-slate-600">{project.progress}%</span>
          </div>
        </Card>
      </div>

      <Card padding="p-0">
        <div className="px-5 pt-2">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="p-5">
          {tab === "Overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3">Project Information</h4>
                <div className="flex flex-col gap-2 text-slate-600">
                  <p>Client: <span className="font-medium">{project.clientName}</span></p>
                  <p>Manager: <span className="font-medium">{userName(project.manager)}</span></p>
                  <p>Priority: <Badge tone={priorityTone[project.priority]}>{project.priority}</Badge></p>
                  <p>Status: <Badge>{project.status}</Badge></p>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3">Contact</h4>
                <div className="flex flex-col gap-2 text-slate-600">
                  <p>{client?.email}</p>
                  <p>{client?.phone}</p>
                </div>
              </div>
            </div>
          )}

          {tab === "Requirements" && (
            <div className="flex flex-col gap-2">
              {mockRequirements.map((r) => (
                <div key={r.id} className="flex items-center gap-3 border border-slate-100 rounded-lg p-3">
                  {r.done ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <Circle size={18} className="text-slate-300 shrink-0" />}
                  <span className={classNames("text-sm", r.done ? "text-slate-400 line-through" : "text-slate-700")}>{r.text}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "Tasks" && (
            projectTasks.length === 0 ? <EmptyState title="No tasks yet" /> :
            <div className="flex flex-col gap-2">
              {projectTasks.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-3 border border-slate-100 rounded-lg p-3">
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-sm font-medium text-slate-700">{t.title}</p>
                    <p className="text-xs text-slate-400">Due {formatDate(t.deadline)}</p>
                  </div>
                  <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                  <Badge>{t.status}</Badge>
                  <Avatar name={userName(t.assignedTo)} size="sm" />
                </div>
              ))}
            </div>
          )}

          {tab === "Documents" && (
            projectDocs.length === 0 ? <EmptyState title="No documents uploaded" /> :
            <div className="flex flex-col gap-2">
              {projectDocs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 border border-slate-100 rounded-lg p-3">
                  <FileText size={18} className="text-primary-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.type} · {d.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Activity" && (
            <div className="relative pl-5 border-l-2 border-slate-100 flex flex-col gap-6">
              {activityLogs.slice(0, 4).map((a) => (
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
