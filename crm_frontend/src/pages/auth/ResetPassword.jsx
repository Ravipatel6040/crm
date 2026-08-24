import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Lock } from "lucide-react";
import { Button, Field, Input, useToast } from "../../components/common";

export default function ResetPassword() {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.password || form.password.length < 8) errs.password = "Minimum 8 characters required";
    if (form.confirm !== form.password) errs.confirm = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast?.push("Password reset successfully. Please sign in.", "success");
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center text-white">
            <Layers size={20} />
          </div>
          <span className="text-lg font-bold text-slate-800">CRM Gangatara</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 text-center">Reset your password</h2>
        <p className="text-sm text-slate-400 mt-1.5 mb-8 text-center">Choose a new, strong password.</p>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="New password" required error={errors.password}>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                className="pl-9"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
          </Field>
          <Field label="Confirm new password" required error={errors.confirm}>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="password"
                placeholder="Re-enter password"
                className="pl-9"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              />
            </div>
          </Field>
          <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
}
