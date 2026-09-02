import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { classNames } from "../../utils/format";

export default function ActionsMenu({ actions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-ring"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-popover overflow-hidden py-1.5 animate-slideUp">
          {actions.map((a, i) =>
            a.divider ? (
              <div key={i} className="h-px bg-slate-100 dark:bg-slate-700 my-1.5" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  a.onClick?.(e);
                }}
                className={classNames(
                  "w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-left",
                  a.danger ? "text-red-500" : "text-slate-600 dark:text-slate-300"
                )}
              >
                {a.icon && <a.icon size={15} />}
                {a.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
