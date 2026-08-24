import { useState } from "react";
import { Bell, Lock, Palette, Building2, Users } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { Card, Field, Input, Select, Button, Tabs, useToast } from "../../components/common";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const BASE_TABS = ["General", "Notifications", "Security", "Company"];

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full transition-colors relative shrink-0 ${checked ? "bg-primary-500" : "bg-slate-200"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState("General");
  const [notifs, setNotifs] = useState({ email: true, push: true, followups: true, payments: true, tasks: false });

  const [newUserForm, setNewUserForm] = useState({ email: "", password: "", role: "BD_SALES" });
  const [creatingUser, setCreatingUser] = useState(false);

  const TABS = user?.role === "ADMIN" ? [...BASE_TABS, "User Management"] : BASE_TABS;

  const save = () => toast?.push("Settings saved successfully");

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.password || !newUserForm.role) {
      toast?.push("Please fill all fields", "error");
      return;
    }
    setCreatingUser(true);
    try {
      await api.post("/admin/users/create", newUserForm);
      toast?.push("User account created successfully");
      setNewUserForm({ email: "", password: "", role: "BD_SALES" });
    } catch (err) {
      toast?.push(err.response?.data?.message || "Failed to create user", "error");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your workspace preferences" />

      <Card padding="p-0">
        <div className="px-5 pt-2">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        <div className="p-5 max-w-2xl">
          {tab === "General" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"><Palette size={17} /></div>
                <p className="text-sm font-semibold text-slate-700">Display Preferences</p>
              </div>
              <Field label="Language">
                <Select defaultValue="en">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </Select>
              </Field>
              <Field label="Timezone">
                <Select defaultValue="ist">
                  <option value="ist">(GMT+5:30) India Standard Time</option>
                  <option value="utc">(GMT+0:00) UTC</option>
                </Select>
              </Field>
              <Field label="Date Format">
                <Select defaultValue="dd">
                  <option value="dd">DD/MM/YYYY</option>
                  <option value="mm">MM/DD/YYYY</option>
                </Select>
              </Field>
            </div>
          )}

          {tab === "Notifications" && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"><Bell size={17} /></div>
                <p className="text-sm font-semibold text-slate-700">Notification Preferences</p>
              </div>
              {[
                ["email", "Email notifications"],
                ["push", "Push notifications"],
                ["followups", "Follow-up reminders"],
                ["payments", "Payment alerts"],
                ["tasks", "Task deadline alerts"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{label}</span>
                  <Toggle checked={notifs[key]} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} />
                </div>
              ))}
            </div>
          )}

          {tab === "Security" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"><Lock size={17} /></div>
                <p className="text-sm font-semibold text-slate-700">Password & Security</p>
              </div>
              <Field label="Current Password"><Input type="password" placeholder="••••••••" /></Field>
              <Field label="New Password"><Input type="password" placeholder="••••••••" /></Field>
              <Field label="Confirm New Password"><Input type="password" placeholder="••••••••" /></Field>
            </div>
          )}

          {tab === "Company" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"><Building2 size={17} /></div>
                <p className="text-sm font-semibold text-slate-700">Company Details</p>
              </div>
              <Field label="Company Name"><Input defaultValue="CRM Gangatara Pvt Ltd" /></Field>
              <Field label="Website"><Input defaultValue="https://crmgangatara.com" /></Field>
              <Field label="Support Email"><Input defaultValue="support@crmgangatara.com" /></Field>
            </div>
          )}

          {tab === "User Management" && (
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"><Users size={17} /></div>
                <p className="text-sm font-semibold text-slate-700">Create New User Account</p>
              </div>
              <Field label="Email Address" required>
                <Input 
                  type="email" 
                  placeholder="user@company.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                />
              </Field>
              <Field label="Password" required>
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                />
              </Field>
              <Field label="Role" required>
                <Select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                >
                  <option value="BD_SALES">BD / Sales</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="FINANCE">Finance</option>
                </Select>
              </Field>
              <div className="flex justify-start mt-2">
                <Button type="submit" loading={creatingUser}>Create User</Button>
              </div>
            </form>
          )}

          {tab !== "User Management" && (
            <div className="flex justify-end mt-6 pt-5 border-t border-slate-100">
              <Button onClick={save}>Save Settings</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
