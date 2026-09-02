import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select } from "../common";
import { paymentStatuses } from "../../services/mockData";
import { useGetClientsQuery, useGetProjectsQuery } from "../../store/api/apiSlice";

const empty = {
  project: "",
  client: "",
  amount: "",
  paid: "",
  dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  status: "Pending",
  invoiceNumber: "",
  notes: "",
};

export default function PaymentFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  const { data: clientsData } = useGetClientsQuery();
  const { data: projectsData } = useGetProjectsQuery();

  const clients = clientsData?.data ?? clientsData ?? [];
  const projects = projectsData?.data ?? projectsData ?? [];

  useEffect(() => {
    if (initial) {
      setForm({
        ...empty,
        ...initial,
        client: initial.clientId || initial.client?._id || initial.client || "",
        project: initial.project?._id || initial.project || "",
        dueDate: initial.dueDate ? String(initial.dueDate).slice(0, 10) : empty.dueDate,
      });
    } else {
      setForm({
        ...empty,
        client: clients[0]?._id || clients[0]?.id || "",
        project: projects[0]?._id || projects[0]?.id || "",
        invoiceNumber: `PAY-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      });
    }
    setErrors({});
  }, [initial, open, clients.length, projects.length]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) <= 0) errs.amount = "Valid amount is required";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const amount = Number(form.amount) || 0;
    const paid = Number(form.paid) || (form.status === "Paid" ? amount : 0);

    const selectedClient = clients.find((c) => String(c._id || c.id) === String(form.client));
    const selectedProject = projects.find((p) => String(p._id || p.id) === String(form.project));

    onSave({
      ...form,
      amount,
      paid,
      pending: Math.max(0, amount - paid),
      client: form.client || null,
      clientName: selectedClient?.company || selectedClient?.name || "Direct Client",
      project: form.project || null,
      projectName: selectedProject?.name || "General",
      id: initial?.id || initial?._id,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Payment Record" : "Record Payment"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save Changes" : "Record Payment"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client / Company">
          <Select value={form.client} onChange={(e) => set("client", e.target.value)}>
            <option value="">-- Select Client --</option>
            {clients.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.company || c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Project">
          <Select value={form.project} onChange={(e) => set("project", e.target.value)}>
            <option value="">-- General Project --</option>
            {projects.map((p) => (
              <option key={p.id || p._id} value={p.id || p._id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment Amount (₹)" required error={errors.amount}>
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
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
