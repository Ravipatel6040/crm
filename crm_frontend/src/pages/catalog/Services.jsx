import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, Button, SearchBar, FilterSelect,
  ActionsMenu, ConfirmDialog, EmptyState, useToast, Pagination,
} from "../../components/common";
import { services as initialServices } from "../../services/mockData";
import { formatCurrency } from "../../utils/format";
import usePagination from "../../hooks/usePagination";

const CATEGORIES = ["Consulting", "Development", "Training", "Support", "Design"];
const UNITS = ["Hourly", "Flat", "Monthly", "Per Project"];
const STATUSES = ["Active", "Inactive"];

const STATUS_TONE = {
  Active: "green",
  Inactive: "slate",
};

function ServiceModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(
    initial || { name: "", category: "Consulting", rate: "", unit: "Hourly", status: "Active", description: "" }
  );

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, id: initial?.id || `SVC-${Date.now()}`, rate: Number(form.rate) });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <Wrench size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{initial ? "Edit Service" : "Add Service"}</h2>
            <p className="text-xs text-slate-500">Fill in the service details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Service Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Data Migration"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rate (₹) *</label>
              <input
                required
                type="number"
                min="0"
                value={form.rate}
                onChange={(e) => handleChange("rate", e.target.value)}
                placeholder="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Billing Unit</label>
              <select
                value={form.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
              >
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Short service description..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              {initial ? "Save Changes" : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Services() {
  const toast = useToast();
  const [services, setServices] = useState(initialServices);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || s.category === categoryFilter;
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [services, search, categoryFilter, statusFilter]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 8);

  const handleSave = (service) => {
    if (editing) {
      setServices((ss) => ss.map((s) => (s.id === service.id ? service : s)));
      toast?.push("Service updated successfully");
    } else {
      setServices((ss) => [service, ...ss]);
      toast?.push("Service added successfully");
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    setServices((ss) => ss.filter((s) => s.id !== deleteTarget.id));
    toast?.push("Service deleted", "info");
    setDeleteTarget(null);
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setModalOpen(true); };

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={`${totalItems} services in your catalog`}
        action={<Button icon={Plus} onClick={openAdd}>Add Service</Button>}
      />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search services..." className="flex-1" />
          <div className="flex gap-3">
            <FilterSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))}
              label="All Categories"
            />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUSES.map((s) => ({ label: s, value: s }))}
              label="All Statuses"
            />
          </div>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState title="No services found" description="Try adjusting your filters or add a new service." />
        ) : (
          <Table columns={["Service ID", "Name", "Category", "Rate", "Billing", "Status", "Actions"]}>
            {pageItems.map((s) => (
              <Tr key={s.id}>
                <Td><span className="font-mono text-xs text-slate-400">{s.id}</span></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <Wrench size={14} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{s.name}</p>
                      {s.description && <p className="text-xs text-slate-400 max-w-[200px] truncate">{s.description}</p>}
                    </div>
                  </div>
                </Td>
                <Td><Badge tone="purple">{s.category}</Badge></Td>
                <Td className="font-semibold text-slate-700">{formatCurrency(s.rate)}</Td>
                <Td><Badge tone="slate">{s.unit}</Badge></Td>
                <Td><Badge tone={STATUS_TONE[s.status] || "slate"}>{s.status}</Badge></Td>
                <Td>
                  <ActionsMenu
                    actions={[
                      { label: "Edit Service", icon: Pencil, onClick: () => openEdit(s) },
                      { divider: true },
                      { label: "Delete Service", icon: Trash2, danger: true, onClick: () => setDeleteTarget(s) },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </Card>

      <ServiceModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This service will be permanently removed from your catalog."
      />
    </div>
  );
}
