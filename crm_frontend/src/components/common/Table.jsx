import { classNames } from "../../utils/format";

export default function Table({ columns, headers, children, className = "" }) {
  const cols = columns || headers || [];
  return (
    <div className={classNames("w-full overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800", className)}>
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-slate-800/80">
            {cols.map((col, idx) => {
              const label = typeof col === "string" ? col : col.label;
              const isAction =
                (typeof col === "string" && col.toLowerCase() === "actions") ||
                (typeof col === "object" && col.align === "right");
              return (
                <th
                  key={typeof col === "string" ? col : idx}
                  className={classNames(
                    "font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide px-4 py-3 whitespace-nowrap",
                    isAction ? "text-right" : "text-left"
                  )}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, className = "", ...props }) {
  return (
    <tr className={classNames("hover:bg-primary-50/40 dark:hover:bg-slate-800/50 transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}

export function Td({ children, className = "" }) {
  return <td className={classNames("px-4 py-3.5 text-slate-700 dark:text-slate-300 align-middle", className)}>{children}</td>;
}
