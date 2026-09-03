import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Modal, Button, Field, Input, Select } from "../common";
import { ROLES, ROLE_LABELS } from "../../constants/roles";

// Admins can create other admins here — the public /admin/create bootstrap
// endpoint closes itself after the first administrator exists.
const CREATABLE_ROLES = [
  ROLES.SALES, ROLES.MARKETING, ROLES.PROJECT_MANAGER, ROLES.FINANCE, ROLES.ADMIN,
];

const emptyUser = {
  name: "", email: "", phone: "", designation: "", role: ROLES.SALES, status: "ACTIVE", password: "",
};

export default function UserFormModal({ open, onClose, onSave, initial, saving }) {
  const [form, setForm] = useState(emptyUser);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setForm(initial ? { ...emptyUser, ...initial, password: "" } : emptyUser);
    setErrors({});
    setShowPassword(false);
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    if (!initial && !form.password.trim()) errs.password = "Password is required";
    if (!initial && form.password && form.password.length < 6) errs.password = "At least 6 characters";
    if (initial && form.password && form.password.trim().length < 6) errs.password = "New password must be at least 6 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = { ...form };
    // If editing and password was left blank, don't update password
    if (initial && !form.password.trim()) {
      delete payload.password;
    }
    onSave(initial ? { id: initial.id || initial._id, ...payload } : payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Team Account" : "Create Team Account"}
      subtitle={initial ? `Editing ${initial.name}` : "Add a BD/Sales, Marketing, Project or Finance user"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{initial ? "Save Changes" : "Create Account"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Priya Sharma" />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@crmgangatara.com" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98200 11234" />
        </Field>
        <Field label="Designation">
          <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. BD Executive" />
        </Field>
        <Field
          label="Role / Department"
          required
          hint={form.role === ROLES.ADMIN ? "Admins have unrestricted access to every module." : undefined}
        >
          <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
            {CREATABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </Field>
        <Field
          label={initial ? "Change Password" : "Password"}
          required={!initial}
          error={errors.password}
          hint={initial ? "Leave blank to keep existing password, or enter a new one (min. 6 characters)." : undefined}
          className="sm:col-span-2"
        >
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={initial ? "Leave blank to keep current password" : "Min. 6 characters"}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-md"
              title={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
      </div>
    </Modal>
  );
}
