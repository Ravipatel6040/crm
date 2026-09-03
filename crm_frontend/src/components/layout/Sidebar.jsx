import { NavLink, useLocation } from "react-router-dom";
import { X, Layers, ChevronsLeft } from "lucide-react";
import { NAV_SECTIONS } from "../../constants/navigation";
import { useUI } from "../../context/UIContext";
import { useAuth } from "../../context/AuthContext";
import { canAccess } from "../../constants/roles";
import { classNames } from "../../utils/format";

function NavItem({ item, collapsed, onNavigate }) {
  const location = useLocation();
  const Icon = item.icon;

  const currentFull = location.pathname + location.search;
  const isSelected = item.to.includes("?")
    ? currentFull === item.to
    : location.pathname === item.to && !location.search;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={
        classNames(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring",
          isSelected
            ? "bg-primary-500 text-white shadow-sm shadow-primary-500/30"
            : "text-slate-500 hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-700 dark:text-slate-400 dark:hover:text-primary-400"
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function SidebarContent({ collapsed, onNavigate }) {
  const { user } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className={classNames("flex items-center gap-2.5 px-4 h-16 shrink-0 border-b border-slate-100 dark:border-slate-800", collapsed && "justify-center px-0")}>
        <div className="h-9 w-9 rounded-xl bg-primary-500 flex items-center justify-center text-white shrink-0">
          <Layers size={18} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">CRM Gangatara</p>
            <p className="text-[11px] text-slate-400">Business Operating System</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((i) => canAccess(user, i.key));
          if (items.length === 0) return null;
          return (
            <div key={section.title} className="mb-5">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <NavItem key={item.key} item={item} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { collapsed, toggleCollapsed, drawerOpen, closeDrawer } = useUI();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={classNames(
          "hidden lg:flex flex-col shrink-0 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 relative",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-16 h-6 w-6 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 focus-ring"
        >
          <ChevronsLeft size={13} className={classNames("transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 animate-fadeIn" onClick={closeDrawer} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 shadow-popover animate-slideIn flex flex-col">
            <div className="flex items-center justify-end px-3 pt-3">
              <button onClick={closeDrawer} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 -mt-3 overflow-hidden">
              <SidebarContent collapsed={false} onNavigate={closeDrawer} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
