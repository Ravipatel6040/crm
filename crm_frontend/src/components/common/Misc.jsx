import { useState } from "react";
import { classNames, initials } from "../../utils/format";

export function Avatar({ name, size = "md", color }) {
  const sizes = { sm: "h-6 w-6 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" };
  return (
    <div
      className={classNames(
        "flex items-center justify-center rounded-full font-semibold shrink-0",
        color || "bg-primary-100 text-primary-700",
        sizes[size]
      )}
    >
      {initials(name)}
    </div>
  );
}

export function ProgressBar({ value, className = "", tone = "primary" }) {
  const tones = {
    primary: "bg-primary-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  return (
    <div className={classNames("h-2 w-full rounded-full bg-slate-100 overflow-hidden", className)}>
      <div
        className={classNames("h-full rounded-full transition-all duration-500", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-100 overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={classNames(
            "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition focus-ring",
            active === t ? "border-primary-500 text-primary-700" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function Tooltip({ label, children }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[11px] text-white shadow-lg animate-fadeIn">
          {label}
        </span>
      )}
    </span>
  );
}
