import { Loader2 } from "lucide-react";
import { classNames } from "../../utils/format";

const variants = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-sm shadow-primary-500/20",
  secondary: "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20",
  outline: "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
  ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
  danger: "bg-red-500 text-white hover:bg-red-600",
  white: "bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-slate-700",
};

const sizes = {
  xs: "text-[11px] px-2.5 py-1 gap-1",
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-sm px-5 py-2.5 gap-2",
  icon: "p-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classNames(
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={16} />}
          {children}
          {Icon && iconPosition === "right" && <Icon size={16} />}
        </>
      )}
    </button>
  );
}
