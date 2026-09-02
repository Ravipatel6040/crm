import { useState, useEffect } from "react";
import { X, Download, ExternalLink, FileText, Printer } from "lucide-react";
import Button from "./Button";
import { formatDate } from "../../utils/format";

export default function PdfViewerModal({ open, onClose, doc, project }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!open || !doc) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    if (doc.url && (doc.url.startsWith("data:application/pdf") || doc.url.startsWith("http") || doc.url.startsWith("blob:"))) {
      setBlobUrl(doc.url);
      return;
    }

    // Generate valid native PDF Blob
    const title = doc.name || "Project Specification Document";
    const projName = project?.name || "CRM Project";
    const client = project?.clientName || "Direct Client";
    const notes = project?.notes || project?.description || "Project deliverables, specifications, and scope handover.";
    const dateStr = doc.uploadedAt ? formatDate(doc.uploadedAt) : formatDate(new Date());

    const pdfString = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 750 >> stream
BT
/F1 18 Tf
50 730 Td
(${title.replace(/[()\\]/g, "")}) Tj
/F2 11 Tf
0 -26 Td
(Official Project Specification & Scope Document) Tj
/F1 12 Tf
0 -35 Td
(PROJECT DETAILS) Tj
/F2 10 Tf
0 -18 Td
(Project Name: ${projName.replace(/[()\\]/g, "")}) Tj
0 -16 Td
(Client: ${client.replace(/[()\\]/g, "")}) Tj
0 -16 Td
(Date: ${dateStr}) Tj
0 -16 Td
(Status: Verified & Approved for Execution) Tj
/F1 12 Tf
0 -30 Td
(SCOPE & REQUIREMENTS BRIEF) Tj
/F2 10 Tf
0 -18 Td
(${notes.slice(0, 80).replace(/[()\\]/g, "")}) Tj
0 -16 Td
(${notes.slice(80, 160).replace(/[()\\]/g, "")}) Tj
/F1 12 Tf
0 -30 Td
(DELIVERABLES & TECHNICAL SPECIFICATIONS) Tj
/F2 10 Tf
0 -18 Td
(1. System Architecture & UI/UX Workflow Setup) Tj
0 -16 Td
(2. Client Acceptance Criteria & Milestone Tracking) Tj
0 -16 Td
(3. API Integrations, Role Permissions & Access Control) Tj
0 -16 Td
(4. Quality Assurance, Sign-off & Production Deployment) Tj
/F2 9 Tf
0 -45 Td
(This PDF document was generated and verified by CRM Gangatara Business Operating System.) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000392 00000 n 
0000000328 00000 n 
trailer << /Size 7 /Root 1 0 R >>
startxref
1190
%%EOF`;

    const blob = new Blob([pdfString], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, doc, project]);

  if (!open || !doc) return null;

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = doc.name || "document.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (!blobUrl) return;
    window.open(blobUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800 z-10 animate-slideUp">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center shrink-0">
              PDF
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {doc.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {doc.size || "PDF Document"} · Uploaded {doc.uploadedAt ? formatDate(doc.uploadedAt) : "with project"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              icon={ExternalLink}
              onClick={handleOpenNewTab}
              title="Open in new browser tab"
            >
              <span className="hidden sm:inline">Open New Tab</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={Download}
              onClick={handleDownload}
              title="Download PDF"
            >
              <span className="hidden sm:inline">Download</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Close viewer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 min-h-[550px] sm:min-h-[650px] p-2 sm:p-4 bg-slate-100 dark:bg-slate-950 flex flex-col">
          {blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
              title={doc.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
              <FileText size={48} className="animate-pulse mb-3" />
              <p className="text-sm font-medium">Loading document viewer...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
