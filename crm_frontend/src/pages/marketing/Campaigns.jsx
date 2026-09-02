import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Megaphone, TrendingUp, Target, IndianRupee } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, SearchBar, Button, ConfirmDialog,
  EmptyState, ProgressBar, useToast, LoadingState
} from "../../components/common";
import CampaignFormModal from "../../components/campaigns/CampaignFormModal";
import KpiCard from "../../components/dashboard/KpiCard";
import { formatCurrency, formatDate } from "../../utils/format";
import {
  useGetCampaignsQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation
} from "../../store/api/apiSlice";

export default function Campaigns() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  
  // RTK Query Hooks
  const { data: campaignsData, isLoading } = useGetCampaignsQuery();
  const [createCampaign] = useCreateCampaignMutation();
  const [updateCampaign] = useUpdateCampaignMutation();
  const [deleteCampaign] = useDeleteCampaignMutation();

  const campaigns = Array.isArray(campaignsData?.data) ? campaignsData.data : Array.isArray(campaignsData) ? campaignsData : [];

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (searchParams.get("new") === "true" || searchParams.get("create") === "true") {
      setEditing(null);
      setModalOpen(true);
    }
  }, [searchParams]);

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
        await updateCampaign({ id: c.id || c._id, ...c }).unwrap();
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
      await deleteCampaign(deleteTarget.id || deleteTarget._id).unwrap();
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
                <Tr key={c.id || c._id}>
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
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditing(c); setModalOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Campaign"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
