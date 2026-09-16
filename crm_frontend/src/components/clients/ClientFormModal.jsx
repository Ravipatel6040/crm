import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select } from "../../components/common";

const empty = { name: "", company: "", email: "", phone: "", status: "Active" };

export default function ClientFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.company.trim()) errs.company = "Company is required";
    if (!form.email.trim()) errs.email = "Email is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    // Contract value / paid / pending are derived server-side from real
    // invoices and payments (see attachClientStats in client.controller.js)
    // — they're never submitted here, only name/company/email/phone/status.
    onSave({ ...form, id: initial?.id });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Client" : "Add New Client"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save Changes" : "Add Client"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Contact Name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Company" required error={errors.company}>
          <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {["Active", "On Hold", "Inactive"].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
