import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, FileText, CheckCircle2, Circle, ExternalLink,
  Download, User, Building2, Clock, Plus, ShieldCheck, Mail, Phone, Paperclip, Eye,
  ChevronRight, Sparkles, ArrowRight
} from "lucide-react";
import { Card, Badge, Avatar, Tabs, ProgressBar, Button, EmptyState, LoadingState, useToast, PdfViewerModal } from "../../components/common";
import { formatDate, classNames } from "../../utils/format";
import {
  useGetProjectQuery,
  useUpdateProjectMutation,
  useGetUsersQuery,
  useGetClientsQuery
} from "../../store/api/apiSlice";
import { projects as mockProjects, documents as mockDocs, activityLogs } from "../../services/mockData";

const TABS = ["Overview", "Documents", "Activity"];
const priorityTone = { Low: "slate", Medium: "blue", High: "amber", Critical: "red" };

const PIPELINE_STEPS = [
  { id: "Planning", label: "Planning", step: 1 },
  { id: "Requirements", label: "Requirements", step: 2 },
  { id: "Development", label: "Development", step: 3 },
  { id: "Testing", label: "Testing", step: 4 },
  { id: "Client Review", label: "Client Review", step: 5 },
  { id: "Completed", label: "Completed", step: 6 },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("Overview");
  const [viewingDoc, setViewingDoc] = useState(null);
  const { data: projectData, isLoading: loadingProject } = useGetProjectQuery(id);
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const { data: usersData } = useGetUsersQuery();
  const { data: clientsData } = useGetClientsQuery();

  const users = usersData?.data ?? usersData ?? [];
  const clients = clientsData?.data ?? clientsData ?? [];

  // Resolve API project or fallback to mock
  const apiProject = projectData?.data ?? projectData;
  const project = apiProject || mockProjects.find((p) => String(p.id) === String(id) || String(p._id) === String(id));



  if (loadingProject) {
    return <LoadingState label="Loading project details..." />;
  }

  if (!project && !loadingProject) {
    return (
      <EmptyState
        title="Project not found"
        description="The requested project could not be found or may have been deleted."
        action={<Button onClick={() => navigate("/projects")}>Back to Projects</Button>}
      />
    );
  }

  // Resolve Client
  const clientObj = clients.find((c) => String(c.id || c._id) === String(project.client?._id || project.client)) || project.client;
  const clientName = project.clientName || clientObj?.company || clientObj?.name || "Direct Client";

  // Resolve PM
  const pmId = project.projectManager?._id || project.projectManager || project.manager;
  const pmObj = project.projectManagerObj || users.find((u) => String(u.id || u._id) === String(pmId));
  const pmName = project.managerName && project.managerName !== "Unassigned" ? project.managerName : (pmObj?.name || "Unassigned");
  const pmEmail = pmObj?.email || project.projectManager?.email || "—";
  const pmRole = pmObj?.role || "Project Manager";

  // Resolve Documents
  const projectDocs = project.documents?.length > 0
    ? project.documents
    : (mockDocs.filter((d) => String(d.project) === String(id)));

  const getProjectStage = (p) => {
    if (p?.stage && PIPELINE_STEPS.some((s) => s.id === p.stage)) return p.stage;
    if (p?.status === "Completed") return "Completed";
    if (p?.status === "Testing") return "Testing";
    if (p?.status === "Active" || p?.status === "Development") return "Development";
    if (p?.status === "Requirements") return "Requirements";
    if (p?.status === "Client Review") return "Client Review";
    return "Planning";
  };

  const currentStage = getProjectStage(project);
  const currentIdx = PIPELINE_STEPS.findIndex((s) => s.id === currentStage);
  const nextStage = currentIdx >= 0 && currentIdx < PIPELINE_STEPS.length - 1
    ? PIPELINE_STEPS[currentIdx + 1].id
    : null;

  const handleStageChange = async (newStage) => {
    const pId = project.id || project._id;
    try {
      await updateProject({
        id: pId,
        stage: newStage,
        status: newStage === "Completed" ? "Completed" : "Active",
      }).unwrap();
      toast?.push(`Project moved to ${newStage} stage`, "success");
    } catch {
      toast?.push("Failed to update project stage", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Back Link */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{project.name}</h1>
            <Badge tone={project.status === "Active" ? "primary" : project.status === "Completed" ? "green" : "amber"}>
              {project.status || "Active"}
            </Badge>
            <Badge tone={priorityTone[project.priority]}>{project.priority || "Medium"}</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Client: <span className="font-semibold text-slate-700 dark:text-slate-300">{clientName}</span> · ID: <span className="font-mono text-xs">{project.id || project._id}</span>
          </p>
        </div>

        {/* Assigned PM Badge Card */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-2xs">
          <Avatar name={pmName} size="md" />
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned PM</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{pmName}</p>
            <p className="text-xs text-slate-500">{pmEmail}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="p-4">
          <p className="text-xs text-slate-400 font-medium">Start Date</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1.5">
            <Calendar size={14} className="text-primary-500" /> {formatDate(project.startDate || project.createdAt || new Date())}
          </p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400 font-medium">Deadline</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1.5">
            <Calendar size={14} className="text-amber-500" /> {project.deadline ? formatDate(project.deadline) : "Not Set"}
          </p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-400 font-medium">Attached Documents</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1.5">
            <Paperclip size={14} className="text-primary-500" /> {projectDocs.length} {projectDocs.length === 1 ? "file" : "files"}
          </p>
        </Card>
      </div>

      {/* Interactive Project Pipeline Lifecycle */}
      <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={16} className="text-primary-500" />
              Project Pipeline Lifecycle
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 font-semibold border border-primary-200 dark:border-primary-800">
                Current: {currentStage}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Click any stage or advance the project to update the active delivery phase.
            </p>
          </div>

          {nextStage && (
            <Button
              size="sm"
              icon={ChevronRight}
              onClick={() => handleStageChange(nextStage)}
              disabled={isUpdating}
            >
              Advance to {nextStage}
            </Button>
          )}
        </div>

        {/* Clean Timeline Stepper Bar */}
        <div className="flex items-center justify-between w-full overflow-x-auto pt-2 pb-2 px-1">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCurrent = currentStage === step.id;
            const currentIdx = PIPELINE_STEPS.findIndex((s) => s.id === currentStage);
            const isPast = idx < currentIdx;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none min-w-[110px]">
                {/* Step Item */}
                <button
                  type="button"
                  onClick={() => handleStageChange(step.id)}
                  disabled={isUpdating}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none transition-transform hover:scale-105"
                  title={`Set stage to ${step.label}`}
                >
                  {/* Circle */}
                  <div
                    className={classNames(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-xs",
                      isCurrent
                        ? "bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950 shadow-md scale-110"
                        : isPast
                        ? "bg-emerald-500 text-white ring-2 ring-emerald-100 dark:ring-emerald-950"
                        : "bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700 group-hover:border-primary-300"
                    )}
                  >
                    {isPast ? <CheckCircle2 size={20} className="stroke-[2.5]" /> : step.step}
                  </div>

                  {/* Label */}
                  <span
                    className={classNames(
                      "text-xs mt-2.5 whitespace-nowrap transition-colors",
                      isCurrent
                        ? "text-primary-600 dark:text-primary-400 font-bold"
                        : isPast
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 font-medium"
                    )}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connecting Track Line */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={classNames(
                      "flex-1 h-0.5 mx-2 -mt-6 transition-all duration-300",
                      idx < currentIdx ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabs View */}
      <Card padding="p-0">
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {tab === "Overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
              {/* Left Column: Project Scope & Information */}
              <div className="flex flex-col gap-5">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Project Specifications</h4>
                  <div className="flex flex-col gap-3 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Project Name</span>
                      <span className="font-semibold">{project.name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Client / Company</span>
                      <span className="font-semibold">{clientName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Assigned Project Manager</span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">{pmName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Created / Handed Over By</span>
                      <span className="font-semibold">{project.createdByName || "BDE / Sales"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Priority Level</span>
                      <Badge tone={priorityTone[project.priority]}>{project.priority || "Medium"}</Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Delivery Status</span>
                      <Badge tone={project.status === "Active" ? "primary" : "green"}>{project.status || "Active"}</Badge>
                    </div>
                    {project.link && (
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">Live URL / Repo</span>
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:underline font-semibold flex items-center gap-1 truncate max-w-[240px]"
                        >
                          {project.link} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scope & Notes */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Scope Notes & Description</h4>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                    {project.notes || project.description || "No specific scope notes entered. Please refer to the attached documents in the Documents tab."}
                  </div>
                </div>
              </div>

              {/* Right Column: Contact & Quick Links */}
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Client Contact Information</h4>
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center font-bold">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{clientName}</p>
                        <p className="text-xs text-slate-400">{clientObj?.email || "directclient@crm.com"}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400">
                      {clientObj?.phone && (
                        <p className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> {clientObj.phone}</p>
                      )}
                      <p className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> {clientObj?.email || "No email on record"}</p>
                    </div>
                  </div>
                </div>

                {/* Attached Docs Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Attached Scope Documents</h4>
                    <button onClick={() => setTab("Documents")} className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                      View all ({projectDocs.length}) →
                    </button>
                  </div>
                  {projectDocs.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                      No documents attached during handover.
                    </div>
                  ) : (
                      <div className="flex flex-col gap-2">
                        {projectDocs.slice(0, 3).map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            <div
                              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                              onClick={() => setViewingDoc(doc)}
                            >
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800 uppercase">
                                {doc.type || "DOC"}
                              </span>
                              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate hover:text-primary-600 transition-colors">{doc.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-slate-400">{doc.size || "PDF"}</span>
                              <button
                                onClick={() => setViewingDoc(doc)}
                                className="p-1 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
                                title="View PDF"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS (PDF / DOC SECTION) */}
          {tab === "Documents" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Project Scope & Specification Documents</h3>
                  <p className="text-xs text-slate-500">Documents and specifications handed over by BD/Sales for project execution.</p>
                </div>
              </div>

              {projectDocs.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents uploaded yet"
                  description="BD/Sales can attach PDF and DOC specifications when creating or editing this project."
                />
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 transition-all bg-white dark:bg-slate-800/80 shadow-2xs group"
                      >
                        <div
                          className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                          onClick={() => setViewingDoc(doc)}
                        >
                          <div className="h-11 w-11 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform">
                            {doc.type === "PDF" ? "PDF" : "DOC"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {doc.name}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {doc.size || "530 KB"} · Uploaded {doc.uploadedAt ? formatDate(doc.uploadedAt) : "with project handover"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            icon={Eye}
                            onClick={() => setViewingDoc(doc)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Download}
                            onClick={() => setViewingDoc(doc)}
                            title="Download PDF"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
              )}
            </div>
          )}





          {/* TAB 5: ACTIVITY */}
          {tab === "Activity" && (
            <div className="relative pl-5 border-l-2 border-slate-200 dark:border-slate-700 flex flex-col gap-6">
              <div className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-primary-50 dark:ring-primary-950" />
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-bold">{project.createdByName || "BDE/Sales"}</span> — Project created and assigned to Project Manager ({pmName}).
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{project.createdAt ? formatDate(project.createdAt) : "Recently"}</p>
              </div>
              {activityLogs.slice(0, 3).map((a) => (
                <div key={a.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-slate-100 dark:ring-slate-800" />
                  <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-semibold">{a.user}</span> — {a.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.date} · {a.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <PdfViewerModal
        open={Boolean(viewingDoc)}
        onClose={() => setViewingDoc(null)}
        doc={viewingDoc}
        project={project}
      />
    </div>
  );
}
