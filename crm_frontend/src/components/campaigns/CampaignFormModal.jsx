import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select } from "../common";

export const platforms = ["Google Ads", "Instagram", "Facebook", "LinkedIn", "WhatsApp", "Website", "Referral"];
const empty = {
  name: "",
  platform: platforms[0],
  startDate: "",
  endDate: "",
  budget: "",
  spend: "0",
  leads: "0",
  qualified: "0",
  proposals: "0",
  won: "0",
  revenue: "0",
  status: "Active"
};

export default function CampaignFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty, ...initial } : empty);
      setError("");
    }
  }, [open, initial]);

  const submit = () => {
    if (!form.name || !form.name.trim()) {
      setError("Campaign name is required");
      return;
    }
    setError("");
    onSave({
      ...form,
      name: form.name.trim(),
      id: initial?.id || initial?._id || undefined,
      budget: Number(form.budget) || 0,
      spend: Number(form.spend) || 0,
      leads: Number(form.leads) || 0,
      qualified: Number(form.qualified) || 0,
      proposals: Number(form.proposals) || 0,
      won: Number(form.won) || 0,
      revenue: Number(form.revenue) || 0,
      status: form.status || "Active",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Campaign" : "New Campaign"}
      subtitle={initial ? `Editing campaign: ${initial.name}` : "Launch a new marketing campaign"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save Changes" : "Create Campaign"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Campaign Name" error={error} className="sm:col-span-2">
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Festive Season Google Ads"
          />
        </Field>
        <Field label="Platform">
          <Select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
            {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Budget (₹)">
          <Input
            type="number"
            value={form.budget}
            onChange={(e) => set("budget", e.target.value)}
            placeholder="e.g. 50000"
          />
        </Field>
        <Field label="Start Date">
          <Input
            type="date"
            value={form.startDate ? String(form.startDate).split("T")[0] : ""}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </Field>
        <Field label="End Date">
          <Input
            type="date"
            value={form.endDate ? String(form.endDate).split("T")[0] : ""}
            onChange={(e) => set("endDate", e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
