import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Badge, Avatar, Select, Button, EmptyState, LoadingState, useToast, ConfirmDialog,
} from "../../components/common";
import TaskFormModal from "../../components/projects/TaskFormModal";
import { formatDate, classNames } from "../../utils/format";
import {
  useGetProjectsQuery,
  useGetUsersQuery,
  useGetProjectTasksQuery,
  useCreateProjectTaskMutation,
  useUpdateProjectTaskMutation,
  useDeleteProjectTaskMutation,
} from "../../store/api/apiSlice";

const EMPTY = [];
const COLUMNS = [
  { key: "TODO", label: "To Do" },
  { key: "IN PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
];
const priorityTone = { Low: "slate", Medium: "blue", High: "amber", Urgent: "red" };

function TaskCard({ task, onEdit, onDelete }) {
  const isOverdue = task.status !== "COMPLETED" && task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 shadow-sm group">
      <div className="flex justify-between items-start gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{task.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(task)} className="p-1 text-slate-400 hover:text-primary-500 rounded" title="Edit">
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(task)} className="p-1 text-slate-400 hover:text-red-500 rounded" title="Delete">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <Badge tone={priorityTone[task.priority] || "slate"}>{task.priority}</Badge>
        <span className={classNames(
          "flex items-center gap-1 text-[11px] font-medium",
          isOverdue ? "text-red-500" : "text-slate-400 dark:text-slate-500"
        )}>
          {isOverdue ? <AlertTriangle size={11} /> : <Clock size={11} />}
          {formatDate(task.dueDate)}
        </span>
      </div>
      {task.assignedToName && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-50 dark:border-slate-700/60">
          <Avatar name={task.assignedToName} size="sm" className="h-5 w-5 text-[9px]" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{task.assignedToName}</span>
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const toast = useToast();
  const { data: projectsData, isLoading: loadingProjects } = useGetProjectsQuery();
  const { data: usersData } = useGetUsersQuery();
  const projects = projectsData?.data ?? EMPTY;
  const users = usersData?.data ?? EMPTY;

  const [projectId, setProjectId] = useState("");
  useEffect(() => {
    if (!projectId && projects.length > 0) setProjectId(projects[0].id);
  }, [projects, projectId]);

  const { data: tasksData, isLoading: loadingTasks } = useGetProjectTasksQuery(projectId, { skip: !projectId });
  const tasks = tasksData?.data ?? EMPTY;

  const [createTask, { isLoading: creating }] = useCreateProjectTaskMutation();
  const [updateTask, { isLoading: updating }] = useUpdateProjectTaskMutation();
  const [deleteTask] = useDeleteProjectTaskMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const byColumn = useMemo(() => {
    const grouped = { TODO: [], "IN PROGRESS": [], COMPLETED: [] };
    tasks.forEach((t) => { (grouped[t.status] || grouped.TODO).push(t); });
    return grouped;
  }, [tasks]);

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await updateTask({ projectId, taskId: editing.id, ...payload }).unwrap();
        toast?.push("Task updated");
      } else {
        await createTask({ projectId, ...payload }).unwrap();
        toast?.push("Task created");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to save task", "error");
    }
  };

  const handleStatusChange = async (task, status) => {
    try {
      await updateTask({ projectId, taskId: task.id, status }).unwrap();
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to update status", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask({ projectId, taskId: deleteTarget.id }).unwrap();
      toast?.push("Task deleted", "info");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to delete task", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Break down each project into trackable, assignable work"
        action={
          <Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }} disabled={!projectId}>
            Add Task
          </Button>
        }
      />

      <div className="mb-5 max-w-xs">
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {projects.length === 0 && <option value="">No projects yet</option>}
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      {loadingProjects ? (
        <LoadingState label="Loading projects..." />
      ) : projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Create a project first, then break it down into tasks." />
      ) : loadingTasks ? (
        <LoadingState label="Loading tasks..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <Card key={col.key} padding="p-3" className="bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between px-1 mb-3">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  {col.key === "COMPLETED" && <CheckCircle2 size={14} className="text-emerald-500" />}
                  {col.label}
                </h4>
                <span className="text-xs font-medium bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500">
                  {byColumn[col.key].length}
                </span>
              </div>
              <div className="flex flex-col gap-2.5 min-h-[80px]">
                {byColumn[col.key].length === 0 ? (
                  <div className="h-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-xs text-slate-400">
                    No tasks
                  </div>
                ) : (
                  byColumn[col.key].map((task) => (
                    <div key={task.id}>
                      <TaskCard
                        task={task}
                        onEdit={(t) => { setEditing(t); setModalOpen(true); }}
                        onDelete={setDeleteTarget}
                      />
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        className="mt-1 w-full text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-500 dark:text-slate-400"
                      >
                        <option value="TODO">Move to To Do</option>
                        <option value="IN PROGRESS">Move to In Progress</option>
                        <option value="COMPLETED">Move to Completed</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <TaskFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        users={users}
        saving={creating || updating}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete task?"
        description={`"${deleteTarget?.title}" will be permanently removed.`}
      />
    </div>
  );
}
