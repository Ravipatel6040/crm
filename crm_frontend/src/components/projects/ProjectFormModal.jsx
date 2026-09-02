import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select, Textarea } from "../../components/common";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const empty = {
  name: "",
  client: "",
  manager: "",
  startDate: "",
  deadline: "",
  priority: "Medium",
  link: "",
  description: "",
};

export default function ProjectFormModal({ open, onClose, onSave, initial, clients = [], users = [] }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(
      initial
        ? {
            ...empty,
            ...initial,
            link: initial.link || "",
            priority: initial.priority || "Medium",
          }
        : empty
    );
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Project name is required";
    if (!form.deadline) errs.deadline = "Deadline is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const clientObj = clients.find((c) => (c.id || c._id) === form.client);
    onSave({
      ...form,
      id: initial?.id || initial?._id || `P-${Math.floor(200 + Math.random() * 700)}`,
      clientName: clientObj?.company || clientObj?.name || initial?.clientName || "General Client",
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
            {users.map((u) => (
              <option key={u.id || u._id} value={u.id || u._id}>
                {u.name} ({u.role})
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
      </div>
    </Modal>
  );
}
