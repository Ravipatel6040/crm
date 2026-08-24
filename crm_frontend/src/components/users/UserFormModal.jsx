import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select } from "../common";
import { ROLES, ROLE_LABELS } from "../../constants/roles";

const CREATABLE_ROLES = [ROLES.SALES, ROLES.MARKETING, ROLES.PROJECT_MANAGER, ROLES.FINANCE];

const emptyUser = {
  name: "", email: "", phone: "", designation: "", role: ROLES.SALES, status: "Active", password: "",
};

export default function UserFormModal({ open, onClose, onSave, initial, saving }) {
  const [form, setForm] = useState(emptyUser);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initial ? { ...emptyUser, ...initial, password: "" } : emptyUser);
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    if (!initial && !form.password.trim()) errs.password = "Password is required";
    if (!initial && form.password && form.password.length < 6) errs.password = "At least 6 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = { ...form };
    if (initial) delete payload.password; // password changes go through a dedicated flow
    onSave(initial ? { id: initial.id, ...payload } : payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Team Account" : "Create Team Account"}
      subtitle={initial ? `Editing ${initial.name}` : "Add a BD/Sales, Marketing, Project or Finance user"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{initial ? "Save Changes" : "Create Account"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Priya Sharma" />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@crmgangatara.com" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98200 11234" />
        </Field>
        <Field label="Designation">
          <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. BD Executive" />
        </Field>
        <Field label="Role / Department" required>
          <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
            {CREATABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </Field>
        {!initial && (
          <Field label="Password" required error={errors.password} className="sm:col-span-2">
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 6 characters" />
          </Field>
        )}
      </div>
    </Modal>
  );
}
