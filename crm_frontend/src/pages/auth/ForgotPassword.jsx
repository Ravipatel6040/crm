import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layers, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button, Field, Input } from "../../components/common";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setSent(true);
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

        {!sent ? (
          <>
            <h2 className="text-2xl font-bold text-slate-800 text-center">Forgot password?</h2>
            <p className="text-sm text-slate-400 mt-1.5 mb-8 text-center">
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Field label="Email address" required>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </Field>
              <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
                Send reset link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={26} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Check your inbox</h2>
            <p className="text-sm text-slate-400 mt-1.5">
              We've sent a password reset link to <span className="font-medium text-slate-600">{email}</span>.
            </p>
            <Button className="mt-6 w-full" variant="outline" onClick={() => navigate("/reset-password")}>
              Continue to reset password
            </Button>
          </div>
        )}

        <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-primary-600 font-medium hover:underline mt-8">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
}
