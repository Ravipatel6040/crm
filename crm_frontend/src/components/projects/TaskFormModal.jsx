import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select, Textarea } from "../common";

const empty = {
  title: "", assignedTo: "", dueDate: "", priority: "Medium", description: "", status: "TODO",
};

export default function TaskFormModal({ open, onClose, onSave, initial, users = [], saving }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        ...empty,
        ...initial,
        dueDate: initial.dueDate ? String(initial.dueDate).slice(0, 10) : "",
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ ...form, id: initial?.id });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Task" : "New Task"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{initial ? "Save Changes" : "Create Task"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Title" required error={errors.title}>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Prepare staging deployment" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Assignee">
            <Select value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>{u.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Due Date" required error={errors.dueDate}>
            <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              {["Low", "Medium", "High", "Urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="TODO">To Do</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </Field>
        </div>

        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Any additional context..." />
        </Field>
      </div>
    </Modal>
  );
}
