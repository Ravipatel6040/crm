import { useNavigate } from "react-router-dom";
import { FolderKanban, CheckCircle2, AlertTriangle, Sparkles, Plus, ArrowRight, Briefcase, Clock } from "lucide-react";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, ProgressBar, LoadingState, EmptyState } from "../../components/common";
import { ROLE_LABELS } from "../../constants/roles";
import { useGetProjectsQuery, useGetClientsQuery } from "../../store/api/apiSlice";

export default function ProjectDashboard({ user }) {
  const navigate = useNavigate();
  const { data: projectsData, isLoading: loadingProjects } = useGetProjectsQuery();
  const { data: clientsData } = useGetClientsQuery();

  const projects = projectsData?.data ?? projectsData ?? [];
  const clients = clientsData?.data ?? clientsData ?? [];

  const activeProjects = projects.filter((p) => p.status !== "Completed" && p.status !== "Cancelled");
  const completedProjects = projects.filter((p) => p.status === "Completed");
  const delayedProjects = projects.filter((p) => p.status === "On Hold" || (p.tasks && p.tasks.done < p.tasks.total && p.overdue));
  const totalTasks = projects.reduce((s, p) => s + (p.tasks?.total || 0), 0);
  const doneTasks = projects.reduce((s, p) => s + (p.tasks?.done || 0), 0);
  const taskCompletionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl bg-primary-500 px-6 sm:px-8 py-7 text-white">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 rounded-full px-3 py-1 mb-3">
              <Sparkles size={12} /> {ROLE_LABELS[user?.role]} workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Good to see you, {user?.name?.split(" ")[0]}.
            </h1>
            <p className="text-primary-100 text-sm mt-1.5 max-w-md">
              {activeProjects.length} active projects, {doneTasks}/{totalTasks} tasks completed overall.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => navigate("/projects")} className="flex items-center gap-2 rounded-xl bg-white text-primary-700 px-3.5 py-2.5 text-sm font-semibold hover:bg-primary-50">
              <Plus size={15} /> New Project
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon={FolderKanban} title="Active Projects" value={activeProjects.length} tone="primary" />
        <KpiCard icon={CheckCircle2} title="Completed" value={completedProjects.length} tone="green" />
        <KpiCard icon={AlertTriangle} title="On Hold / Delayed" value={delayedProjects.length} tone="red" />
        <KpiCard icon={Briefcase} title="Task Completion" value={`${taskCompletionRate}%`} tone="amber" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Active Projects</h3>
          <button onClick={() => navigate("/projects")} className="text-xs font-medium text-primary-600 flex items-center gap-1 hover:underline">
            View all <ArrowRight size={12} />
          </button>
        </div>
        {loadingProjects ? (
          <LoadingState label="Loading projects..." />
        ) : activeProjects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No active projects" description="Create a project to start tracking tasks and requirements." />
        ) : (
          <div className="flex flex-col gap-4">
            {activeProjects.slice(0, 6).map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700 truncate cursor-pointer hover:text-primary-600" onClick={() => navigate(`/projects/${p.id}`)}>
                    {p.name}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">{p.progress ?? 0}%</span>
                </div>
                <ProgressBar value={p.progress ?? 0} tone={p.progress === 100 ? "green" : "primary"} />
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <Badge tone={p.status === "On Hold" ? "amber" : "slate"}>{p.status}</Badge>
                  {p.tasks && <span>{p.tasks.done}/{p.tasks.total} tasks</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Clock size={15} className="text-primary-500" /> Needs Attention
            </h3>
          </div>
          {delayedProjects.length === 0 ? (
            <EmptyState title="Nothing overdue" description="Every project is on track." />
          ) : (
            <div className="flex flex-col divide-y divide-slate-50">
              {delayedProjects.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-sm font-medium text-slate-700 truncate">{p.name}</span>
                  <Badge tone="red">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Client Projects</h3>
            <button onClick={() => navigate("/clients")} className="text-xs font-medium text-primary-600 flex items-center gap-1 hover:underline">
              View clients <ArrowRight size={12} />
            </button>
          </div>
          {clients.length === 0 ? (
            <EmptyState icon={Briefcase} title="No clients yet" />
          ) : (
            <div className="flex flex-col divide-y divide-slate-50">
              {clients.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-sm font-medium text-slate-700 truncate">{c.company || c.name}</span>
                  <span className="text-xs text-slate-400">{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
