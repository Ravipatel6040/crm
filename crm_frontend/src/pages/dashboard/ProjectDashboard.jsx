import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, CheckCircle2, Calendar, ChevronRight, ExternalLink, Filter, Layers } from "lucide-react";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Button, LoadingState, useToast } from "../../components/common";
import { ROLE_LABELS } from "../../constants/roles";
import {
  useGetProjectDashboardSummaryQuery,
  useGetProjectsQuery,
  useUpdateProjectMutation
} from "../../store/api/apiSlice";
import { formatDate, classNames } from "../../utils/format";

const PIPELINE_STEPS = [
  { id: "Planning", label: "Planning", step: 1 },
  { id: "Requirements", label: "Requirements", step: 2 },
  { id: "Development", label: "Development", step: 3 },
  { id: "Testing", label: "Testing", step: 4 },
  { id: "Client Review", label: "Client Review", step: 5 },
  { id: "Completed", label: "Completed", step: 6 },
];

export default function ProjectDashboard({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedStage, setSelectedStage] = useState(null);

  const { data: summaryWrapper, isLoading } = useGetProjectDashboardSummaryQuery();
  const { data: projectsData } = useGetProjectsQuery();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();

  const allProjects = projectsData?.data ?? projectsData ?? [];

  // Filter projects assigned to this PM (or all for admin)
  const assignedProjects = allProjects.filter((p) => {
    if (user?.role === "ADMIN") return true;
    const pmId = p.projectManager?._id || p.projectManager || p.manager;
    const currentUserId = user?.id || user?._id;
    return pmId && currentUserId && String(pmId) === String(currentUserId);
  });

  const getProjectStage = (p) => {
    if (p.stage && PIPELINE_STEPS.some((s) => s.id === p.stage)) return p.stage;
    if (p.status === "Completed") return "Completed";
    if (p.status === "Testing") return "Testing";
    if (p.status === "Active" || p.status === "Development") return "Development";
    if (p.status === "Requirements") return "Requirements";
    if (p.status === "Client Review") return "Client Review";
    return "Planning";
  };

  const stageCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STEPS.forEach((s) => { counts[s.id] = 0; });
    assignedProjects.forEach((p) => {
      const st = getProjectStage(p);
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [assignedProjects]);

  const summary = summaryWrapper?.data || summaryWrapper || {};
  const kpis = {
    ...summary.kpis,
    activeProjects: assignedProjects.filter((p) => p.status !== "Completed").length || summary.kpis?.activeProjects || 0,
    completedProjects: assignedProjects.filter((p) => p.status === "Completed" || p.stage === "Completed").length || summary.kpis?.completedProjects || 0,
  };

  const displayedProjects = selectedStage
    ? assignedProjects.filter((p) => getProjectStage(p) === selectedStage)
    : assignedProjects;

  const handleStageChange = async (project, newStage) => {
    const pId = project.id || project._id;
    try {
      await updateProject({
        id: pId,
        stage: newStage,
        status: newStage === "Completed" ? "Completed" : "Active",
      }).unwrap();
      toast?.push(`"${project.name}" moved to ${newStage} stage`, "success");
    } catch {
      toast?.push("Failed to update project stage", "error");
    }
  };

  const getNextStage = (currentStage) => {
    const idx = PIPELINE_STEPS.findIndex((s) => s.id === currentStage);
    if (idx >= 0 && idx < PIPELINE_STEPS.length - 1) {
      return PIPELINE_STEPS[idx + 1].id;
    }
    return null;
  };

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
              You are managing {kpis.activeProjects || 0} active projects across the delivery lifecycle.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading project data..." />
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="My Clients" value={kpis.myClients || 0} tone="primary" />
            <KpiCard title="Active Projects" value={kpis.activeProjects || 0} tone="primary" />
            <KpiCard title="Delayed Projects" value={kpis.delayedProjects || 0} tone="red" />
            <KpiCard title="Completed" value={kpis.completedProjects || 0} tone="green" />
          </div>

          {/* Project Pipeline Lifecycle Section */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Project Pipeline Lifecycle</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any stage to filter and advance projects across stages.
                </p>
              </div>

              {selectedStage && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-medium px-2.5 py-1 rounded-full border border-primary-200 dark:border-primary-800 flex items-center gap-1.5">
                    <Filter size={12} /> Filtered: <strong>{selectedStage}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedStage(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Pipeline Bar */}
            <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between w-full overflow-x-auto pt-2 pb-2 px-1">
                {PIPELINE_STEPS.map((step, idx) => {
                  const isSelected = selectedStage === step.id;
                  const count = stageCounts[step.id] || 0;
                  const hasProjects = count > 0;

                  return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none min-w-[110px]">
                      {/* Step Item */}
                      <button
                        type="button"
                        onClick={() => setSelectedStage(isSelected ? null : step.id)}
                        className="flex flex-col items-center group cursor-pointer focus:outline-none transition-transform hover:scale-105"
                        title={`Filter projects by ${step.label} (${count})`}
                      >
                        {/* Circle */}
                        <div className="relative">
                          <div
                            className={classNames(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-xs",
                              isSelected
                                ? "bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950 shadow-md scale-110"
                                : hasProjects
                                ? "bg-primary-500 text-white ring-2 ring-primary-200 dark:ring-primary-900"
                                : "bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700 group-hover:border-primary-300"
                            )}
                          >
                            {step.step}
                          </div>
                          {hasProjects && (
                            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900">
                              {count}
                            </span>
                          )}
                        </div>

                        {/* Label */}
                        <span
                          className={classNames(
                            "text-xs mt-2.5 whitespace-nowrap transition-colors",
                            isSelected
                              ? "text-primary-600 dark:text-primary-400 font-bold"
                              : hasProjects
                              ? "text-slate-800 dark:text-slate-100 font-semibold"
                              : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 font-medium"
                          )}
                        >
                          {step.label}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {count} {count === 1 ? "project" : "projects"}
                        </span>
                      </button>

                      {/* Connecting Track Line */}
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <div
                          className={classNames(
                            "flex-1 h-0.5 mx-2 -mt-10 transition-all duration-300",
                            hasProjects ? "bg-primary-300 dark:bg-primary-800" : "bg-slate-200 dark:bg-slate-700"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Stage Projects & Quick Transition Manager */}
            <div className="mt-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers size={15} className="text-primary-500" />
                  {selectedStage ? `Projects in "${selectedStage}" Stage` : "Active Pipeline Projects"}
                  <span className="text-xs font-normal text-slate-400">({displayedProjects.length})</span>
                </h3>
              </div>

              {displayedProjects.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No projects currently in {selectedStage || "this"} stage.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select another stage above or advance an active project to this phase.
                  </p>
                  {selectedStage && (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => setSelectedStage(null)}>
                      Show All Projects
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedProjects.map((p) => {
                    const pId = p.id || p._id;
                    const curStage = getProjectStage(p);
                    const nextStage = getNextStage(curStage);

                    return (
                      <Card
                        key={pId}
                        className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200/80 dark:border-slate-700"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
                              {curStage}
                            </span>
                            <Badge tone={p.priority === "Critical" ? "red" : p.priority === "High" ? "amber" : "blue"}>
                              {p.priority || "Medium"}
                            </Badge>
                          </div>

                          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {p.clientName || "Direct Client"} {p.notes ? `· ${p.notes}` : ""}
                          </p>

                          {/* Stage Transition Selector */}
                          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                              Change Lifecycle Stage
                            </label>
                            <select
                              value={curStage}
                              onChange={(e) => handleStageChange(p, e.target.value)}
                              disabled={isUpdating}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-hidden focus:border-primary-500 cursor-pointer"
                            >
                              {PIPELINE_STEPS.map((s) => (
                                <option key={s.id} value={s.id}>
                                  Step {s.step}: {s.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Footer & Actions */}
                        <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} /> {p.deadline ? formatDate(p.deadline) : "No deadline"}
                          </span>

                          <div className="flex items-center gap-2">
                            {nextStage && (
                              <button
                                type="button"
                                onClick={() => handleStageChange(p, nextStage)}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer"
                                title={`Advance to ${nextStage}`}
                              >
                                {nextStage} <ChevronRight size={12} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => navigate(`/projects/${pId}`)}
                              className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 font-semibold p-1 hover:underline flex items-center gap-0.5 cursor-pointer"
                              title="View Project Details"
                            >
                              Details <ExternalLink size={12} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
