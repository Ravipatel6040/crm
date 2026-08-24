import { useState } from "react";
import { UserPlus, CalendarClock, FileCheck2, Wallet, AlertTriangle, CheckSquare, MessageCircle, CheckCheck } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { Card, Badge, Button, EmptyState, useToast } from "../../components/common";
import { notifications as initialNotifications } from "../../services/mockData";
import { classNames } from "../../utils/format";

const typeMeta = {
  lead: { icon: UserPlus, tone: "primary" },
  followup: { icon: CalendarClock, tone: "amber" },
  proposal: { icon: FileCheck2, tone: "green" },
  payment: { icon: Wallet, tone: "blue" },
  task: { icon: CheckSquare, tone: "purple" },
  message: { icon: MessageCircle, tone: "slate" },
};

export default function Notifications() {
  const toast = useToast();
  const [notifs, setNotifs] = useState(initialNotifications);
  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
    toast?.push("All notifications marked as read");
  };

  const markRead = (id) => setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread notifications`}
        action={unread > 0 && <Button variant="outline" icon={CheckCheck} onClick={markAllRead}>Mark all as read</Button>}
      />

      <Card padding="p-2 sm:p-3">
        {notifs.length === 0 ? (
          <EmptyState title="You're all caught up" description="No new notifications." />
        ) : (
          <div className="flex flex-col divide-y divide-slate-50">
            {notifs.map((n) => {
              const meta = typeMeta[n.type] || typeMeta.message;
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={classNames(
                    "flex items-start gap-3.5 text-left px-3 py-3.5 rounded-xl transition-colors hover:bg-slate-50",
                    !n.read && "bg-primary-50/40"
                  )}
                >
                  <div className={classNames("h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    meta.tone === "primary" && "bg-primary-50 text-primary-600",
                    meta.tone === "amber" && "bg-amber-50 text-amber-600",
                    meta.tone === "green" && "bg-emerald-50 text-emerald-600",
                    meta.tone === "blue" && "bg-sky-50 text-sky-600",
                    meta.tone === "purple" && "bg-violet-50 text-violet-600",
                    meta.tone === "slate" && "bg-slate-100 text-slate-500",
                  )}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700">{n.title}</p>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
                    <p className="text-[11px] text-slate-300 mt-1">{n.time}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
