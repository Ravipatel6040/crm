import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Layers, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { Button, Field, Input, Select, useToast } from "../../components/common";
import { ROLE_LABELS, ROLES } from "../../constants/roles";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", role: ROLES.ADMIN, remember: true });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});

  const { push: showToast } = useToast();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse(form);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errs = {};
        err.errors.forEach((e) => {
          errs[e.path[0]] = e.message;
        });
        setErrors(errs);
        showToast("Please fix the errors in the form.", "error");
        return;
      }
    }

    try {
      await login(form);
      showToast("Logged in successfully!", "success");
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      showToast(err.message || "Login failed", "error");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative overflow-hidden p-4 sm:p-6">
      {/* Ambient brand shapes */}
      <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary-100 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-primary-50 blur-3xl" />
      <div className="absolute top-1/3 right-10 hidden lg:block h-3 w-3 rounded-full bg-primary-300" />
      <div className="absolute bottom-1/4 left-16 hidden lg:block h-2 w-2 rounded-full bg-primary-400" />

      <div className="relative w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] rounded-3xl overflow-hidden shadow-popover bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        {/* Left: feature/stat panel, light background this time */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-primary-50/60 dark:bg-slate-800/50 border-r border-primary-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center text-white">
              <Layers size={19} />
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-white">CRM Gangatara</span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-snug">
              One workspace for leads, projects and payments.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed max-w-sm">
              Built for sales, marketing, delivery and finance teams to work off the same source of truth — no spreadsheets required.
            </p>

            <div className="flex flex-col gap-3 mt-8">
              {[
                "Track every lead from first touch to close",
                "Kanban pipelines for deals and delivery",
                "Real-time payment and revenue visibility",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <span className="h-5 w-5 rounded-full bg-primary-500 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck size={11} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400">© 2026 CRM Gangatara. All rights reserved.</p>
        </div>

        {/* Right: login form */}
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center text-white">
              <Layers size={19} />
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-white">CRM Gangatara</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Sign in to your workspace</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5 mb-7">Enter your credentials to continue.</p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Email address" required error={errors.email}>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  className="pl-9"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
            </Field>

            <Field label="Password" required error={errors.password}>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-9 pr-9"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Demo role (for preview)" hint="Switch roles to preview role-based access.">
              <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
                {Object.values(ROLES).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                ))}
              </Select>
            </Field>

            <div className="flex items-center justify-between text-sm -mt-1">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => set("remember", e.target.checked)}
                  className="rounded border-slate-300 text-primary-500 focus:ring-primary-400"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-primary-600 font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full mt-2" icon={ArrowRight} iconPosition="right">
              Sign in
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Protected by role-based access control · CRM Gangatara
          </p>
        </div>
      </div>
    </div>
  );
}
