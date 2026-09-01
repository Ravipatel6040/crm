import { useNavigate } from "react-router-dom";
import {
  FolderKanban, Briefcase, CheckSquare, Clock, AlertTriangle, CheckCircle2,
  ArrowRight, Sparkles, Plus, Users, Calendar, UploadCloud, MessageSquare, ListTodo
} from "lucide-react";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Button, LoadingState, EmptyState } from "../../components/common";
import { ROLE_LABELS } from "../../constants/roles";
import { useGetProjectDashboardSummaryQuery } from "../../store/api/apiSlice";
import { formatDate } from "../../utils/format";

export default function ProjectDashboard({ user }) {
  const navigate = useNavigate();
  const { data: summaryWrapper, isLoading } = useGetProjectDashboardSummaryQuery();
  
  const summary = summaryWrapper?.data || summaryWrapper || {};
  const kpis = summary.kpis || {};
  const taskBoard = summary.taskBoard || { todo: [], inProgress: [], completed: [] };
  const alerts = summary.alerts || [];

  const pipelineSteps = [
    "Planning",
    "Requirements",
    "Development",
    "Testing",
    "Client Review",
    "Completed"
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-primary-500 px-6 sm:px-8 py-7 text-white">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 rounded-full px-3 py-1 mb-3">
              <Sparkles size={12} /> {ROLE_LABELS[user?.role]} workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Ready to build, {user?.name?.split(" ")[0]}.
            </h1>
            <p className="text-primary-100 text-sm mt-1.5 max-w-md">
              You are managing {kpis.activeProjects || 0} active projects and have {kpis.tasksDueToday || 0} tasks due today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={() => navigate("/projects")} className="flex items-center gap-2 rounded-xl bg-white text-primary-700 px-3.5 py-2.5 text-sm font-semibold hover:bg-primary-50">
              <Plus size={15} /> New Project
            </button>
            <button onClick={() => navigate("/tasks")} className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur px-3.5 py-2.5 text-sm font-medium">
              <CheckSquare size={15} /> My Tasks
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading project data..." />
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="My Clients" value={kpis.myClients || 0} tone="primary" />
            <KpiCard title="Active Projects" value={kpis.activeProjects || 0} tone="primary" />
            <KpiCard title="Pending Tasks" value={kpis.pendingTasks || 0} tone="amber" />
            <KpiCard title="Due Today" value={kpis.tasksDueToday || 0} tone="red" />
            <KpiCard title="Delayed Projects" value={kpis.delayedProjects || 0} tone="red" />
            <KpiCard title="Completed" value={kpis.completedProjects || 0} tone="green" />
          </div>

          {/* Project Pipeline Visual */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800">Project Pipeline Lifecycle</h2>
            <Card className="p-6 bg-slate-50 border-dashed border-2">
              <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 overflow-x-auto">
                {pipelineSteps.map((step, idx) => (
                  <div key={step} className="flex items-center gap-2 flex-1 min-w-[110px]">
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="h-10 w-10 rounded-full bg-white shadow-sm text-primary-600 flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold text-slate-600 text-center">{step}</span>
                    </div>
                    {idx < pipelineSteps.length - 1 && (
                      <ArrowRight className="text-slate-300 mx-auto hidden sm:block shrink-0" size={16} />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="flex flex-col gap-6">
              
              {/* Task Board (Kanban) */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Task Board</h2>
                  <Button size="sm" variant="outline" onClick={() => navigate("/tasks")}>View full board</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TODO Column */}
                  <Card className="bg-slate-50 p-4 border-0">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400"></span> TODO
                    </h3>
                    <div className="flex flex-col gap-3">
                      {taskBoard.todo?.length > 0 ? taskBoard.todo.map(t => (
                        <div key={t._id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                          <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{t.project?.name}</p>
                        </div>
                      )) : <p className="text-xs text-slate-400 text-center py-4">No tasks</p>}
                    </div>
                  </Card>
                  
                  {/* IN PROGRESS Column */}
                  <Card className="bg-slate-50 p-4 border-0">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary-500"></span> IN PROGRESS
                    </h3>
                    <div className="flex flex-col gap-3">
                      {taskBoard.inProgress?.length > 0 ? taskBoard.inProgress.map(t => (
                        <div key={t._id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-primary-500">
                          <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{t.project?.name}</p>
                        </div>
                      )) : <p className="text-xs text-slate-400 text-center py-4">No active tasks</p>}
                    </div>
                  </Card>

                  {/* COMPLETED Column */}
                  <Card className="bg-slate-50 p-4 border-0">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span> COMPLETED
                    </h3>
                    <div className="flex flex-col gap-3">
                      {taskBoard.completed?.slice(0, 5).map(t => (
                        <div key={t._id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 opacity-60">
                          <p className="text-sm font-semibold text-slate-800 line-through">{t.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{t.project?.name}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </section>

              {/* Project Management Actions */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Project Management</h2>
                <Card>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-y divide-slate-100 [&>div]:p-4">
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <FolderKanban className="text-primary-500 mb-1" size={20}/>
                      <a href="/projects" className="text-sm text-slate-700 font-medium hover:text-primary-600">Create Project</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <ListTodo className="text-primary-500 mb-1" size={20}/>
                      <a href="/tasks" className="text-sm text-slate-700 font-medium hover:text-primary-600">Create Tasks</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <Users className="text-primary-500 mb-1" size={20}/>
                      <a href="/projects" className="text-sm text-slate-700 font-medium hover:text-primary-600">Assign Team</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <Calendar className="text-primary-500 mb-1" size={20}/>
                      <a href="/projects" className="text-sm text-slate-700 font-medium hover:text-primary-600">Set Deadlines</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <UploadCloud className="text-primary-500 mb-1" size={20}/>
                      <a href="/documents" className="text-sm text-slate-700 font-medium hover:text-primary-600">Upload Docs</a>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <MessageSquare className="text-primary-500 mb-1" size={20}/>
                      <a href="/communication" className="text-sm text-slate-700 font-medium hover:text-primary-600">Client Comm.</a>
                    </div>
                  </div>
                </Card>
              </section>
            </div>

            {/* Project Alerts */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Project Alerts</h2>
              </div>
              <Card className="h-full">
                {alerts.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="No urgent alerts" description="All tasks and projects are on track." />
                ) : (
                  <div className="flex flex-col gap-4">
                    {alerts.map((a, idx) => (
                      <div key={idx} className="flex gap-3 border-b border-slate-50 pb-4 last:border-0 last:pb-0 items-start">
                        <AlertTriangle className={`mt-0.5 shrink-0 ${a.isOverdue ? 'text-red-500' : 'text-amber-500'}`} size={18} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                          <p className="text-xs text-slate-500 mb-1.5">{a.projectName}</p>
                          <Badge tone={a.isOverdue ? "red" : "amber"}>
                            {a.isOverdue ? "Overdue" : "Due Today"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
