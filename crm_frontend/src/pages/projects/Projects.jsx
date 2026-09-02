import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2, Calendar, LayoutGrid, List, ExternalLink } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Badge, SearchBar, FilterSelect, Button, ActionsMenu, ConfirmDialog,
  EmptyState, ProgressBar, Avatar, useToast, LoadingState
} from "../../components/common";
import ProjectFormModal from "../../components/projects/ProjectFormModal";
import { projectStatuses } from "../../services/mockData";
import { formatDate, classNames } from "../../utils/format";
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetUsersQuery,
  useGetClientsQuery,
} from "../../store/api/apiSlice";

const priorityTone = { Low: "slate", Medium: "blue", High: "amber", Critical: "red" };

export default function Projects() {
  const navigate = useNavigate();
  const toast = useToast();
  
  // RTK Query Hooks
  const { data: projectsData, isLoading } = useGetProjectsQuery();
  const { data: usersData } = useGetUsersQuery();
  const { data: clientsData } = useGetClientsQuery();
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const projects = projectsData?.data ?? projectsData ?? [];
  const users = usersData?.data ?? usersData ?? [];
  const clients = clientsData?.data ?? clientsData ?? [];

  const getManagerName = (p) => {
    if (!p) return "Unassigned";
    if (typeof p === "object") {
      if (p.managerName && p.managerName !== "Unassigned") return p.managerName;
      if (p.projectManager?.name) return p.projectManager.name;
      const pmId = p.projectManager?._id || p.projectManager || p.manager;
      if (pmId) {
        const found = users.find((u) => String(u.id || u._id) === String(pmId));
        if (found?.name) return found.name;
      }
      return "Unassigned";
    }
    const found = users.find((u) => String(u.id || u._id) === String(p));
    return found?.name || "Unassigned";
  };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = !search || 
        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) || 
        (p.clientName && p.clientName.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const handleSave = async (project) => {
    try {
      const targetId = editing?.id || editing?._id || project.id || project._id;
      if (editing && targetId) {
        await updateProject({ id: targetId, ...project }).unwrap();
        toast?.push("Project updated successfully");
      } else {
        await createProject(project).unwrap();
        toast?.push("Project created successfully");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving project", "error");
    }
  };

  const handleDelete = async () => {
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

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${filtered.length} projects in delivery`}
        action={<Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>New Project</Button>}
      />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by project or client..." className="flex-1" />
          <div className="flex gap-3">
            <FilterSelect value={statusFilter} onChange={setStatusFilter} options={projectStatuses} label="All Statuses" />
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 shrink-0">
              <button onClick={() => setView("grid")} className={classNames("p-2 rounded-md", view === "grid" ? "bg-primary-500 text-white" : "text-slate-400")}>
                <LayoutGrid size={16} />
              </button>
              <button onClick={() => setView("list")} className={classNames("p-2 rounded-md", view === "list" ? "bg-primary-500 text-white" : "text-slate-400")}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading projects..." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No projects found" description="Try adjusting your search or filters." />
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const pId = p.id || p._id;
              return (
                <div
                  key={pId}
                  onClick={() => navigate(`/projects/${pId}`)}
                  className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between bg-white dark:bg-slate-800"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge tone={p.status === "Active" ? "primary" : p.status === "Completed" ? "green" : "amber"}>
                        {p.status || "Active"}
                      </Badge>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Badge tone={priorityTone[p.priority] || "amber"}>
                          {p.priority || "Medium"}
                        </Badge>
                        <ActionsMenu
                          actions={[
                            { label: "View Project", icon: Eye, onClick: () => navigate(`/projects/${pId}`) },
                            { label: "Edit Project", icon: Pencil, onClick: () => { setEditing(p); setModalOpen(true); } },
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
                      {p.clientName || "Direct Client"} {p.notes ? `· ${p.notes}` : ""}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> {p.deadline ? formatDate(p.deadline) : "No deadline"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${pId}`);
                      }}
                      className="text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Details <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-50">
            {filtered.map((p) => {
              const pId = p.id || p._id;
              return (
                <div
                  key={pId}
                  onClick={() => navigate(`/projects/${pId}`)}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 cursor-pointer hover:bg-primary-50/30 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.clientName} {p.notes ? `· ${p.notes}` : ""}</p>
                  </div>
                  <Badge tone={p.status === "Active" ? "primary" : "green"}>{p.status}</Badge>
                  <Badge tone={priorityTone[p.priority] || "amber"}>{p.priority || "Medium"}</Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12} /> {formatDate(p.deadline)}</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionsMenu
                      actions={[
                        { label: "View Project", icon: Eye, onClick: () => navigate(`/projects/${pId}`) },
                        { label: "Edit Project", icon: Pencil, onClick: () => { setEditing(p); setModalOpen(true); } },
                        { divider: true },
                        { label: "Delete Project", icon: Trash2, danger: true, onClick: () => setDeleteTarget(p) },
                      ]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <ProjectFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        clients={clients}
        users={users}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.name}?`}
        description="All tasks and documents linked to this project will also be affected."
      />
    </div>
  );
}
