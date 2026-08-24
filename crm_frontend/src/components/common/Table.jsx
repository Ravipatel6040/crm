import { classNames } from "../../utils/format";

export default function Table({ columns, children, className = "" }) {
  return (
    <div className={classNames("w-full overflow-x-auto rounded-xl border border-slate-100", className)}>
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50/80">
            {columns.map((col) => (
              <th
                key={col}
                className="text-left font-medium text-slate-500 text-xs uppercase tracking-wide px-4 py-3 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, className = "", ...props }) {
  return (
    <tr className={classNames("hover:bg-primary-50/40 transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}

export function Td({ children, className = "" }) {
  return <td className={classNames("px-4 py-3.5 text-slate-700 align-middle", className)}>{children}</td>;
}
