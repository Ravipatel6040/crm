import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLES, ROLE_LABELS } from "../../constants/roles";
import { classNames } from "../../utils/format";

const ROLE_ORDER = [ROLES.ADMIN, ROLES.SALES, ROLES.MARKETING, ROLES.PROJECT_MANAGER, ROLES.FINANCE];

export default function RoleTabs() {
  const { user, switchRole } = useAuth();

  return (
    <div className="h-11 shrink-0 border-b border-slate-100 bg-slate-50/70 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 pr-1 shrink-0">
        <ShieldCheck size={13} /> Preview as:
      </span>
      {ROLE_ORDER.map((role) => (
        <button
          key={role}
          onClick={() => switchRole(role)}
          className={classNames(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors focus-ring shrink-0",
            user?.role === role
              ? "bg-primary-500 text-white shadow-sm shadow-primary-500/30"
              : "text-slate-500 bg-white border border-slate-200 hover:bg-primary-50 hover:text-primary-700"
          )}
        >
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}
