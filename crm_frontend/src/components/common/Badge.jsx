import { classNames } from "../../utils/format";

const tones = {
  primary: "bg-primary-50 text-primary-700 ring-primary-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  purple: "bg-violet-50 text-violet-700 ring-violet-100",
};

// Central mapping so status colors stay consistent across the whole app.
export const STATUS_TONE = {
  New: "blue",
  Contacted: "purple",
  Qualified: "amber",
  Meeting: "primary",
  "Proposal Sent": "primary",
  Negotiation: "amber",
  Won: "green",
  Lost: "red",

  Active: "green",
  "On Hold": "amber",
  Inactive: "slate",

  Planning: "blue",
  "In Progress": "primary",
  Completed: "green",
  Cancelled: "red",

  Todo: "slate",
  Review: "purple",

  Paid: "green",
  Pending: "amber",
  Overdue: "red",
  "Partially Paid": "blue",

  Low: "slate",
  Medium: "blue",
  High: "amber",
  Critical: "red",
};

export default function Badge({ children, tone, dot = false, className = "" }) {
  const resolvedTone = tone || STATUS_TONE[children] || "slate";
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        tones[resolvedTone] || tones.slate,
        className
      )}
    >
      {dot && <span className={classNames("h-1.5 w-1.5 rounded-full", tones[resolvedTone]?.split(" ")[1]?.replace("text", "bg") || "bg-slate-400")} />}
      {children}
    </span>
  );
}
