import { classNames } from "../../utils/format";

const tones = {
  primary: "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 ring-primary-100 dark:ring-primary-500/20",
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-700",
  green: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-500/20",
  red: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-100 dark:ring-red-500/20",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-500/20",
  blue: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-sky-100 dark:ring-sky-500/20",
  purple: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 ring-violet-100 dark:ring-violet-500/20",
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
