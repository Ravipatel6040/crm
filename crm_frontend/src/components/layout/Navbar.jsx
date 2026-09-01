import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, ChevronDown, LogOut, User, Settings as SettingsIcon, Moon, Sun } from "lucide-react";
import { useUI } from "../../context/UIContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Avatar } from "../common";
import { ROLE_LABELS, ROLES } from "../../constants/roles";
import { classNames } from "../../utils/format";

function getRoleNotifications(role) {
  const time = "10 mins ago";
  const defaults = [{ id: 1, title: "System Update", desc: "CRM v2.0 deployed successfully.", time, read: false }];
  
  if (role === ROLES.SALES) return [
    { id: 101, title: "Follow-up due", desc: "Call with ABC Corp is due today.", time, read: false },
    { id: 102, title: "New lead assigned", desc: "You have a new hot lead from Website.", time: "1 hr ago", read: false },
    { id: 103, title: "Proposal accepted", desc: "Client XYZ accepted your proposal.", time: "2 hrs ago", read: true }
  ];
  if (role === ROLES.MARKETING) return [
    { id: 201, title: "Campaign completed", desc: "Summer Sale campaign ended.", time, read: false },
    { id: 202, title: "New lead generated", desc: "Facebook ad generated 15 new leads.", time: "30 mins ago", read: false }
  ];
  if (role === ROLES.PROJECT_MANAGER) return [
    { id: 301, title: "Task overdue", desc: "Database migration task is overdue.", time, read: false },
    { id: 302, title: "New requirement", desc: "Client added a new requirement.", time: "2 hrs ago", read: true },
    { id: 303, title: "Client approval pending", desc: "Waiting for client sign-off on design.", time: "3 hrs ago", read: false }
  ];
  if (role === ROLES.FINANCE) return [
    { id: 401, title: "Invoice overdue", desc: "Invoice #1024 is now 5 days overdue.", time, read: false },
    { id: 402, title: "Payment received", desc: "₹50,000 received from Acme Corp.", time: "1 hr ago", read: false }
  ];
  
  return defaults;
}

export default function Navbar() {
  const { openDrawer } = useUI();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const userNotifications = getRoleNotifications(user?.role);
  const unread = userNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    function onClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const isAdmin = user?.role === ROLES.ADMIN;
  const displayName = (user?.name && user?.name !== "User")
    ? user.name
    : (isAdmin ? "Admin" : (user?.name || "User"));
  const showRoleSubtitle = !isAdmin || (user?.name && user.name !== "Admin" && user.name !== "User");

  return (
    <header className="h-16 shrink-0 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={openDrawer}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring"
        >
          <Menu size={20} />
        </button>
        <div className="relative hidden sm:block w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search leads, clients, projects..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-400 focus-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring"
          >
            <Bell size={19} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center font-semibold">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-popover animate-slideUp overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notifications</p>
                <span className="text-xs text-primary-600 font-medium">{unread} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {userNotifications.map((n) => (
                  <div key={n.id} className={classNames("px-4 py-3 border-b border-slate-50 last:border-0 flex gap-3", !n.read && "bg-primary-50/40")}>
                    <span className={classNames("mt-1.5 h-2 w-2 rounded-full shrink-0", n.read ? "bg-slate-200" : "bg-primary-500")} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.desc}</p>
                      <p className="text-[11px] text-slate-300 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setNotifOpen(false); navigate("/notifications"); }}
                className="w-full text-center text-xs font-medium text-primary-600 py-2.5 hover:bg-primary-50"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring"
          >
            <Avatar name={displayName} size="sm" />
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{displayName}</p>
              {showRoleSubtitle && (
                <p className="text-[11px] text-slate-400">{ROLE_LABELS[user?.role]}</p>
              )}
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden md:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-popover animate-slideUp overflow-hidden py-1.5">
              <button onClick={() => { setProfileOpen(false); navigate("/profile"); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                <User size={15} /> My Profile
              </button>
              <button onClick={() => { setProfileOpen(false); navigate("/settings"); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                <SettingsIcon size={15} /> Settings
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1.5" />
              <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
