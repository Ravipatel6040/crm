import { Code2, Megaphone, TrendingUp, Landmark, Coffee, Briefcase, Layers, HelpCircle } from "lucide-react";

// Used only until Settings finishes loading — must match DEFAULT_OPTIONS on the
// backend (settings.model.js).
export const FALLBACK_DEPARTMENTS = [
  "Development", "Marketing", "Sales", "Finance", "Day-to-day Office", "Administration",
];

// Expenses recorded before departments existed have none.
export const UNASSIGNED = "Unassigned";

const meta = (Icon, badge, icon) => ({ Icon, badge, icon });

const DEPARTMENT_META = {
  Development: meta(Code2, "blue", "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"),
  Marketing: meta(Megaphone, "amber", "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"),
  Sales: meta(TrendingUp, "green", "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"),
  Finance: meta(Landmark, "primary", "bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300"),
  "Day-to-day Office": meta(Coffee, "purple", "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300"),
  Administration: meta(Briefcase, "slate", "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300"),
  [UNASSIGNED]: meta(HelpCircle, "slate", "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400"),
};

// Departments an admin adds in Settings get a neutral look.
const CUSTOM = meta(Layers, "slate", "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300");

export const departmentMeta = (name) => DEPARTMENT_META[name] || CUSTOM;
