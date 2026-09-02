import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Plus, Search, CheckCircle2, Circle, Clock,
  AlertCircle, ShieldCheck, Tag, Trash2, Edit3, Filter, Layers
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Badge, Button, Modal, Field, Input, Select, Textarea,
  EmptyState, useToast
} from "../../components/common";
import {
  useGetProjectsQuery,
  useGetRequirementsQuery,
  useCreateRequirementMutation,
  useUpdateRequirementMutation,
  useDeleteRequirementMutation,
} from "../../store/api/apiSlice";
import { classNames } from "../../utils/format";

const DEFAULT_REQUIREMENTS = [
  {
    id: "REQ-001",
    title: "Role-Based Access Control (RBAC)",
    description: "System must support distinct permissions for Admin, BD/Sales, Marketing, Project Manager, and Finance roles.",
    project: "PRJ-001",
    projectName: "Enterprise CRM Platform",
    category: "Security",
    priority: "Critical",
    status: "Approved",
    completed: true,
  },
  {
    id: "REQ-002",
    title: "Real-time Notification Sound Alert",
    description: "Synthesize crisp audio chimes using Web Audio API on new notifications and follow-up reminders.",
    project: "PRJ-001",
    projectName: "Enterprise CRM Platform",
    category: "Feature",
    priority: "High",
    status: "Approved",
    completed: true,
  },
  {
    id: "REQ-003",
    title: "Payment Gateway Webhook Sync",
    description: "Automatic reconciliation of incoming payments via Stripe / Razorpay webhooks.",
    project: "PRJ-001",
    projectName: "Enterprise CRM Platform",
    category: "Integration",
    priority: "High",
    status: "In Progress",
    completed: false,
  },
  {
    id: "REQ-004",
    title: "Cross-Device Responsive Dashboard",
    description: "Interface must adapt seamlessly between desktop, tablet, and mobile breakpoints without UI breakage.",
    project: "PRJ-002",
    projectName: "Mobile App Redesign",
    category: "UI/UX",
    priority: "Medium",
    status: "In Progress",
    completed: false,
  },
  {
    id: "REQ-005",
    title: "Data Export in CSV and PDF",
    description: "Allow project managers and finance teams to export reports and pipeline data to CSV and PDF.",
    project: "PRJ-002",
    projectName: "Mobile App Redesign",
    category: "Reporting",
    priority: "Low",
    status: "Pending Review",
    completed: false,
  },
];

const priorityTone = {
  Critical: "red",
  High: "amber",
  Medium: "blue",
  Low: "slate",
};

const statusTone = {
  Approved: "green",
  "In Progress": "primary",
  "Pending Review": "amber",
  Rejected: "red",
};

export default function Requirements() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: projectsData } = useGetProjectsQuery();
  const projects = projectsData?.data ?? projectsData ?? [];

  const { data: apiReqsData } = useGetRequirementsQuery();
  const [createReq] = useCreateRequirementMutation();
  const [updateReq] = useUpdateRequirementMutation();
  const [deleteReq] = useDeleteRequirementMutation();

  const apiReqs = apiReqsData?.data ?? apiReqsData;

  const [localRequirements, setLocalRequirements] = useState(() => {
    try {
      const saved = localStorage.getItem("crm_requirements_list");
      return saved ? JSON.parse(saved) : DEFAULT_REQUIREMENTS;
    } catch (e) {
      return DEFAULT_REQUIREMENTS;
    }
  });

  const requirements = (apiReqs && apiReqs.length > 0) ? apiReqs : localRequirements;

  useEffect(() => {
    try {
      localStorage.setItem("crm_requirements_list", JSON.stringify(requirements));
    } catch (e) {}
  }, [requirements]);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [category, setCategory] = useState("Feature");
  const [priority, setPriority] = useState("High");
  const [status, setStatus] = useState("In Progress");
  const [description, setDescription] = useState("");

  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle("");
    setProjectName(projects[0]?.name || "Enterprise CRM Platform");
    setCategory("Feature");
    setPriority("High");
    setStatus("In Progress");
    setDescription("");
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setTitle(item.title);
    setProjectName(item.projectName);
    setCategory(item.category || "Feature");
    setPriority(item.priority || "High");
    setStatus(item.status || "In Progress");
    setDescription(item.description || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast?.push("Please enter requirement title", "error");
      return;
    }

    const selectedProj = projects.find(
      (p) => p.name === projectName || (p.id || p._id) === projectName
    );

    const payload = {
      title,
      projectName: selectedProj?.name || projectName,
      project: selectedProj?.id || selectedProj?._id || null,
      category,
      priority,
      status,
      completed: status === "Approved",
      description,
    };

    try {
      if (editingItem) {
        await updateReq({ id: editingItem.id || editingItem._id, ...payload }).unwrap();
        toast?.push("Requirement updated successfully");
      } else {
        await createReq(payload).unwrap();
        toast?.push("Requirement added and assigned successfully");
      }
    } catch (e) {
      // Local fallback
      if (editingItem) {
        setLocalRequirements((prev) =>
          prev.map((r) =>
            (r.id === editingItem.id || r._id === editingItem._id)
              ? { ...r, ...payload }
              : r
          )
        );
        toast?.push("Requirement updated successfully");
      } else {
        const newReq = {
          id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
          ...payload,
        };
        setLocalRequirements((prev) => [newReq, ...prev]);
        toast?.push("Requirement added successfully");
      }
    }
    setModalOpen(false);
  };

  const handleToggleDone = async (item) => {
    const nextDone = !item.completed;
    try {
      await updateReq({
        id: item.id || item._id,
        completed: nextDone,
        status: nextDone ? "Approved" : "In Progress",
      }).unwrap();
    } catch (e) {
      setLocalRequirements((prev) =>
        prev.map((r) => {
          if (r.id === item.id || r._id === item._id) {
            return {
              ...r,
              completed: nextDone,
              status: nextDone ? "Approved" : "In Progress",
            };
          }
          return r;
        })
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReq(id).unwrap();
      toast?.push("Requirement removed");
    } catch (e) {
      setLocalRequirements((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      toast?.push("Requirement removed");
    }
  };

  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      if (priorityFilter && r.priority !== priorityFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (projectFilter && r.projectName !== projectFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = r.title?.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        const matchProject = r.projectName?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchProject) return false;
      }
      return true;
    });
  }, [requirements, priorityFilter, statusFilter, projectFilter, search]);

  const kpis = useMemo(() => {
    return {
      total: requirements.length,
      approved: requirements.filter((r) => r.completed || r.status === "Approved").length,
      inProgress: requirements.filter((r) => r.status === "In Progress").length,
      critical: requirements.filter((r) => r.priority === "Critical" || r.priority === "High").length,
    };
  }, [requirements]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Project Requirements"
        subtitle="Manage product specifications, acceptance criteria, and feature scopes"
        action={
          <Button icon={Plus} onClick={handleOpenCreate}>
            Add Requirement
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Total Scoped</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {kpis.total}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Approved / Done
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {kpis.approved}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
            In Progress
          </p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">
            {kpis.inProgress}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-red-500">High / Critical</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {kpis.critical}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search specifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Review">Pending Review</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="">All Projects</option>
              {Array.from(new Set(requirements.map((r) => r.projectName))).map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </Card>

      {/* Requirements List */}
      {filtered.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={ClipboardList}
            title="No requirements found"
            description="Add specifications or user acceptance criteria to track progress."
            action={
              <Button icon={Plus} onClick={handleOpenCreate}>
                Add Requirement
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={classNames(
                "p-4 sm:p-5 transition-all flex items-start gap-4",
                item.completed
                  ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80"
                  : "hover:shadow-sm"
              )}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => handleToggleDone(item)}
                className={classNames(
                  "mt-1 h-5 w-5 rounded-lg border flex items-center justify-center transition-colors shrink-0",
                  item.completed
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-slate-300 dark:border-slate-600 hover:border-emerald-500"
                )}
                title={item.completed ? "Mark pending" : "Mark approved / completed"}
              >
                {item.completed && <CheckCircle2 size={15} />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono text-slate-400">
                    {item.id}
                  </span>
                  <Badge tone={priorityTone[item.priority] || "slate"}>
                    {item.priority}
                  </Badge>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.category}
                  </span>
                  <Badge tone={statusTone[item.status] || "slate"}>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-slate-400 ml-auto truncate">
                    {item.projectName}
                  </span>
                </div>

                <h4
                  className={classNames(
                    "text-sm font-bold text-slate-800 dark:text-slate-100 mt-1",
                    item.completed && "line-through text-slate-400 dark:text-slate-500"
                  )}
                >
                  {item.title}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                  title="Edit requirement"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete requirement"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Requirement" : "Add New Requirement"}
      >
        <div className="flex flex-col gap-4">
          <Field label="Requirement Title">
            <Input
              placeholder="e.g. Role-Based Access Control (RBAC)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <Field label="Associated Project">
            <Input
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Category">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: "Feature", label: "Feature" },
                  { value: "Security", label: "Security" },
                  { value: "Integration", label: "Integration" },
                  { value: "UI/UX", label: "UI/UX" },
                  { value: "Reporting", label: "Reporting" },
                ]}
              />
            </Field>

            <Field label="Priority">
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={[
                  { value: "Critical", label: "Critical" },
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" },
                ]}
              />
            </Field>

            <Field label="Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "In Progress", label: "In Progress" },
                  { value: "Approved", label: "Approved" },
                  { value: "Pending Review", label: "Pending Review" },
                ]}
              />
            </Field>
          </div>

          <Field label="Description & Acceptance Criteria">
            <Textarea
              placeholder="Detail the requirement behavior and acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? "Save Changes" : "Add Requirement"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
