import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, Trash2, Volume2, VolumeX, ExternalLink,
  Clock, Calendar, Users, Trophy, Sparkles, Filter, Search, CheckCircle2
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { Card, Badge, Button, EmptyState, LoadingState, useToast } from "../../components/common";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../store/api/apiSlice";
import { playNotificationSound, isSoundEnabled, setSoundEnabled } from "../../utils/notificationSound";
import { classNames } from "../../utils/format";

export default function Notifications() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("all"); // "all" | "unread" | "read"
  const [search, setSearch] = useState("");
  const [soundActive, setSoundActive] = useState(isSoundEnabled());

  const { data: notificationsData, isLoading } = useGetNotificationsQuery(undefined, {
    pollingInterval: 20000,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const notifications = notificationsData?.data ?? notificationsData ?? [];

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound("chime");
      toast?.push("Notification sound enabled");
    } else {
      toast?.push("Notification sound muted", "info");
    }
  };

  const handleTestSound = () => {
    playNotificationSound("chime");
    toast?.push("Sound test played", "info");
  };

  const handleMarkOne = async (id) => {
    try {
      await markRead(id).unwrap();
    } catch (e) {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap();
      playNotificationSound("success");
      toast?.push("All notifications marked as read");
    } catch (e) {
      toast?.push("Failed to mark notifications as read", "error");
    }
  };

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (tab === "unread" && n.read) return false;
      if (tab === "read" && !n.read) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(q);
        const matchesDesc = (n.message || n.desc)?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [notifications, tab, search]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case "FOLLOW_UP_DUE":
        return <Clock className="text-amber-500" size={18} />;
      case "LEAD_ASSIGNED":
      case "LEAD_CREATED":
        return <Users className="text-blue-500" size={18} />;
      case "DEAL_WON":
        return <Trophy className="text-emerald-500" size={18} />;
      case "SYSTEM":
        return <Sparkles className="text-purple-500" size={18} />;
      default:
        return <Bell className="text-primary-500" size={18} />;
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle="Stay up to date with assigned leads, customer touches, and pipeline activity"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={soundActive ? Volume2 : VolumeX}
              onClick={handleToggleSound}
              title={soundActive ? "Mute notification sounds" : "Enable notification sounds"}
            >
              Sound: {soundActive ? "On" : "Off"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Volume2}
              onClick={handleTestSound}
              title="Test notification chime"
            >
              Test Sound
            </Button>
            {unreadCount > 0 && (
              <Button
                size="sm"
                icon={CheckCheck}
                onClick={handleMarkAll}
                disabled={isMarkingAll}
              >
                Mark all as read
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab("all")}
            className={classNames(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
              tab === "all"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            )}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setTab("unread")}
            className={classNames(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5",
              tab === "unread"
                ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className="h-4 min-w-4 px-1 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("read")}
            className={classNames(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
              tab === "read"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
            )}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter notifications..."
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Notifications List */}
      <Card className="p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {isLoading ? (
          <div className="p-12">
            <LoadingState label="Loading notifications..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Bell}
              title={tab === "unread" ? "No unread notifications" : "No notifications found"}
              description={
                tab === "unread"
                  ? "You're all caught up! New notifications will sound automatically when they arrive."
                  : "Notifications from assigned leads, scheduled follow-ups, and activity will appear here."
              }
            />
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id || item._id}
              onClick={() => {
                if (!item.read) handleMarkOne(item.id || item._id);
                if (item.link) navigate(item.link);
              }}
              className={classNames(
                "p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer group",
                !item.read
                  ? "bg-primary-50/30 hover:bg-primary-50/60 dark:bg-primary-950/20 dark:hover:bg-primary-950/40"
                  : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {item.title}
                  </span>
                  {!item.read && (
                    <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                  )}
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto shrink-0">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {item.message || item.desc}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                {!item.read && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkOne(item.id || item._id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
                {item.link && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!item.read) handleMarkOne(item.id || item._id);
                      navigate(item.link);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
                    title="Open details"
                  >
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
