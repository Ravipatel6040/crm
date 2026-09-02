import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  Users, Trophy, PhoneCall, Handshake, Target, ArrowRight, Sparkles, Plus, Clock, FileText, CheckCircle2, XCircle, TrendingUp, FolderPlus,
  FolderKanban, Calendar, Eye, Pencil, Trash2, Paperclip
} from "lucide-react";
import { PipelineChart, LeadSourceChart } from "../../components/dashboard/Charts";
import KpiCard from "../../components/dashboard/KpiCard";
import { Card, Badge, Avatar, Button, LoadingState, EmptyState, ActionsMenu, ConfirmDialog, useToast } from "../../components/common";
import LeadFormModal from "../../components/leads/LeadFormModal";
import ProjectFormModal from "../../components/projects/ProjectFormModal";
import { ROLE_LABELS } from "../../constants/roles";
import { formatCompactCurrency, formatDate } from "../../utils/format";
import {
  useGetSalesDashboardSummaryQuery, useGetLeadSourcesSummaryQuery,
  useCreateLeadMutation, useGetUsersQuery, useGetProjectsQuery,
  useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation,
  useGetClientsQuery
} from "../../store/api/apiSlice";

export default function SalesDashboard({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [createLead] = useCreateLeadMutation();
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const { data: usersData } = useGetUsersQuery();
  const users = usersData?.data ?? usersData ?? [];
  const { data: clientsData } = useGetClientsQuery();
  const clients = clientsData?.data ?? clientsData ?? [];
  const { data: projectsData } = useGetProjectsQuery();
  const projects = projectsData?.data ?? projectsData ?? [];

  const { data: summaryWrapper, isLoading: loadingSummary } = useGetSalesDashboardSummaryQuery();
  const { data: leadSourceWrapper } = useGetLeadSourcesSummaryQuery();

  const summary = summaryWrapper?.data || summaryWrapper || {};
  const leads = summary.leads || {};
  const revenue = summary.revenue || 0;
  const followUps = summary.followUps || [];
  
  const leadSourceData = leadSourceWrapper?.data ?? leadSourceWrapper ?? [];

  const handleSaveLead = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        source: formData.source || "Website",
        budget: Number(formData.budget) || 0,
        assignedTo: formData.assignedTo || user?.id || user?._id,
        status: formData.status || "New",
        interestedIn: formData.interestedIn,
        nextFollowUp: formData.nextFollowUp || undefined,
        notes: formData.notes,
      };
      await createLead(payload).unwrap();
      toast?.push("Lead added successfully");
      setIsAddLeadOpen(false);
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving lead", "error");
    }
  };

  const handleSaveProject = async (projectData) => {
    try {
      const targetId = editingProject?.id || editingProject?._id || projectData?.id || projectData?._id;
      if (editingProject && targetId) {
        await updateProject({ id: targetId, ...projectData }).unwrap();
        toast?.push("Project updated successfully");
        setEditingProject(null);
      } else {
        await createProject(projectData).unwrap();
        toast?.push("Project created and assigned to Project Manager!");
        setIsAddProjectOpen(false);
      }
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving project", "error");
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id || deleteTarget._id;
    try {
      await deleteProject(targetId).unwrap();
      toast?.push("Project deleted", "info");
      setDeleteTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error deleting project", "error");
    }
  };
  
  const pipelineSteps = [
    { key: "New", name: "New", count: leads.new || 0 },
    { key: "Contacted", name: "Contacted", count: leads.contacted || 0 },
    { key: "Follow-up", name: "Follow-up", count: leads.followUp || 0 },
    { key: "Proposal", name: "Proposal", count: leads.proposal || 0 },
    { key: "Negotiation", name: "Negotiation", count: leads.negotiation || 0 },
    { key: "Won", name: "Won", count: leads.won || 0 },
    { key: "Lost", name: "Lost", count: leads.lost || 0 },
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
              Good to see you, {user?.name ? user.name.split(" ")[0] : (user?.email ? user.email.split("@")[0] : "there")}.
            </h1>
            <p className="text-primary-100 text-sm mt-1.5 max-w-md">
              You have {leads.total || 0} leads assigned and {followUps.length} follow-ups scheduled for today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-white text-primary-700 px-3.5 py-2.5 text-sm font-semibold hover:bg-primary-50 transition-colors shadow-sm"
            >
              <Plus size={15} /> Add Lead
            </button>
            <button
              onClick={() => setIsAddProjectOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white px-3.5 py-2.5 text-sm font-semibold transition-colors shadow-sm backdrop-blur"
            >
              <FolderPlus size={15} /> New Project
            </button>
            <button onClick={() => navigate("/communication")} className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur px-3.5 py-2.5 text-sm font-medium transition-colors">
              <PhoneCall size={15} /> Log Call
            </button>
          </div>
        </div>
      </div>

      {loadingSummary ? (
        <LoadingState label="Loading your sales data..." />
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="My Leads" value={leads.total || 0} tone="primary" />
            <KpiCard title="Follow-ups" value={leads.followUp || 0} tone="amber" />
            <KpiCard title="Proposals" value={leads.proposal || 0} tone="primary" />
            <KpiCard title="Won Deals" value={leads.won || 0} tone="green" />
            <KpiCard title="Lost Deals" value={leads.lost || 0} tone="red" />
            <KpiCard title="Revenue" value={formatCompactCurrency(revenue || 0)} tone="green" />
          </div>

          {/* Lead Pipeline */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lead Pipeline</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Real-time status of your leads in the sales pipeline</p>
              </div>
              <button
                onClick={() => navigate("/leads")}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all leads →
              </button>
            </div>
            <Card className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 overflow-x-auto">
                {pipelineSteps.map((step, idx) => {
                  const hasLeads = step.count > 0;
                  return (
                    <div key={step.name} className="flex items-center gap-2 flex-1 min-w-[100px]">
                      <div
                        onClick={() => navigate("/leads")}
                        className="group flex flex-col items-center gap-2 w-full cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                            hasLeads
                              ? "bg-primary-500 text-white shadow-primary-500/30 ring-4 ring-primary-100 dark:ring-primary-950/60"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {step.count}
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block truncate">
                            {step.name}
                          </span>
                          <span className={`text-[11px] font-medium ${hasLeads ? "text-primary-600 dark:text-primary-400 font-semibold" : "text-slate-400"}`}>
                            {step.count} {step.count === 1 ? "lead" : "leads"}
                          </span>
                        </div>
                      </div>
                      {idx < pipelineSteps.length - 1 && (
                        <ArrowRight className="text-slate-300 dark:text-slate-700 mx-auto hidden sm:block shrink-0" size={16} />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="flex flex-col gap-6">
              {/* Sales Analytics */}
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-slate-800">Sales Analytics</h2>
                <LeadSourceChart data={leadSourceData} />
              </section>
            </div>

            {/* Today's Follow-ups */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Today's Follow-ups</h2>
              </div>
              <Card className="h-full max-h-[600px] overflow-y-auto">
                {followUps.length === 0 ? (
                  <EmptyState icon={Clock} title="No follow-ups today" description="Take a breather, you're all caught up!" />
                ) : (
                  <div className="flex flex-col gap-4">
                    {followUps.map((f, idx) => {
                      const time = new Date(f.nextFollowUp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={idx} className="flex gap-3 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                          <div className="text-xs font-bold text-slate-400 w-16 pt-1 shrink-0">
                            {time}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">{f.name}</p>
                            <p className="text-xs text-slate-500 mb-1.5">{f.company}</p>
                            <Badge tone="primary">Follow-up</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </section>
          </div>

          {/* Client Projects Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Client Projects</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-semibold">
                  {projects.length} Total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate("/projects")}>
                  View All Projects →
                </Button>
                <Button size="sm" icon={Plus} onClick={() => { setEditingProject(null); setIsAddProjectOpen(true); }}>
                  New Project
                </Button>
              </div>
            </div>

            {projects.length === 0 ? (
              <Card className="p-8">
                <EmptyState
                  icon={FolderKanban}
                  title="No projects created yet"
                  description="Create a project to assign deliverables and documents to a Project Manager."
                  action={
                    <Button size="sm" icon={FolderPlus} onClick={() => { setEditingProject(null); setIsAddProjectOpen(true); }}>
                      Create Project
                    </Button>
                  }
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.slice(0, 6).map((p) => {
                  const pId = p.id || p._id;
                  const docCount = p.documents?.length || 0;
                  return (
                    <Card
                      key={pId}
                      className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge tone={p.status === "Active" ? "primary" : p.status === "Completed" ? "green" : "amber"}>
                              {p.status || "Active"}
                            </Badge>
                            <Badge tone={p.priority === "Critical" ? "red" : p.priority === "High" ? "amber" : "blue"}>
                              {p.priority || "Medium"}
                            </Badge>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <ActionsMenu
                              actions={[
                                { label: "View Project", icon: Eye, onClick: () => navigate(`/projects/${pId}`) },
                                { label: "Edit Project", icon: Pencil, onClick: () => { setEditingProject(p); } },
                                { divider: true },
                                { label: "Delete Project", icon: Trash2, danger: true, onClick: () => setDeleteTarget(p) },
                              ]}
                            />
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          Client: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.clientName || "Direct Client"}</span>
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                          <Avatar name={p.managerName || "PM"} size="xs" />
                          <span className="truncate">PM: <strong className="text-slate-700 dark:text-slate-200">{p.managerName || "Assigned"}</strong></span>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 text-xs text-slate-400 min-w-0">
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar size={12} /> {p.deadline ? formatDate(p.deadline) : "No deadline"}
                          </span>
                          {docCount > 0 ? (
                            <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium shrink-0">
                              <Paperclip size={12} /> {docCount} {docCount === 1 ? "doc" : "docs"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 shrink-0">No docs</span>
                          )}
                        </div>

                        {/* Direct Edit and Delete Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setEditingProject(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors shadow-2xs cursor-pointer"
                            title="Edit Project"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors shadow-2xs cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <LeadFormModal
        open={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSave={handleSaveLead}
        users={users}
      />

      <ProjectFormModal
        open={isAddProjectOpen || !!editingProject}
        onClose={() => { setIsAddProjectOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
        initial={editingProject}
        clients={clients}
        users={users}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProject}
        title={`Delete ${deleteTarget?.name}?`}
        description="Are you sure you want to delete this project? All associated tasks and documents will also be removed."
      />
    </div>
  );
}
