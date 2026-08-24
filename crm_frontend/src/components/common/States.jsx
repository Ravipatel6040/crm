import { Inbox, AlertOctagon, Loader2 } from "lucide-react";
import Button from "./Button";

export function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-2xl bg-primary-50 text-primary-400 flex items-center justify-center mb-4">
        <Icon size={26} />
      </div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {description && <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
      <Loader2 size={26} className="animate-spin text-primary-400" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description = "Please try again in a moment.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center mb-4">
        <AlertOctagon size={26} />
      </div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>
      {onRetry && (
        <Button className="mt-4" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3.5 border-b border-slate-50 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
