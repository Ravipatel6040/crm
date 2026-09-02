import { useEffect, useState, useRef, useMemo } from "react";
import { Modal, Button, Field, Input, Select, Textarea } from "../../components/common";
import { FileText, Upload, X } from "lucide-react";
import { useGetProjectManagersQuery } from "../../store/api/apiSlice";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const empty = {
  name: "",
  client: "",
  manager: "",
  startDate: new Date().toISOString().slice(0, 10),
  deadline: "",
  priority: "Medium",
  link: "",
  description: "",
};

export default function ProjectFormModal({ open, onClose, onSave, initial, clients = [], users = [] }) {
  const [form, setForm] = useState(empty);
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const { data: pmData } = useGetProjectManagersQuery();
  const fetchedPMs = pmData?.data ?? pmData ?? [];

  const availableManagers = useMemo(() => {
    const list = [...fetchedPMs, ...(users || [])];
    const map = new Map();
    list.forEach((u) => {
      const id = u.id || u._id;
      if (id && !map.has(id)) {
        map.set(id, u);
      }
    });

    const unique = Array.from(map.values());
    const pmFiltered = unique.filter((u) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN");
    if (pmFiltered.length > 0) return pmFiltered;
    return unique.length > 0 ? unique : [
      { id: "6a966f3b604107b14be4aa77", name: "project", email: "project@gmail.com", role: "PROJECT_MANAGER" },
      { id: "6a86878bd73f90e7b321ce5a", name: "User", email: "admin@gmail.com", role: "ADMIN" }
    ];
  }, [fetchedPMs, users]);

  useEffect(() => {
    if (initial) {
      setForm({
        ...empty,
        ...initial,
        client: initial.client?._id || initial.client?.id || initial.client || "",
        manager: initial.projectManager?._id || initial.projectManager?.id || initial.projectManager || initial.manager || "",
        startDate: initial.startDate ? String(initial.startDate).slice(0, 10) : "",
        deadline: initial.deadline ? String(initial.deadline).slice(0, 10) : "",
        link: initial.link || "",
        priority: initial.priority || "Medium",
        description: initial.notes || initial.description || "",
      });
      setDocuments(initial.documents || []);
    } else {
      setForm(empty);
      setDocuments([]);
    }
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readDocs = await Promise.all(
      files.map((file) => {
        return new Promise((resolve) => {
          const ext = file.name.split(".").pop().toUpperCase();
          const type = ext === "PDF" ? "PDF" : (ext === "DOC" || ext === "DOCX" ? "DOC" : ext);
          const sizeKb = Math.round(file.size / 1024);
          const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type,
              size: sizeStr,
              url: reader.result,
              uploadedAt: new Date().toISOString(),
            });
          };
          reader.onerror = () => {
            resolve({
              name: file.name,
              type,
              size: sizeStr,
              uploadedAt: new Date().toISOString(),
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setDocuments((prev) => [...prev, ...readDocs]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDocument = (idx) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Project name is required";
    if (!form.deadline) errs.deadline = "Deadline is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const clientObj = clients.find((c) => (c.id || c._id) === form.client);
    onSave({
      ...form,
      id: initial?.id || initial?._id,
      name: form.name.trim(),
      client: form.client || null,
      clientName: clientObj?.company || clientObj?.name || initial?.clientName || "Direct Client",
      projectManager: form.manager || form.projectManager || null,
      priority: form.priority,
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      deadline: form.deadline,
      notes: form.description || form.notes || "",
      link: form.link || "",
      documents,
      status: initial?.status || "Active",
      progress: initial?.progress || 0,
      tasks: initial?.tasks || { total: 0, done: 0 },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Project" : "Create New Project"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save Changes" : "Create Project"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Project Name */}
        <Field label="Project Name" required error={errors.name} className="sm:col-span-2">
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Website Revamp"
          />
        </Field>

        {/* Client */}
        <Field label="Client">
          <Select value={form.client} onChange={(e) => set("client", e.target.value)}>
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.company || c.name}
              </option>
            ))}
          </Select>
        </Field>

        {/* Project Manager */}
        <Field label="Project Manager">
          <Select value={form.manager} onChange={(e) => set("manager", e.target.value)}>
            <option value="">Select project manager...</option>
            {availableManagers.map((u) => (
              <option key={u.id || u._id} value={u.id || u._id}>
                {u.name || u.email} ({u.role === "PROJECT_MANAGER" ? "Project Manager" : (u.role === "ADMIN" ? "Admin" : u.role)})
              </option>
            ))}
          </Select>
        </Field>

        {/* Start Date */}
        <Field label="Start Date">
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </Field>

        {/* Deadline */}
        <Field label="Deadline" required error={errors.deadline}>
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
          />
        </Field>

        {/* Priority Enum Dropdown */}
        <Field label="Priority" required>
          <Select
            value={form.priority}
            onChange={(e) => set("priority", e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p} Priority
              </option>
            ))}
          </Select>
        </Field>

        {/* Link Field (Replaces Status Field) */}
        <Field label="Project Link" error={errors.link}>
          <Input
            type="url"
            value={form.link}
            onChange={(e) => set("link", e.target.value)}
            placeholder="e.g. https://github.com/... or https://figma.com/..."
          />
        </Field>

        {/* Description */}
        <Field label="Description" className="sm:col-span-2">
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief project description..."
          />
        </Field>

        {/* Project Documents / PDF Attachment Section */}
        <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Scope & Requirements Document (PDF / DOC)
              </label>
              <p className="text-[11px] text-slate-400">
                Attach project brief, specification, or SRS document for the assigned Project Manager.
              </p>
            </div>
            <Button
              type="button"
              size="xs"
              variant="outline"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Doc / PDF
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {documents.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-1.5"
            >
              <div className="h-9 w-9 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="text-primary-600 dark:text-primary-400 font-semibold underline">Click to upload</span> PDF or DOC specifications
              </p>
              <p className="text-[10px] text-slate-400">Supports PDF, DOC, DOCX up to 25MB</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          doc.type === "PDF"
                            ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                            : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={doc.name}>
                          {doc.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {doc.size || "Document"} · <span className="font-semibold">{doc.type}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(idx)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium inline-flex items-center gap-1 mt-1"
              >
                + Add another document
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
