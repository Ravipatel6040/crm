import { useMemo, useState, useEffect } from "react";
import {
  Clock, Calendar, CheckCircle2, AlertCircle, MessageSquare,
  Plus, Eye, CalendarClock, ArrowUpRight, Search, Filter
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Table, Tr, Td, Badge, Avatar, SearchBar, FilterSelect, Button,
  Pagination, EmptyState, Modal, Field, Input, Select, Textarea, useToast,
  LoadingState
} from "../../components/common";
import LeadViewModal from "../../components/leads/LeadViewModal";
import { useAuth } from "../../context/AuthContext";
import { formatDate, classNames } from "../../utils/format";
import usePagination from "../../hooks/usePagination";
import {
  useGetLeadsQuery,
  useUpdateLeadMutation,
  useGetUsersQuery
} from "../../store/api/apiSlice";

// Modal to schedule or reschedule a follow-up
function ScheduleModal({ open, onClose, onSave, leads = [], initialLead = null }) {
  const [leadId, setLeadId] = useState(initialLead?.id || initialLead?._id || leads[0]?.id || leads[0]?._id || "");
  const [followUpDate, setFollowUpDate] = useState("");
  const [type, setType] = useState("Call");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Follow-up");
  const [error, setError] = useState("");

  const handleOpen = () => {
    if (initialLead) {
      setLeadId(initialLead.id || initialLead._id);
      const d = initialLead.nextFollowUp ? new Date(initialLead.nextFollowUp).toISOString().split("T")[0] : "";
      setFollowUpDate(d);
      setNotes(initialLead.notes || "");
      setStatus(initialLead.status || "Follow-up");
    } else {
      setLeadId(leads[0]?.id || leads[0]?._id || "");
      setFollowUpDate("");
      setNotes("");
      setStatus("Follow-up");
    }
    setError("");
  };

  useEffect(() => {
    if (open) {
      handleOpen();
    }
  }, [open, initialLead]);

  const submit = () => {
    if (!leadId) {
      setError("Please select a lead");
      return;
    }
    if (!followUpDate) {
      setError("Follow-up date is required");
      return;
    }
    onSave({
      id: leadId,
      nextFollowUp: new Date(followUpDate).toISOString(),
      notes: notes.trim() ? `[${type}] ${notes}` : `[${type}] Follow-up scheduled`,
      status,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialLead ? `Reschedule Follow-up: ${initialLead.name}` : "Schedule Follow-up"}
      subtitle="Keep your sales momentum going with timely prospect engagement"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initialLead ? "Save Schedule" : "Schedule Now"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-3 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg">
            {error}
          </div>
        )}

        {!initialLead && (
          <Field label="Select Lead" required>
            <Select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">Choose a prospect lead...</option>
              {leads.map((l) => (
                <option key={l.id || l._id} value={l.id || l._id}>
                  {l.name} — {l.company} ({l.status})
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Follow-up Date" required>
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </Field>
          <Field label="Channel / Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Phone Call">Phone Call</option>
              <option value="Virtual Meeting">Virtual Meeting</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
              <option value="Product Demo">Product Demo</option>
            </Select>
          </Field>
        </div>

        <Field label="Pipeline Stage">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Follow-up">Follow-up</option>
            <option value="Contacted">Contacted</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
          </Select>
        </Field>

        <Field label="Follow-up Notes / Agenda">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Discuss revised quote, send commercial proposal, confirm demo feedback..."
            rows={3}
          />
        </Field>
      </div>
    </Modal>
  );
}

export default function FollowUps() {
  const toast = useToast();
  const { user } = useAuth();
  const isSales = user?.role === "BD_SALES";

  const { data: leadsData, isLoading, refetch } = useGetLeadsQuery();
  const { data: usersData } = useGetUsersQuery();
  const [updateLead] = useUpdateLeadMutation();

  const rawLeads = leadsData?.data ?? leadsData ?? [];
  const users = usersData?.data ?? usersData ?? [];

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("today"); // "today" | "overdue" | "upcoming" | "all"
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [rescheduleLead, setRescheduleLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);

  // Helper date classifiers
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Filter leads based on role & follow-up data
  const relevantLeads = useMemo(() => {
    return rawLeads.filter((l) => {
      if (isSales) {
        const isMine =
          l.assignedTo === user?.id ||
          l.assignedTo === user?._id ||
          l.assignedUser?.id === user?.id ||
          l.assignedUser?.id === user?._id;
        return isMine;
      }
      return true;
    });
  }, [rawLeads, isSales, user]);

  // Calculate counts for badges
  const counts = useMemo(() => {
    let today = 0;
    let overdue = 0;
    let upcoming = 0;
    let total = 0;

    relevantLeads.forEach((l) => {
      if (!l.nextFollowUp) return;
      total++;
      const d = new Date(l.nextFollowUp);
      if (d >= todayStart && d <= todayEnd) {
        today++;
      } else if (d < todayStart) {
        overdue++;
      } else if (d > todayEnd) {
        upcoming++;
      }
    });

    return { today, overdue, upcoming, total };
  }, [relevantLeads, todayStart, todayEnd]);

  // Filter leads based on active tab and search
  const filtered = useMemo(() => {
    return relevantLeads.filter((l) => {
      // Must have follow-up date or follow-up status
      const hasFollowUp = !!l.nextFollowUp || l.status === "Follow-up";
      if (!hasFollowUp) return false;

      // Tab filter
      if (l.nextFollowUp) {
        const d = new Date(l.nextFollowUp);
        if (tab === "today" && !(d >= todayStart && d <= todayEnd)) return false;
        if (tab === "overdue" && !(d < todayStart)) return false;
        if (tab === "upcoming" && !(d > todayEnd)) return false;
      } else {
        if (tab === "today" || tab === "overdue" || tab === "upcoming") return false;
      }

      // Search query filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = l.name?.toLowerCase().includes(q);
        const matchesCompany = l.company?.toLowerCase().includes(q);
        const matchesNotes = l.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesCompany && !matchesNotes) return false;
      }

      return true;
    });
  }, [relevantLeads, tab, search, todayStart, todayEnd]);

  const { page, setPage, totalPages, pageItems, pageSize, totalItems } = usePagination(filtered, 8);

  const handleSaveSchedule = async (payload) => {
    try {
      await updateLead(payload).unwrap();
      toast?.push("Follow-up scheduled successfully");
      setScheduleModalOpen(false);
      setRescheduleLead(null);
    } catch (err) {
      toast?.push(err?.data?.message || "Error scheduling follow-up", "error");
    }
  };

  const handleMarkDone = async (lead) => {
    try {
      await updateLead({
        id: lead.id || lead._id,
        status: "Proposal",
        notes: lead.notes ? `${lead.notes} (Follow-up completed on ${new Date().toLocaleDateString()})` : "Follow-up completed",
      }).unwrap();
      toast?.push(`Follow-up marked complete for ${lead.name}`);
    } catch (err) {
      toast?.push("Error updating lead status", "error");
    }
  };

  const getFollowUpBadge = (dateStr) => {
    if (!dateStr) return <Badge tone="slate">No date</Badge>;
    const d = new Date(dateStr);
    if (d >= todayStart && d <= todayEnd) {
      return <Badge tone="amber">Due Today</Badge>;
    }
    if (d < todayStart) {
      const diffDays = Math.ceil((todayStart - d) / (1000 * 60 * 60 * 24));
      return <Badge tone="red">{diffDays}d Overdue</Badge>;
    }
    return <Badge tone="primary">Upcoming</Badge>;
  };

  const assigneeName = (lead) => {
    if (!lead) return "Unassigned";
    if (typeof lead === "string") {
      const u = users.find((x) => x.id === lead || x._id === lead);
      return u?.name || "Unassigned";
    }
    if (lead.assignedUser?.name) return lead.assignedUser.name;
    const u = users.find((x) => x.id === lead.assignedTo || x._id === lead.assignedTo);
    return u?.name || "Unassigned";
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Follow-ups"
        subtitle={
          isSales
            ? "Your scheduled prospect follow-ups, calls, and upcoming client meetings"
            : "Monitor and manage company-wide sales pipeline follow-ups"
        }
        action={
          <Button
            icon={Plus}
            onClick={() => {
              setRescheduleLead(null);
              setScheduleModalOpen(true);
            }}
          >
            Schedule Follow-up
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="p-4" className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Due Today</p>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{counts.today}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Urgent client touches</p>
        </Card>

        <Card padding="p-4" className="border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overdue</p>
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{counts.overdue}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Needs immediate call</p>
        </Card>

        <Card padding="p-4" className="border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming</p>
            <CalendarClock size={16} className="text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{counts.upcoming}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Future engagements</p>
        </Card>

        <Card padding="p-4" className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Active</p>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{counts.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">In follow-up funnel</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card padding="p-4 sm:p-5">
        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setTab("today")}
              className={classNames(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5",
                tab === "today"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}
            >
              Today <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold">{counts.today}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("overdue")}
              className={classNames(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5",
                tab === "overdue"
                  ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}
            >
              Overdue <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold">{counts.overdue}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={classNames(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5",
                tab === "upcoming"
                  ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}
            >
              Upcoming <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold">{counts.upcoming}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("all")}
              className={classNames(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
                tab === "all"
                  ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}
            >
              All ({counts.total})
            </button>
          </div>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search lead, company or notes..."
            className="w-full sm:w-72"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState label="Loading follow-up schedules..." />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={tab === "today" ? "No follow-ups due today" : tab === "overdue" ? "No overdue follow-ups" : "No follow-ups found"}
            description={
              tab === "today"
                ? "You are completely caught up for today! Schedule upcoming calls or follow-ups to stay ahead."
                : "Schedule a follow-up with any prospect lead to keep your pipeline moving."
            }
            action={
              <Button icon={Plus} onClick={() => setScheduleModalOpen(true)}>
                Schedule a Follow-up
              </Button>
            }
          />
        ) : (
          <>
            <Table
              headers={["Prospect / Lead", "Follow-up Date", "Status", "Assigned BD", "Notes / Agenda", "Actions"]}
            >
              {pageItems.map((lead) => (
                <Tr key={lead.id || lead._id}>
                  {/* Lead Name & Company */}
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.name} size="sm" />
                      <div>
                        <button
                          type="button"
                          onClick={() => setViewingLead(lead)}
                          className="font-semibold text-slate-800 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 text-left transition-colors"
                        >
                          {lead.name}
                        </button>
                        <p className="text-xs text-slate-400">{lead.company}</p>
                      </div>
                    </div>
                  </Td>

                  {/* Date & Alert Badge */}
                  <Td>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : "Not Set"}
                      </span>
                      <div>{getFollowUpBadge(lead.nextFollowUp)}</div>
                    </div>
                  </Td>

                  {/* Stage */}
                  <Td>
                    <Badge tone={lead.status === "Won" ? "green" : lead.status === "Lost" ? "red" : "blue"}>
                      {lead.status}
                    </Badge>
                  </Td>

                  {/* Assigned Rep */}
                  <Td>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {assigneeName(lead)}
                    </span>
                  </Td>

                  {/* Notes */}
                  <Td>
                    <p className="text-xs text-slate-500 max-w-xs truncate" title={lead.notes || "No notes logged"}>
                      {lead.notes || "No notes recorded"}
                    </p>
                  </Td>

                  {/* Actions */}
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Reschedule Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleLead(lead);
                          setScheduleModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer"
                        title="Reschedule this follow-up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        Reschedule
                      </button>

                      {/* Mark Done */}
                      <button
                        type="button"
                        onClick={() => handleMarkDone(lead)}
                        title="Mark follow-up done and progress to proposal"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Done
                      </button>

                      {/* View Lead Details */}
                      <button
                        type="button"
                        onClick={() => setViewingLead(lead)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                        title="View Full Lead Details"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </>
        )}
      </Card>

      {/* Schedule / Reschedule Modal */}
      {scheduleModalOpen && (
        <ScheduleModal
          open={scheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setRescheduleLead(null);
          }}
          onSave={handleSaveSchedule}
          leads={relevantLeads}
          initialLead={rescheduleLead}
        />
      )}

      {/* View Lead Details Modal */}
      {viewingLead && (
        <LeadViewModal
          open={!!viewingLead}
          onClose={() => setViewingLead(null)}
          lead={viewingLead}
          userName={assigneeName}
          assigneeName={assigneeName(viewingLead)}
        />
      )}
    </div>
  );
}
