import { useMemo, useState, useRef } from "react";
import { FileText, Download, Trash2, Upload, Eye } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { Card, Badge, SearchBar, FilterSelect, Button, ActionsMenu, ConfirmDialog, EmptyState, useToast } from "../../components/common";
import { documents as initialDocuments, documentTypes, clients, projects, users } from "../../services/mockData";
import { formatDate } from "../../utils/format";

function clientName(id) { return clients.find((c) => c.id === id)?.company || "-"; }
function projectName(id) { return projects.find((p) => p.id === id)?.name || "-"; }
function userName(id) { return users.find((u) => u.id === id)?.name || "-"; }

export default function Documents() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [docs, setDocs] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => docs.filter((d) => {
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || clientName(d.client).toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || d.type === typeFilter;
    return matchesSearch && matchesType;
  }), [docs, search, typeFilter]);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocs((ds) => [{
      id: `D-${Math.floor(100 + Math.random() * 900)}`,
      name: file.name,
      type: "Other",
      client: clients[0]?.id,
      project: projects[0]?.id,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      uploadedBy: "u1",
      date: new Date().toISOString().slice(0, 10),
    }, ...ds]);
    toast?.push("Document uploaded successfully");
    e.target.value = "";
  };

  const handleDelete = () => {
    setDocs((ds) => ds.filter((d) => d.id !== deleteTarget.id));
    toast?.push("Document deleted", "info");
    setDeleteTarget(null);
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle={`${filtered.length} files across all clients and projects`}
        action={
          <>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <Button icon={Upload} onClick={() => fileRef.current?.click()}>Upload Document</Button>
          </>
        }
      />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search documents..." className="flex-1" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} options={documentTypes} label="All Types" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No documents found" icon={FileText} description="Upload your first document to get started." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <div key={d.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-popover transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <ActionsMenu actions={[
                    { label: "View", icon: Eye, onClick: () => toast?.push(`Opening ${d.name}`, "info") },
                    { label: "Download", icon: Download, onClick: () => toast?.push(`Downloading ${d.name}`, "info") },
                    { divider: true },
                    { label: "Delete", icon: Trash2, danger: true, onClick: () => setDeleteTarget(d) },
                  ]} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{clientName(d.client)} · {projectName(d.project)}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-50">
                  <Badge tone="slate">{d.type}</Badge>
                  <span>{d.size}</span>
                </div>
                <p className="text-[11px] text-slate-300">Uploaded by {userName(d.uploadedBy)} · {formatDate(d.date)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.name}?`}
        description="This document will be permanently removed from storage."
      />
    </div>
  );
}
