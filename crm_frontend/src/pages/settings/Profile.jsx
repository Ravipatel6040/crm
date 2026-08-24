import { useState } from "react";
import { Camera, Mail, Phone, Shield } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { Card, CardHeader, Field, Input, Button, Avatar, Badge, useToast } from "../../components/common";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "../../constants/roles";

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: "+91 98200 11234", designation: user?.designation || "Team Member" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => toast?.push("Profile updated successfully");

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 flex flex-col items-center text-center">
          <div className="relative">
            <Avatar name={user?.name} size="lg" />
            <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center border-2 border-white">
              <Camera size={11} />
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-3">{user?.name}</p>
          <p className="text-xs text-slate-400">{form.designation}</p>
          <Badge tone="primary" className="mt-2">{ROLE_LABELS[user?.role]}</Badge>
          <div className="w-full flex flex-col gap-2.5 mt-6 pt-6 border-t border-slate-100 text-left">
            <div className="flex items-center gap-2.5 text-sm text-slate-500"><Mail size={15} className="text-slate-400" /> {form.email}</div>
            <div className="flex items-center gap-2.5 text-sm text-slate-500"><Phone size={15} className="text-slate-400" /> {form.phone}</div>
            <div className="flex items-center gap-2.5 text-sm text-slate-500"><Shield size={15} className="text-slate-400" /> {ROLE_LABELS[user?.role]}</div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Personal Information" subtitle="Update your profile details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Designation"><Input value={form.designation} onChange={(e) => set("designation", e.target.value)} /></Field>
            <Field label="Email Address"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Phone Number"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          </div>
          <div className="flex justify-end mt-6 pt-5 border-t border-slate-100">
            <Button onClick={save}>Save Changes</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
