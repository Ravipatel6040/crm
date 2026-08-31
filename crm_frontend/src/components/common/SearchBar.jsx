import { Search, SlidersHorizontal, X } from "lucide-react";
import { classNames } from "../../utils/format";

export function SearchBar({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={classNames("relative", className)}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-8 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary-400 focus-ring"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, label }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3 pr-8 py-2.5 text-sm text-slate-600 dark:text-slate-300 focus:border-primary-400 focus-ring cursor-pointer"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function FilterButton({ active, children, ...props }) {
  return (
    <button
      className={classNames(
        "inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition focus-ring",
        active ? "border-primary-300 dark:border-primary-500/30 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
      {...props}
    >
      <SlidersHorizontal size={15} />
      {children}
    </button>
  );
}
