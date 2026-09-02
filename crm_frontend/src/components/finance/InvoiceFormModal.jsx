import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Modal, Button, Field, Input, Select } from "../common";
import { useGetClientsQuery, useGetProjectsQuery } from "../../store/api/apiSlice";

const emptyItem = { description: "", quantity: 1, rate: "", amount: 0 };

const empty = {
  invoiceNumber: "",
  client: "",
  clientName: "",
  project: "",
  projectName: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
  status: "Sent",
  items: [{ description: "Consulting & Service Delivery", quantity: 1, rate: 25000, amount: 25000 }],
  taxRate: 18,
  notes: "Payment due within 15 days from issue date. Please transfer to the designated bank account.",
};

export default function InvoiceFormModal({ open, onClose, onSave, initial }) {
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
        client: initial.client?._id || initial.client || "",
        project: initial.project?._id || initial.project || "",
        issueDate: initial.issueDate ? String(initial.issueDate).slice(0, 10) : empty.issueDate,
        dueDate: initial.dueDate ? String(initial.dueDate).slice(0, 10) : empty.dueDate,
        items: initial.items?.length > 0 ? initial.items : empty.items,
        taxRate: initial.tax ? Math.round((initial.tax / (initial.subtotal || 1)) * 100) : 18,
      });
    } else {
      const defaultClient = clients[0]?._id || clients[0]?.id || "";
      const defaultProject = projects[0]?._id || projects[0]?.id || "";
      setForm({
        ...empty,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        client: defaultClient,
        clientName: clients[0]?.company || clients[0]?.name || "Direct Client",
        project: defaultProject,
        projectName: projects[0]?.name || "",
      });
    }
    setErrors({});
  }, [initial, open, clients.length, projects.length]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleItemChange = (idx, field, val) => {
    const updated = [...form.items];
    const item = { ...updated[idx], [field]: val };
    if (field === "quantity" || field === "rate") {
      const q = Number(field === "quantity" ? val : item.quantity) || 0;
      const r = Number(field === "rate" ? val : item.rate) || 0;
      item.amount = q * r;
    }
    updated[idx] = item;
    setForm((f) => ({ ...f, items: updated }));
  };

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, { ...emptyItem }],
    }));
  };

  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx),
    }));
  };

  const subtotal = form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxAmount = Math.round(subtotal * (Number(form.taxRate || 0) / 100));
  const total = subtotal + taxAmount;

  const submit = () => {
    const errs = {};
    if (!form.invoiceNumber?.trim()) errs.invoiceNumber = "Invoice number is required";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    if (total <= 0) errs.total = "Invoice total must be greater than 0";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const selectedClient = clients.find((c) => String(c._id || c.id) === String(form.client));
    const selectedProject = projects.find((p) => String(p._id || p.id) === String(form.project));

    onSave({
      ...form,
      id: initial?.id || initial?._id,
      clientName: selectedClient?.company || selectedClient?.name || form.clientName || "Direct Client",
      projectName: selectedProject?.name || form.projectName || "",
      subtotal,
      tax: taxAmount,
      total,
      amount: total,
      paidAmount: form.status === "Paid" ? total : (initial?.paidAmount || 0),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Invoice" : "Create New Invoice"}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Update Invoice" : "Generate Invoice"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Invoice Number" required error={errors.invoiceNumber}>
            <Input
              value={form.invoiceNumber}
              onChange={(e) => set("invoiceNumber", e.target.value)}
              placeholder="e.g. INV-2026-001"
            />
          </Field>
          <Field label="Issue Date">
            <Input
              type="date"
              value={form.issueDate}
              onChange={(e) => set("issueDate", e.target.value)}
            />
          </Field>
          <Field label="Due Date" required error={errors.dueDate}>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Client / Company">
            <Select
              value={form.client}
              onChange={(e) => set("client", e.target.value)}
            >
              <option value="">-- Direct / Unspecified --</option>
              {clients.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.company || c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project">
            <Select
              value={form.project}
              onChange={(e) => set("project", e.target.value)}
            >
              <option value="">-- General / No Project --</option>
              {projects.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Invoice Status">
            <Select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Overdue">Overdue</option>
            </Select>
          </Field>
        </div>

        {/* Line Items */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Line Items
            </label>
            <button
              type="button"
              onClick={addItem}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} /> Add Item
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {form.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  placeholder="Item description / service"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                  className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 outline-hidden focus:border-primary-500"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                  className="w-16 text-xs text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-100 outline-hidden focus:border-primary-500"
                />
                <input
                  type="number"
                  placeholder="Rate (₹)"
                  value={item.rate}
                  onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                  className="w-28 text-xs text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 outline-hidden focus:border-primary-500"
                />
                <span className="w-24 text-xs font-bold text-slate-700 dark:text-slate-300 text-right pr-1">
                  ₹{Number(item.amount || 0).toLocaleString()}
                </span>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="w-full sm:w-1/2">
            <Field label="Payment Terms & Notes">
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 outline-hidden focus:border-primary-500"
              />
            </Field>
          </div>

          <div className="w-full sm:w-1/3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span className="flex items-center gap-1">
                GST / Tax (%):
                <input
                  type="number"
                  value={form.taxRate}
                  onChange={(e) => set("taxRate", e.target.value)}
                  className="w-12 h-6 text-center text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1"
                />
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-800 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total Amount:</span>
              <span className="text-primary-600 dark:text-primary-400">₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
