import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Download, Trash2, Upload, Loader2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { Card, Badge, Select, SearchBar, FilterSelect, Button, ActionsMenu, ConfirmDialog, EmptyState, LoadingState, useToast } from "../../components/common";
import { formatDate } from "../../utils/format";
import {
  useGetClientsQuery,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} from "../../store/api/apiSlice";

const EMPTY = [];
const DOCUMENT_TYPES = ["Contract", "Invoice", "Proposal", "NDA", "Deliverable", "Other"];

// Documents are served by the backend's express.static("public"), not the
// Vite dev server, so the /uploads path needs the API's origin, not the
// frontend's — same construction used in ClientDetail's Documents tab.
const fileUrl = (path) =>
  `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/v1$/, "")}${path}`;

export default function Documents() {
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const { data: clientsData } = useGetClientsQuery();
  const { data: docsData, isLoading } = useGetDocumentsQuery();
  const [uploadDocument, { isLoading: uploading }] = useUploadDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  const clients = clientsData?.data ?? clientsData?.clients ?? EMPTY;
  const docs = docsData?.data ?? EMPTY;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingClient, setPendingClient] = useState("");

  useEffect(() => {
    if (!pendingClient && clients.length > 0) setPendingClient(clients[0].id);
  }, [clients, pendingClient]);

  const filtered = useMemo(() => docs.filter((d) => {
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || d.type === typeFilter;
    return matchesSearch && matchesType;
  }), [docs, search, typeFilter]);

  const startUpload = () => {
    if (!pendingClient) {
      toast?.push("Select a client before uploading a document", "error");
      return;
    }
    fileRef.current?.click();
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingClient) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client", pendingClient);
    try {
      await uploadDocument(formData).unwrap();
      toast?.push("Document uploaded successfully");
    } catch (err) {
      toast?.push(err?.data?.message || "Upload failed", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocument(deleteTarget.id).unwrap();
      toast?.push("Document deleted", "info");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to delete document", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle={`${filtered.length} file${filtered.length === 1 ? "" : "s"} across all clients`}
        action={
          <div className="flex items-center gap-2">
            <Select
              value={pendingClient}
              onChange={(e) => setPendingClient(e.target.value)}
              className="w-44"
              title="Client this upload belongs to"
            >
              {clients.length === 0 && <option value="">No clients yet</option>}
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
            </Select>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <Button icon={uploading ? Loader2 : Upload} onClick={startUpload} disabled={uploading || !pendingClient}>
              Upload
            </Button>
          </div>
        }
      />

      <Card padding="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar value={search} onChange={setSearch} placeholder="Search documents..." className="flex-1" />
          <FilterSelect value={typeFilter} onChange={setTypeFilter} options={DOCUMENT_TYPES} label="All Types" />
        </div>

        {isLoading ? (
          <LoadingState label="Loading documents..." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No documents found" icon={FileText} description="Upload your first document to get started." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <div key={d.id} className="border border-slate-100 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-popover transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <ActionsMenu actions={[
                    { label: "Download", icon: Download, onClick: () => window.open(fileUrl(d.url), "_blank") },
                    { divider: true },
                    { label: "Delete", icon: Trash2, danger: true, onClick: () => setDeleteTarget(d) },
                  ]} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{d.name}</p>
                  {d.client && (
                    <button onClick={() => navigate(`/clients/${d.client}`)} className="text-xs text-primary-500 hover:underline mt-0.5">
                      View client
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-50 dark:border-slate-700/60">
                  <Badge tone="slate">{d.type}</Badge>
                  <span>{Math.round((d.size || 0) / 1024)} KB</span>
                </div>
                <p className="text-[11px] text-slate-300 dark:text-slate-600">
                  Uploaded by {d.uploadedBy?.name || "team"} · {formatDate(d.createdAt)}
                </p>
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
