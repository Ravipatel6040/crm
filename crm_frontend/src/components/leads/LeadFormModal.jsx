import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select, Textarea } from "../../components/common";
import { leadSources, pipelineStages } from "../../services/mockData";
import { ROLES } from "../../constants/roles";

const emptyLead = {
  name: "", company: "", phone: "", email: "", source: leadSources[0],
  interestedIn: "", budget: "", assignedTo: "", status: pipelineStages[0],
  nextFollowUp: "", notes: "", city: "", state: "", country: "",
};

export default function LeadFormModal({ open, onClose, onSave, initial, users = [] }) {
  const [form, setForm] = useState(emptyLead);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initial ? { ...emptyLead, ...initial } : emptyLead);
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.company.trim()) errs.company = "Company is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    if (!form.email.trim()) errs.email = "Email is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ ...form, budget: Number(form.budget) || 0, id: initial?.id || `L-${Math.floor(1000 + Math.random() * 9000)}` });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Lead" : "Add New Lead"}
      subtitle={initial ? `Editing ${initial.id}` : "Capture a new lead's details"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save Changes" : "Add Lead"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ananya Rao" />
        </Field>
        <Field label="Company" required error={errors.company}>
          <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Zenith Retail Pvt Ltd" />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98200 11234" />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" />
        </Field>
        <Field label="Source">
          <Select value={form.source} onChange={(e) => set("source", e.target.value)}>
            {leadSources.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Interested Service">
          <Input value={form.interestedIn} onChange={(e) => set("interestedIn", e.target.value)} placeholder="e.g. E-commerce Website" />
        </Field>
        <Field label="Budget (₹)">
          <Input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="e.g. 150000" />
        </Field>
        <Field label="Assigned BD">
          <Select value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
            <option value="">Select an assignee...</option>
            {users.filter((u) => u.role === ROLES.SALES || u.role === ROLES.ADMIN).map((u) => (
              <option key={u.id || u._id} value={u.id || u._id}>{u.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {pipelineStages.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Follow-up Date">
          <Input type="date" value={form.nextFollowUp} onChange={(e) => set("nextFollowUp", e.target.value)} />
        </Field>
        <Field label="City">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Mumbai" />
        </Field>
        <Field label="State">
          <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="e.g. Maharashtra" />
        </Field>
        <Field label="Country">
          <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="e.g. India" />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any additional context..." />
        </Field>
      </div>
    </Modal>
  );
}
