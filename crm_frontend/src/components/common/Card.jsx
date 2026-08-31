import { classNames } from "../../utils/format";

export default function Card({ children, className = "", padding = "p-5", as: Comp = "div", ...props }) {
  return (
    <Comp
      className={classNames(
        "bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-card",
        padding,
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={classNames("flex items-start justify-between gap-3 mb-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
