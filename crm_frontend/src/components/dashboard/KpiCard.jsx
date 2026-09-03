import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { classNames } from "../../utils/format";

const tones = {
  primary: {
    icon: "bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300",
    accent: "from-primary-500/70",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    accent: "from-emerald-500/70",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    accent: "from-amber-500/70",
  },
  red: {
    icon: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    accent: "from-red-500/70",
  },
  slate: {
    icon: "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
    accent: "from-slate-400/60",
  },
};

export default function KpiCard({
  icon: Icon,
  title,
  value,
  change,
  positive = true,
  description,
  tone = "primary",
  onClick,
}) {
  const t = tones[tone] || tones.primary;
  const interactive = typeof onClick === "function";

  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
      className={classNames(
        "group relative overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-200",
        "border-slate-200/80 shadow-[0_1px_2px_rgba(16,25,58,0.04)]",
        "dark:border-slate-700/60 dark:bg-slate-800/80",
        interactive &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_-8px_rgba(16,25,58,0.18)] dark:hover:border-slate-600"
      )}
    >
      {/* Top accent, revealed on hover */}
      <span
        className={classNames(
          "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          t.accent
        )}
      />

      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div className={classNames("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", t.icon)}>
            <Icon size={19} />
          </div>
        )}
        {change != null && change !== "" && (
          <span
            className={classNames(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
              positive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
            )}
          >
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </span>
        )}
      </div>

      <p className="mt-3.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
      {description && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{description}</p>
      )}
    </div>
  );
}
