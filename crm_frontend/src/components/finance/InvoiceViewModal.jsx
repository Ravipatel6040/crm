import { Printer, Download, X, Building2, CheckCircle2 } from "lucide-react";
import { Modal, Button, Badge } from "../common";
import { formatDate, formatCurrency } from "../../utils/format";

export default function InvoiceViewModal({ invoice, open, onClose }) {
  if (!invoice) return null;

  const subtotal = invoice.subtotal || invoice.amount || invoice.total || 0;
  const tax = invoice.tax || 0;
  const total = invoice.total || invoice.amount || 0;
  const paid = invoice.paidAmount || (invoice.status === "Paid" ? total : 0);
  const balance = Math.max(0, total - paid);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Invoice ${invoice.invoiceNumber || ""}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">
            Invoice ID: {invoice.id || invoice._id}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Printer} onClick={handlePrint}>
              Print Invoice
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      }
    >
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex flex-col gap-6 print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-black text-base">
                G
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                CRM Gangatara
              </span>
            </div>
            <p className="text-xs text-slate-400">Business Operating System & Consulting</p>
            <p className="text-xs text-slate-400 mt-1">finance@gangatara.com · +91 98765 43210</p>
          </div>

          <div className="sm:text-right">
            <span className="text-2xl font-black tracking-wider uppercase text-slate-900 dark:text-slate-100 block">
              INVOICE
            </span>
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400 block mt-0.5">
              #{invoice.invoiceNumber}
            </span>
            <div className="mt-2 inline-block">
              <Badge
                tone={
                  invoice.status === "Paid"
                    ? "green"
                    : invoice.status === "Overdue"
                    ? "red"
                    : "amber"
                }
              >
                {invoice.status || "Sent"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Bill To & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">Billed To</h4>
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {invoice.clientName || invoice.clientObj?.company || invoice.clientObj?.name || "Direct Client"}
            </p>
            {invoice.clientObj?.email && <p className="text-slate-500 mt-0.5">{invoice.clientObj.email}</p>}
            {invoice.clientObj?.phone && <p className="text-slate-500">{invoice.clientObj.phone}</p>}
            {invoice.projectName && (
              <p className="text-slate-500 mt-1">
                Project Reference: <strong className="text-slate-700 dark:text-slate-300">{invoice.projectName}</strong>
              </p>
            )}
          </div>

          <div className="sm:text-right flex flex-col sm:items-end gap-1 text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400 mr-2">Invoice Date:</span>
              <span className="font-semibold">{formatDate(invoice.issueDate || invoice.createdAt || new Date())}</span>
            </div>
            <div>
              <span className="text-slate-400 mr-2">Payment Due Date:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{invoice.dueDate ? formatDate(invoice.dueDate) : "Immediate"}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{item.description}</td>
                    <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">₹{Number(item.rate || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">₹{Number(item.amount || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Consulting & Project Milestone</td>
                  <td className="py-3 px-4 text-center text-slate-600">1</td>
                  <td className="py-3 px-4 text-right text-slate-600">₹{Number(subtotal).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">₹{Number(subtotal).toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="w-full sm:w-1/2 text-xs text-slate-500 leading-relaxed">
            <h5 className="font-bold uppercase text-slate-400 mb-1">Notes & Terms</h5>
            <p>{invoice.notes || "Payment is requested to be transferred within the due date."}</p>
          </div>

          <div className="w-full sm:w-1/3 flex flex-col gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">₹{Number(subtotal).toLocaleString()}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax (GST):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">₹{Number(tax).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total:</span>
              <span className="text-primary-600 dark:text-primary-400">₹{Number(total).toLocaleString()}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold pt-1">
                <span>Paid Amount:</span>
                <span>₹{Number(paid).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Balance Due:</span>
              <span>₹{Number(balance).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
