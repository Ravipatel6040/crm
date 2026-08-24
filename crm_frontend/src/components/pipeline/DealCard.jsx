import { Calendar, Flag } from "lucide-react";
import { Avatar, Badge } from "../common";
import { formatCompactCurrency, formatDate } from "../../utils/format";
import { users } from "../../services/mockData";
import { classNames } from "../../utils/format";

const priorityTone = { Low: "slate", Medium: "blue", High: "amber", Critical: "red" };

export default function DealCard({ deal, onDragStart, onClick }) {
  const assignee = users.find((u) => u.id === deal.assignedTo);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-card hover:shadow-popover hover:-translate-y-0.5 transition-all duration-150 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-700 leading-snug">{deal.name}</p>
        <Badge tone={priorityTone[deal.priority] || "slate"} className="shrink-0">{deal.priority}</Badge>
      </div>
      <p className="text-xs text-slate-400 mb-3">{deal.company}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-primary-600">{formatCompactCurrency(deal.budget)}</span>
        <span className="flex items-center gap-1">
          <Calendar size={12} /> {formatDate(deal.nextFollowUp)}
        </span>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5">
          <Avatar name={assignee?.name || "NA"} size="sm" />
          <span className="text-xs text-slate-500 truncate max-w-[90px]">{assignee?.name?.split(" ")[0]}</span>
        </div>
      </div>
    </div>
  );
}
