import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, Search, Bell, ChevronDown, LogOut, User, Settings as SettingsIcon,
  Moon, Sun, Volume2, VolumeX, CheckCheck, CheckCircle2, Sparkles, Clock, Users, Trophy
} from "lucide-react";
import { useUI } from "../../context/UIContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Avatar } from "../common";
import { ROLE_LABELS, ROLES } from "../../constants/roles";
import { classNames } from "../../utils/format";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../store/api/apiSlice";
import { playNotificationSound, isSoundEnabled, setSoundEnabled } from "../../utils/notificationSound";

export default function Navbar() {
  const { openDrawer } = useUI();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const [soundActive, setSoundActive] = useState(isSoundEnabled());

  const { data: notifsData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 15000,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const userNotifications = notifsData?.data ?? notifsData ?? [];
  const unread = userNotifications.filter((n) => !n.read).length;

  const prevUnreadRef = useRef(null);

  // Play audio chime when unread notifications increase
  useEffect(() => {
    if (prevUnreadRef.current !== null && unread > prevUnreadRef.current) {
      playNotificationSound("chime");
    }
    prevUnreadRef.current = unread;
  }, [unread]);

  const handleToggleSound = (e) => {
    e.stopPropagation();
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound("chime");
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      try {
        await markRead(n.id || n._id).unwrap();
      } catch (err) {}
    }
    setNotifOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const handleMarkAll = async (e) => {
    e.stopPropagation();
    try {
      await markAllRead().unwrap();
      playNotificationSound("success");
    } catch (err) {}
  };

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
            <div className="absolute right-0 mt-2 w-84 sm:w-96 max-w-[92vw] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-popover animate-slideUp overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</p>
                  {unread > 0 ? (
                    <span className="text-[10px] font-bold bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full">
                      {unread} new
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">All caught up</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className={classNames(
                      "p-1.5 rounded-lg transition-colors text-xs font-medium flex items-center gap-1",
                      soundActive
                        ? "text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-700"
                        : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                    title={soundActive ? "Sound Alert: ON (Click to mute)" : "Sound Alert: MUTED (Click to unmute)"}
                  >
                    {soundActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAll}
                      className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline px-2 py-1 flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} />
                      <span className="hidden sm:inline">Mark read</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
                {userNotifications.length === 0 ? (
                  <div className="py-8 text-center px-4">
                    <Bell className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={24} />
                    <p className="text-xs text-slate-500 dark:text-slate-400">No notifications yet</p>
                  </div>
                ) : (
                  userNotifications.map((n) => (
                    <div
                      key={n.id || n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={classNames(
                        "px-4 py-3 flex gap-3 transition-colors cursor-pointer group",
                        !n.read
                          ? "bg-primary-50/40 hover:bg-primary-50/70 dark:bg-primary-950/20 dark:hover:bg-primary-950/40"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-700/40"
                      )}
                    >
                      <span
                        className={classNames(
                          "mt-1.5 h-2 w-2 rounded-full shrink-0",
                          n.read ? "bg-transparent" : "bg-primary-500 shadow-xs"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message || n.desc}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {n.time || "Recently"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  navigate("/notifications");
                }}
                className="w-full text-center text-xs font-semibold text-primary-600 dark:text-primary-400 py-2.5 border-t border-slate-100 dark:border-slate-700/80 hover:bg-primary-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                View all notifications →
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
