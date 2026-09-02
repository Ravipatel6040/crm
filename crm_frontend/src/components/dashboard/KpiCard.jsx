import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "../common";
import { classNames } from "../../utils/format";

export default function KpiCard({ icon: Icon, title, value, change, positive = true, description, tone = "primary" }) {
  const tones = {
    primary: "bg-primary-50 text-primary-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <Card className="hover:shadow-popover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={classNames("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", tones[tone])}>
            <Icon size={19} />
          </div>
        )}
        {change && (
          <span
            className={classNames(
              "flex items-center gap-0.5 text-xs font-semibold",
              positive ? "text-emerald-600" : "text-red-500"
            )}
          >
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-3.5">{value}</p>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
      {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{description}</p>}
    </Card>
  );
}
