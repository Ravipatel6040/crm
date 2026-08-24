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
        className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary-400 focus-ring"
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
      className="rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2.5 text-sm text-slate-600 focus:border-primary-400 focus-ring cursor-pointer"
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
        active ? "border-primary-300 bg-primary-50 text-primary-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
      )}
      {...props}
    >
      <SlidersHorizontal size={15} />
      {children}
    </button>
  );
}
