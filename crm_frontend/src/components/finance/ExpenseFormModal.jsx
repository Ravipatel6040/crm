import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select } from "../common";

const categories = ["Software", "Marketing", "Operations", "Salary", "Travel", "Other"];

const empty = {
  title: "",
  category: "Software",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function ExpenseFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        ...empty,
        ...initial,
        date: initial.date ? String(initial.date).slice(0, 10) : empty.date,
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.title?.trim()) errs.title = "Expense title is required";
    if (!form.amount || Number(form.amount) <= 0) errs.amount = "Valid amount is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSave({
      ...form,
      id: initial?.id || initial?._id,
      amount: Number(form.amount),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Expense" : "Record Expense"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save Changes" : "Record Expense"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Expense Title / Description" required error={errors.title}>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. AWS Cloud Hosting, Office WiFi, Figma Subscription"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category">
            <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Amount (₹)" required error={errors.amount}>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0.00"
            />
          </Field>
        </div>

        <Field label="Expense Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>

        <Field label="Notes & Reference">
          <Input
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="e.g. Receipt # or card reference"
          />
        </Field>
      </div>
    </Modal>
  );
}
