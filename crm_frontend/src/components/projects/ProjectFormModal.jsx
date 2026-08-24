import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select, Textarea } from "../../components/common";
import { clients, users, projectStatuses, taskPriorities } from "../../services/mockData";

const empty = {
  name: "", client: clients[0]?.id, manager: users[4]?.id, startDate: "", deadline: "",
  description: "", priority: "Medium", status: "Planning",
};

export default function ProjectFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Project name is required";
    if (!form.deadline) errs.deadline = "Deadline is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const clientObj = clients.find((c) => c.id === form.client);
    onSave({
      ...form,
      id: initial?.id || `P-${Math.floor(200 + Math.random() * 700)}`,
      clientName: clientObj?.company,
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
        <Field label="Project Name" required error={errors.name} className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Website Revamp" />
        </Field>
        <Field label="Client">
          <Select value={form.client} onChange={(e) => set("client", e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
          </Select>
        </Field>
        <Field label="Project Manager">
          <Select value={form.manager} onChange={(e) => set("manager", e.target.value)}>
            {users.filter((u) => u.role === "project_manager" || u.role === "admin").map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Start Date">
          <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field label="Deadline" required error={errors.deadline}>
          <Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {taskPriorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {projectStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief project description..." />
        </Field>
      </div>
    </Modal>
  );
}
