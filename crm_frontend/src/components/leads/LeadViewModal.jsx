import {
  Modal, Button, Badge, Avatar
} from "../common";
import { formatCurrency, formatDate } from "../../utils/format";
import {
  Mail, Phone, Building2, Calendar, DollarSign, Tag, UserCheck, FileText, Pencil, Trash2
} from "lucide-react";

export default function LeadViewModal({ open, onClose, lead, userName, assigneeName, onEdit, onDelete }) {
  if (!lead) return null;

  const getAssignedName = () => {
    if (lead.assignedUser?.name) return lead.assignedUser.name;
    if (typeof lead.assignedTo === "object" && lead.assignedTo?.name) {
      return lead.assignedTo.name;
    }
    if (typeof userName === "function") {
      try {
        const res = userName(lead.assignedTo);
        if (res) return res;
      } catch (e) {}
    } else if (typeof userName === "string" && userName.trim()) {
      return userName;
    }
    if (typeof assigneeName === "function") {
      try {
        const res = assigneeName(lead);
        if (res) return res;
      } catch (e) {}
    } else if (typeof assigneeName === "string" && assigneeName.trim()) {
      return assigneeName;
    }
    return "Unassigned";
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lead Profile & Details"
      subtitle={`ID: ${lead.id || lead._id || "—"}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {onDelete ? (
            <Button
              variant="ghost"
              tone="danger"
              icon={Trash2}
              onClick={() => {
                onClose();
                onDelete(lead);
              }}
            >
              Delete
            </Button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onEdit && (
              <Button
                icon={Pencil}
                onClick={() => {
                  onClose();
                  onEdit(lead);
                }}
              >
                Edit Lead
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Header Hero Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3.5">
            <Avatar name={lead.name} size="lg" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {lead.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 size={14} className="text-slate-400" />
                {lead.company || "No company provided"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone="slate">{lead.source || "Unknown Source"}</Badge>
            <Badge tone={lead.status === "Won" ? "green" : lead.status === "Lost" ? "red" : "blue"}>
              {lead.status || "New"}
            </Badge>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Contact Details */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Contact Information
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Phone size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Phone</p>
                {lead.phone ? (
                  <a
                    href={`tel:${lead.phone}`}
                    className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline truncate block"
                  >
                    {lead.phone}
                  </a>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Mail size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Email</p>
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                  >
                    {lead.email}
                  </a>
                ) : (
                  <p className="text-slate-500">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Opportunity & Account Manager */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Opportunity Details
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <DollarSign size={15} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Budget</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(lead.budget)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <UserCheck size={15} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Assigned BD</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {getAssignedName()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interested In & Follow-up Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <Tag size={15} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Interested In</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {lead.interestedIn || "General Inquiry"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Calendar size={15} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Next Follow-Up</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : "Not scheduled"}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
              <FileText size={14} /> Notes & History
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {lead.notes}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
