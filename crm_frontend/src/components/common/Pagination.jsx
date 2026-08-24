import { ChevronLeft, ChevronRight } from "lucide-react";
import { classNames } from "../../utils/format";

export default function Pagination({ page, totalPages, onChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-sm">
      <span className="text-xs text-slate-400">
        Showing <span className="font-medium text-slate-600">{start}-{end}</span> of{" "}
        <span className="font-medium text-slate-600">{totalItems}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 focus-ring"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-slate-300">…</span>}
            <button
              onClick={() => onChange(p)}
              className={classNames(
                "h-8 min-w-8 px-2 rounded-lg text-xs font-medium transition focus-ring",
                p === page ? "bg-primary-500 text-white" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {p}
            </button>
          </span>
        ))}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 focus-ring"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
