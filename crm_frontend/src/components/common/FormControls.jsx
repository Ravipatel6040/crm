import { classNames } from "../../utils/format";

const baseField =
  "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:border-primary-400 focus-ring";

export function Field({ label, required, error, hint, children, className = "" }) {
  return (
    <div className={classNames("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function Input({ className = "", error, ...props }) {
  return (
    <input
      className={classNames(baseField, error && "border-red-300 focus:border-red-400", className)}
      {...props}
    />
  );
}

export function Textarea({ className = "", error, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={classNames(baseField, "resize-none", error && "border-red-300 focus:border-red-400", className)}
      {...props}
    />
  );
}

export function Select({ className = "", error, children, ...props }) {
  return (
    <select
      className={classNames(baseField, "cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%2394a3b8%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px] pr-9", error && "border-red-300", className)}
      {...props}
    >
      {children}
    </select>
  );
}
