import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, Button, SearchBar, FilterSelect,
  ActionsMenu, ConfirmDialog, EmptyState, useToast, Pagination,
} from "../../components/common";
import { products as initialProducts } from "../../services/mockData";
import { formatCurrency } from "../../utils/format";
import usePagination from "../../hooks/usePagination";

const CATEGORIES = ["Software", "Hardware", "Support", "Add-on"];
const STATUSES = ["Active", "Inactive", "Low Stock"];

const STATUS_TONE = {
  Active: "green",
  Inactive: "slate",
  "Low Stock": "amber",
};

function ProductModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(
    initial || { name: "", category: "Software", price: "", stock: "", status: "Active", description: "" }
  );

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, id: initial?.id || `PRD-${Date.now()}`, price: Number(form.price) });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Package size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{initial ? "Edit Product" : "Add Product"}</h2>
            <p className="text-xs text-slate-500">Fill in the product details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Enterprise License"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹) *</label>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stock / Qty</label>
              <input
                value={form.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
                placeholder="e.g. 100 or Unlimited"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Short product description..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none"
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
              className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              {initial ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || p.category === categoryFilter;
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 8);

  const handleSave = (product) => {
    if (editing) {
      setProducts((ps) => ps.map((p) => (p.id === product.id ? product : p)));
      toast?.push("Product updated successfully");
    } else {
      setProducts((ps) => [product, ...ps]);
      toast?.push("Product added successfully");
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    setProducts((ps) => ps.filter((p) => p.id !== deleteTarget.id));
    toast?.push("Product deleted", "info");
    setDeleteTarget(null);
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setModalOpen(true); };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${totalItems} products in your catalog`}
        action={<Button icon={Plus} onClick={openAdd}>Add Product</Button>}
      />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search products..." className="flex-1" />
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
          <EmptyState title="No products found" description="Try adjusting your filters or add a new product." />
        ) : (
          <Table columns={["Product ID", "Name", "Category", "Price", "Stock", "Status", "Actions"]}>
            {pageItems.map((p) => (
              <Tr key={p.id}>
                <Td><span className="font-mono text-xs text-slate-400">{p.id}</span></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <Package size={14} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 text-sm">{p.name}</p>
                      {p.description && <p className="text-xs text-slate-400 max-w-[200px] truncate">{p.description}</p>}
                    </div>
                  </div>
                </Td>
                <Td><Badge tone="blue">{p.category}</Badge></Td>
                <Td className="font-semibold text-slate-700">{formatCurrency(p.price)}</Td>
                <Td className="text-sm text-slate-600">{p.stock ?? "—"}</Td>
                <Td><Badge tone={STATUS_TONE[p.status] || "slate"}>{p.status}</Badge></Td>
                <Td>
                  <ActionsMenu
                    actions={[
                      { label: "Edit Product", icon: Pencil, onClick: () => openEdit(p) },
                      { divider: true },
                      { label: "Delete Product", icon: Trash2, danger: true, onClick: () => setDeleteTarget(p) },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
          </Table>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={totalItems} pageSize={pageSize} />
      </Card>

      <ProductModal
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
        description="This product will be permanently removed from your catalog."
      />
    </div>
  );
}
