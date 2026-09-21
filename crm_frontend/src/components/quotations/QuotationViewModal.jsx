import { useState } from "react";
import { Download, Send, Mail, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Modal, Button, Badge, useToast } from "../common";
import { formatDate, formatDateTime, formatCurrency } from "../../utils/format";
import { displayStatus, amountInWords, QUOTATION_STATUS_TONE } from "../../utils/quotation";
import { downloadQuotationPdf } from "../../utils/quotationPdf";

/**
 * The quotation as it goes out to the client. The paper is deliberately
 * white in both themes so what's on screen matches the downloaded PDF.
 */
export default function QuotationViewModal({
  quotation, open, onClose, organization = {}, canManage, onStatusChange, onSend, busy,
}) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  if (!quotation) return null;

  const q = quotation;
  const status = displayStatus(q);
  const preparer = q.sentBy || q.createdBy;
  const orgName = organization.legalName || organization.name || "CRM Gangatara";

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadQuotationPdf(q);
    } catch (err) {
      toast?.push(err.message, "error");
    } finally {
      setDownloading(false);
    }
  };

  const actions = [];
  if (canManage) {
    if (q.status === "Draft") {
      actions.push({ label: "Mark as Sent", icon: Send, next: "Sent" });
    } else if (q.status === "Sent") {
      actions.push({ label: "Mark Accepted", icon: CheckCircle2, next: "Accepted", primary: true });
      actions.push({ label: "Mark Rejected", icon: XCircle, next: "Rejected" });
    } else {
      actions.push({ label: "Move back to Sent", icon: RotateCcw, next: "Sent" });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Quotation ${q.quotationNumber}`}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <span className="text-xs text-slate-400">
            {q.sentAt
              ? `Sent ${formatDate(q.sentAt)} by ${q.sentBy?.name || "—"}`
              : `Draft · created by ${q.createdBy?.name || "—"}`}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((a) => (
              <Button
                key={a.next + a.label}
                variant={a.primary ? "primary" : "outline"}
                icon={a.icon}
                disabled={busy}
                onClick={() => onStatusChange?.(q, a.next)}
              >
                {a.label}
              </Button>
            ))}
            <Button variant="outline" icon={Download} onClick={handleDownload} loading={downloading}>
              Download PDF
            </Button>
            {canManage && (
              <Button icon={Mail} onClick={() => onSend?.(q)}>
                {q.emails?.length ? "Email again" : "Email to client"}
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl bg-white text-slate-800 rounded-xl border border-slate-200 shadow-sm p-6 sm:p-9 flex flex-col gap-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-5 pb-6 border-b border-slate-200">
          <div className="min-w-0">
            <p className="text-lg font-extrabold tracking-tight text-slate-900">{orgName}</p>
            <div className="mt-1.5 text-xs text-slate-500 leading-relaxed space-y-0.5">
              {organization.address && <p className="whitespace-pre-line">{organization.address}</p>}
              {(organization.email || organization.phone) && (
                <p>{[organization.email, organization.phone].filter(Boolean).join("  ·  ")}</p>
              )}
              {organization.website && <p>{organization.website}</p>}
              {organization.taxId && <p>GSTIN: {organization.taxId}</p>}
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <p className="text-2xl font-black tracking-wider text-primary-700">QUOTATION</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{q.quotationNumber}</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Date: <span className="font-semibold text-slate-700">{formatDate(q.issueDate)}</span></p>
              <p>Valid until: <span className="font-semibold text-slate-700">{q.validUntil ? formatDate(q.validUntil) : "—"}</span></p>
            </div>
            <div className="mt-2.5">
              <Badge tone={QUOTATION_STATUS_TONE[status]}>{status}</Badge>
            </div>
          </div>
        </div>

        {/* Recipient + subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">Quotation for</p>
            <p className="font-bold text-sm text-slate-900">{q.recipientCompany || q.recipientName}</p>
            {q.recipientCompany && q.recipientName && (
              <p className="text-slate-500 mt-0.5">Attn: {q.recipientName}</p>
            )}
            {q.recipientEmail && <p className="text-slate-500">{q.recipientEmail}</p>}
            {q.recipientPhone && <p className="text-slate-500">{q.recipientPhone}</p>}
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">Subject</p>
            <p className="font-bold text-sm text-slate-900">{q.title}</p>
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs text-left min-w-[30rem]">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-10">#</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Rate</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(q.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{item.description}</td>
                  <td className="py-3 px-4 text-center text-slate-600 tabular-nums">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-slate-600 tabular-nums">{formatCurrency(item.rate)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800 tabular-nums">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Amount in words / payment details, and totals */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-6">
          <div className="flex-1 min-w-0 text-xs flex flex-col gap-4">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 mb-1">Amount in words</p>
              <p className="italic text-slate-700 leading-relaxed">{amountInWords(q.total)}</p>
            </div>
            {organization.paymentDetails && (
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400 mb-1">Payment details</p>
                <p className="whitespace-pre-line text-slate-600 leading-relaxed">{organization.paymentDetails}</p>
              </div>
            )}
          </div>
          <div className="w-full sm:w-72 shrink-0 flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800 tabular-nums">{formatCurrency(q.subtotal)}</span>
            </div>
            {q.discount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span className="font-semibold text-slate-800 tabular-nums">− {formatCurrency(q.discount)}</span>
              </div>
            )}
            {q.taxRate > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>GST ({q.taxRate}%)</span>
                <span className="font-semibold text-slate-800 tabular-nums">{formatCurrency(q.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-2.5 border-t-2 border-slate-800">
              <span>Total</span>
              <span className="text-primary-700 tabular-nums">{formatCurrency(q.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes + terms */}
        {(q.notes || q.terms) && (
          <div className="flex flex-col gap-4 text-xs text-slate-600 leading-relaxed">
            {q.notes && (
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
                <p className="whitespace-pre-line">{q.notes}</p>
              </div>
            )}
            {q.terms && (
              <div>
                <p className="font-bold uppercase tracking-wider text-slate-400 mb-1">Terms &amp; conditions</p>
                <p className="whitespace-pre-line">{q.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Acceptance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-bold uppercase tracking-wider text-slate-400 mb-6">Client acceptance</p>
            <div className="border-t border-slate-300 pt-1.5 text-slate-400">Name, signature &amp; date</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="font-bold uppercase tracking-wider text-slate-400 mb-6">For {orgName}</p>
            <div className="border-t border-slate-300 pt-1.5 text-slate-400">Authorised signatory</div>
          </div>
        </div>

        {/* Who it's from */}
        {preparer && (
          <div className="pt-5 border-t border-slate-200 text-xs">
            <p className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {q.sentBy ? "Sent by" : "Prepared by"}
            </p>
            <p className="font-bold text-sm text-slate-900">{preparer.name}</p>
            <div className="text-slate-500 mt-0.5 space-y-0.5">
              {preparer.designation && <p>{preparer.designation}</p>}
              {preparer.email && <p>{preparer.email}</p>}
              {preparer.phone && <p>{preparer.phone}</p>}
              {q.sentAt && <p>Sent on {formatDate(q.sentAt)}</p>}
            </div>
          </div>
        )}
      </div>

      {q.emails?.length > 0 && (
        <div className="mx-auto max-w-3xl mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Email history
          </p>
          <ul className="flex flex-col gap-2">
            {[...q.emails].reverse().map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs"
              >
                <Mail size={14} className="mt-0.5 text-primary-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-700 dark:text-slate-200">
                    Sent to <b>{e.to.join(", ")}</b>
                    {e.cc?.length > 0 && <> (cc {e.cc.join(", ")})</>}
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 mt-0.5">
                    {formatDateTime(e.sentAt)}{e.sentBy ? ` · by ${e.sentBy.name}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
