import { Loader2 } from "lucide-react";
import { classNames } from "../../utils/format";

const variants = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-sm shadow-primary-500/20",
  secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100",
  outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-500 text-white hover:bg-red-600",
  white: "bg-white text-primary-700 border border-primary-100 hover:bg-primary-50",
};

const sizes = {
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
