import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Megaphone, TrendingUp, Target, IndianRupee } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, SearchBar, Button, ActionsMenu, ConfirmDialog,
  EmptyState, ProgressBar, useToast, Modal, Field, Input, Select, LoadingState
} from "../../components/common";
import KpiCard from "../../components/dashboard/KpiCard";
import { formatCurrency, formatDate } from "../../utils/format";
import {
  useGetCampaignsQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation
} from "../../store/api/apiSlice";

const platforms = ["Google Ads", "Instagram", "Facebook", "LinkedIn", "WhatsApp", "Website", "Referral"];
const empty = { name: "", platform: platforms[0], startDate: "", endDate: "", budget: "", spend: "0", leads: "0", qualified: "0", proposals: "0", won: "0", revenue: "0" };

function CampaignFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useState(() => { if (open) setForm(initial ? { ...empty, ...initial } : empty); }, [open, initial]);

  const submit = () => {
    onSave({
      ...form,
      id: initial?.id || undefined, // Backend should generate ID if new
      budget: Number(form.budget) || 0,
      spend: Number(form.spend) || 0,
      leads: Number(form.leads) || 0,
      qualified: Number(form.qualified) || 0,
      proposals: Number(form.proposals) || 0,
      won: Number(form.won) || 0,
      revenue: Number(form.revenue) || 0,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Campaign" : "New Campaign"} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>{initial ? "Save Changes" : "Create Campaign"}</Button></>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Campaign Name" className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Festive Season Push" />
        </Field>
        <Field label="Platform">
          <Select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
            {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Budget (₹)">
          <Input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
        </Field>
        <Field label="Start Date"><Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
        <Field label="End Date"><Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

export default function Campaigns() {
  const toast = useToast();
  
  // RTK Query Hooks
  const { data: campaignsData, isLoading } = useGetCampaignsQuery();
  const [createCampaign] = useCreateCampaignMutation();
  const [updateCampaign] = useUpdateCampaignMutation();
  const [deleteCampaign] = useDeleteCampaignMutation();

  const campaigns = campaignsData?.data ?? campaignsData ?? [];

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(
    () => campaigns.filter((c) => !search || (c.name && c.name.toLowerCase().includes(search.toLowerCase()))),
    [campaigns, search]
  );

  const totals = useMemo(() => ({
    budget: campaigns.reduce((s, c) => s + (c.budget || 0), 0),
    spend: campaigns.reduce((s, c) => s + (c.spend || 0), 0),
    leads: campaigns.reduce((s, c) => s + (c.leads || 0), 0),
    revenue: campaigns.reduce((s, c) => s + (c.revenue || 0), 0),
  }), [campaigns]);

  const handleSave = async (c) => {
    try {
      if (editing) { 
        await updateCampaign({ id: c.id, ...c }).unwrap();
        toast?.push("Campaign updated"); 
      }
      else { 
        await createCampaign(c).unwrap();
        toast?.push("Campaign created"); 
      }
      setModalOpen(false); setEditing(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error saving campaign", "error");
    }
  };
  const handleDelete = async () => {
    try {
      await deleteCampaign(deleteTarget.id).unwrap();
      toast?.push("Campaign deleted", "info");
      setDeleteTarget(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error deleting campaign", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Track marketing campaign performance and ROI"
        action={<Button icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>New Campaign</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={IndianRupee} title="Total Budget" value={formatCurrency(totals.budget)} tone="primary" />
        <KpiCard icon={TrendingUp} title="Total Spend" value={formatCurrency(totals.spend)} tone="amber" />
        <KpiCard icon={Target} title="Total Leads" value={totals.leads} tone="green" />
        <KpiCard icon={Megaphone} title="Revenue Generated" value={formatCurrency(totals.revenue)} tone="primary" />
      </div>

      <Card padding="p-4 sm:p-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search campaigns..." className="mb-5 max-w-sm" />
        {isLoading ? (
          <LoadingState label="Loading campaigns..." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No campaigns found" />
        ) : (
          <Table columns={["Campaign", "Platform", "Duration", "Budget", "Spend", "Leads", "Qualified", "Won", "Revenue", "ROI", "Actions"]}>
            {filtered.map((c) => {
              const roi = c.spend > 0 ? (((c.revenue - c.spend) / c.spend) * 100).toFixed(0) : 0;
              return (
                <Tr key={c.id}>
                  <Td className="font-medium text-slate-700">{c.name}</Td>
                  <Td><Badge tone="slate">{c.platform}</Badge></Td>
                  <Td className="text-xs">{formatDate(c.startDate)} – {formatDate(c.endDate)}</Td>
                  <Td>{formatCurrency(c.budget)}</Td>
                  <Td>
                    <div className="w-24">
                      <ProgressBar value={((c.spend || 0) / (c.budget || 1)) * 100} tone={c.spend > c.budget ? "red" : "primary"} />
                    </div>
                  </Td>
                  <Td>{c.leads}</Td>
                  <Td>{c.qualified}</Td>
                  <Td>{c.won}</Td>
                  <Td>{formatCurrency(c.revenue)}</Td>
                  <Td><Badge tone={roi >= 0 ? "green" : "red"}>{roi}%</Badge></Td>
                  <Td>
                    <ActionsMenu actions={[
                      { label: "Edit Campaign", icon: Pencil, onClick: () => { setEditing(c); setModalOpen(true); } },
                      { divider: true },
                      { label: "Delete Campaign", icon: Trash2, danger: true, onClick: () => setDeleteTarget(c) },
                    ]} />
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Card>

      <CampaignFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} initial={editing} />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.name}?`} description="Campaign performance history will be permanently removed." />
    </div>
  );
}
