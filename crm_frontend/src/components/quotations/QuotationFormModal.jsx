import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Modal, Button, Field, Input, Select, Textarea } from "../common";
import { classNames, formatCurrency } from "../../utils/format";
import { DEFAULT_QUOTATION_TERMS } from "../../utils/quotation";
import { useGetClientsQuery, useGetLeadsQuery } from "../../store/api/apiSlice";

const EMPTY_LIST = [];
const emptyItem = () => ({ description: "", quantity: 1, rate: "" });

const plusDays = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const buildEmpty = () => ({
  title: "",
  recipientType: "Client",
  client: "",
  lead: "",
  issueDate: new Date().toISOString().slice(0, 10),
  validUntil: plusDays(15),
  items: [emptyItem()],
  discount: "",
  taxRate: 18,
  terms: DEFAULT_QUOTATION_TERMS,
  notes: "",
  status: "Draft",
});

export default function QuotationFormModal({ open, onClose, onSave, initial, saving }) {
  const [form, setForm] = useState(buildEmpty);
  const [errors, setErrors] = useState({});

  const { data: clientsData } = useGetClientsQuery();
  const { data: leadsData } = useGetLeadsQuery();
  const clients = clientsData?.data ?? EMPTY_LIST;
  const leads = leadsData?.data ?? EMPTY_LIST;

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        ...buildEmpty(),
        title: initial.title || "",
        recipientType: initial.recipientType || "Client",
        client: initial.client || "",
        // The lead list is keyed by the L-1234 code, not the Mongo id.
        lead: initial.leadCode || "",
        issueDate: initial.issueDate ? String(initial.issueDate).slice(0, 10) : buildEmpty().issueDate,
        validUntil: initial.validUntil ? String(initial.validUntil).slice(0, 10) : "",
        items: initial.items?.length
          ? initial.items.map((i) => ({ description: i.description, quantity: i.quantity, rate: i.rate }))
          : [emptyItem()],
        discount: initial.discount || "",
        taxRate: initial.taxRate ?? 0,
        terms: initial.terms ?? "",
        notes: initial.notes ?? "",
        status: initial.status || "Draft",
      });
    } else {
      setForm(buildEmpty());
    }
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setItem = (idx, field, value) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx) =>
    setForm((f) => (f.items.length === 1 ? f : { ...f, items: f.items.filter((_, i) => i !== idx) }));

  // Live preview only — the server recomputes every figure when saving.
  const totals = useMemo(() => {
    const subtotal = form.items.reduce(
      (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.rate) || 0),
      0
    );
    const discount = Math.min(subtotal, Math.max(0, Number(form.discount) || 0));
    const tax = (subtotal - discount) * ((Number(form.taxRate) || 0) / 100);
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  }, [form.items, form.discount, form.taxRate]);

  const submit = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Give the quotation a title";
    if (form.recipientType === "Client" && !form.client) errs.recipient = "Select the client";
    if (form.recipientType === "Lead" && !form.lead) errs.recipient = "Select the lead";
    if (form.validUntil && form.issueDate && form.validUntil < form.issueDate) {
      errs.validUntil = "Must be on or after the issue date";
    }
    if (!form.items.some((i) => i.description.trim())) errs.items = "Add at least one line item";
    else if (totals.total <= 0) errs.items = "Total must be greater than 0";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSave({
      id: initial?.id,
      title: form.title.trim(),
      recipientType: form.recipientType,
      client: form.recipientType === "Client" ? form.client : null,
      lead: form.recipientType === "Lead" ? form.lead : null,
      issueDate: form.issueDate,
      validUntil: form.validUntil || null,
      items: form.items
        .filter((i) => i.description.trim())
        .map((i) => ({ description: i.description, quantity: Number(i.quantity) || 0, rate: Number(i.rate) || 0 })),
      discount: Number(form.discount) || 0,
      taxRate: Number(form.taxRate) || 0,
      terms: form.terms,
      notes: form.notes,
      status: form.status,
    });
  };

  const statusOptions = initial
    ? ["Draft", "Sent", "Accepted", "Rejected"]
    : ["Draft", "Sent"];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? `Edit ${initial.quotationNumber}` : "New Quotation"}
      subtitle={initial ? "Changes are logged in the audit trail" : "Prepare a quotation to send to a client or lead"}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>
            {initial ? "Save Changes" : form.status === "Sent" ? "Create & Mark Sent" : "Save Draft"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Title" required error={errors.title}>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. E-commerce website redevelopment"
          />
        </Field>

        {/* Recipient */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start">
          <Field label="Send to">
            <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {["Client", "Lead"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set("recipientType", type)}
                  className={classNames(
                    "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
                    form.recipientType === type
                      ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label={form.recipientType === "Client" ? "Client" : "Lead"}
            required
            error={errors.recipient}
            hint={
              form.recipientType === "Lead"
                ? "Quotations usually go out before a lead becomes a client."
                : undefined
            }
          >
            {form.recipientType === "Client" ? (
              <Select value={form.client} onChange={(e) => set("client", e.target.value)}>
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company} — {c.name}</option>
                ))}
              </Select>
            ) : (
              <Select value={form.lead} onChange={(e) => set("lead", e.target.value)}>
                <option value="">Select a lead…</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.company} — {l.name}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Issue date">
            <Input type="date" value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
          </Field>
          <Field label="Valid until" error={errors.validUntil}>
            <Input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Line items
            </span>
            <button
              type="button"
              onClick={addItem}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              <Plus size={13} /> Add item
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_4rem_6.5rem_5.5rem_1.75rem] gap-2 items-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <input
                  type="text"
                  aria-label="Description"
                  placeholder="Service or deliverable"
                  value={item.description}
                  onChange={(e) => setItem(idx, "description", e.target.value)}
                  className="min-w-0 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500"
                />
                <input
                  type="number"
                  aria-label="Quantity"
                  min="0"
                  value={item.quantity}
                  onChange={(e) => setItem(idx, "quantity", e.target.value)}
                  className="w-full text-xs text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1 py-1.5 text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500"
                />
                <input
                  type="number"
                  aria-label="Rate"
                  min="0"
                  placeholder="Rate (₹)"
                  value={item.rate}
                  onChange={(e) => setItem(idx, "rate", e.target.value)}
                  className="w-full text-xs text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 outline-none focus:border-primary-500"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right tabular-nums">
                  {formatCurrency((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={form.items.length === 1}
                  className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          {errors.items && <p className="text-xs text-red-500 mt-1.5">{errors.items}</p>}
        </div>

        {/* Terms + totals */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_17rem] gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-4">
            <Field label="Notes to client" hint="Shown on the quotation, above the terms.">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </Field>
            <Field label="Terms & conditions">
              <Textarea value={form.terms} onChange={(e) => set("terms", e.target.value)} rows={4} />
            </Field>
          </div>

          <div className="flex flex-col gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700 self-start">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency(totals.subtotal)}</span>
            </div>
            <label className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) => set("discount", e.target.value)}
                className="w-24 h-7 text-right text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2"
              />
            </label>
            <label className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>GST (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={form.taxRate}
                onChange={(e) => set("taxRate", e.target.value)}
                className="w-24 h-7 text-right text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2"
              />
            </label>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Tax amount</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-slate-100 pt-2.5 border-t border-slate-200 dark:border-slate-700">
              <span>Total</span>
              <span className="text-primary-600 dark:text-primary-400 tabular-nums">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
