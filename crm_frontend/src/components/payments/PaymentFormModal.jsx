import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select } from "../../components/common";
import { projects, clients, paymentStatuses } from "../../services/mockData";

const empty = { project: projects[0]?.id, client: clients[0]?.company, amount: "", paid: "", dueDate: "", status: "Pending" };

export default function PaymentFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial } : empty);
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.amount) errs.amount = "Amount is required";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const amount = Number(form.amount) || 0;
    const paid = Number(form.paid) || 0;
    onSave({
      ...form,
      amount,
      paid,
      pending: Math.max(0, amount - paid),
      id: initial?.id || `INV-${Math.floor(9000 + Math.random() * 900)}`,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Payment" : "Record Payment"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save Changes" : "Record Payment"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Project">
          <Select value={form.project} onChange={(e) => set("project", e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Client">
          <Select value={form.client} onChange={(e) => set("client", e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.company}>{c.company}</option>)}
          </Select>
        </Field>
        <Field label="Invoice Amount (₹)" required error={errors.amount}>
          <Input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
        </Field>
        <Field label="Amount Paid (₹)">
          <Input type="number" value={form.paid} onChange={(e) => set("paid", e.target.value)} />
        </Field>
        <Field label="Due Date" required error={errors.dueDate}>
          <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
