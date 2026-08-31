import { useEffect } from "react";
import { X } from "lucide-react";
import { classNames } from "../../utils/format";

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fadeIn"
        onClick={onClose}
      />
      <div
        className={classNames(
          "relative w-full bg-white dark:bg-slate-800 shadow-popover animate-slideUp",
          "rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col",
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition focus-ring"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
