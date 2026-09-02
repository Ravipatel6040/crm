import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2, Calendar, LayoutGrid, List } from "lucide-react";
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

  const managerName = (id) => {
    return users.find((u) => u.id === id)?.name || "Unassigned";
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
      if (editing) {
        await updateProject({ id: project.id, ...project }).unwrap();
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
    try {
      await deleteProject(deleteTarget.id).unwrap();
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
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="border border-slate-100 rounded-2xl p-4 hover:shadow-popover hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-700 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 truncate">{p.clientName}</p>
                  </div>
                  <ActionsMenu
                    actions={[
                      { label: "View Project", icon: Eye, onClick: () => navigate(`/projects/${p.id}`) },
                      { label: "Edit Project", icon: Pencil, onClick: () => { setEditing(p); setModalOpen(true); } },
                      { divider: true },
                      { label: "Delete Project", icon: Trash2, danger: true, onClick: () => setDeleteTarget(p) },
                    ]}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{p.status}</Badge>
                  <Badge tone={priorityTone[p.priority]}>{p.priority}</Badge>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progress</span><span>{p.progress || 0}%</span>
                  </div>
                  <ProgressBar value={p.progress || 0} tone={p.progress === 100 ? "green" : "primary"} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-50">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(p.deadline)}</span>
                  <span>{p.tasks?.done || 0}/{p.tasks?.total || 0} tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Avatar name={managerName(p.manager)} size="sm" />
                  <span className="text-xs text-slate-500">{managerName(p.manager)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-50">
            {filtered.map((p) => (
              <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 cursor-pointer hover:bg-primary-50/30 -mx-2 px-2 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.clientName} · {managerName(p.manager)}</p>
                </div>
                <div className="w-full sm:w-40">
                  <ProgressBar value={p.progress || 0} />
                </div>
                <Badge>{p.status}</Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12} /> {formatDate(p.deadline)}</span>
              </div>
            ))}
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
