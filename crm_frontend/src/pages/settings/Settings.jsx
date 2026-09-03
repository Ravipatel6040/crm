import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { Card, Field, Input, Button, useToast } from "../../components/common";
import api from "../../services/api";

export default function Settings() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const save = async () => {
    if (!passwords.current || !passwords.new) {
      toast?.push("Please fill in all fields", "error");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast?.push("New passwords do not match", "error");
      return;
    }
    
    setLoading(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast?.push("Password updated successfully", "success");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      toast?.push(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account security" />

      <Card padding="p-0">
        <div className="p-5 max-w-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"><Lock size={17} /></div>
              <p className="text-sm font-semibold text-slate-700">Password & Security</p>
            </div>
            
            <Field label="Current Password">
              <div className="relative">
                <Input 
                  type={showCurrent ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pr-10"
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            
            <Field label="New Password">
              <div className="relative">
                <Input 
                  type={showNew ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pr-10"
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            
            <Field label="Confirm New Password">
              <div className="relative">
                <Input 
                  type={showConfirm ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pr-10"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          </div>

          <div className="flex justify-end mt-6 pt-5 border-t border-slate-100">
            <Button onClick={save} disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
