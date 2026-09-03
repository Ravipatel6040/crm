import { useEffect, useMemo, useState } from "react";
import {
  Lock, Eye, EyeOff, Building2, Globe, ListChecks, ShieldCheck,
  Plus, X, RotateCcw, Save,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import {
  Card, Field, Input, Select, Button, Badge, Tabs, useToast,
  LoadingState, ConfirmDialog,
} from "../../components/common";
import { ROLES, ROLE_LABELS } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  useGetAppSettingsQuery,
  useUpdateAppSettingsMutation,
  useResetAppSettingsMutation,
} from "../../store/api/apiSlice";

// Route keys the permission matrix can grant. Mirrors constants/navigation.js.
const ROUTE_KEYS = [
  "dashboard", "leads", "my_leads", "follow_ups", "calls", "clients",
  "projects", "tasks", "marketing", "campaigns", "lead_sources", "analytics",
  "finance", "invoices", "payments", "expenses", "revenue",
  "reports", "audit", "team", "settings",
];

const OPTION_GROUPS = [
  { key: "leadSources", label: "Lead Sources", hint: "Where a lead came from." },
  { key: "pipelineStages", label: "Pipeline Stages", hint: "Order matters — this drives the Kanban board." },
  { key: "expenseCategories", label: "Expense Categories", hint: "Used when logging an expense." },
  { key: "projectStages", label: "Project Stages", hint: "Lifecycle of a delivery project." },
];

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "Pound Sterling (£)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Editable list of short string values, rendered as removable chips. */
function TagListEditor({ values = [], onChange, placeholder = "Add an option..." }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value || values.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-700/60 pl-3 pr-1.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-red-500 transition-colors"
              title={`Remove ${v}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        {values.length === 0 && (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic">No options yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="text-xs py-2"
        />
        <Button size="sm" variant="outline" icon={Plus} onClick={add} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children, footer }) {
  return (
    <Card padding="p-0" className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-700/60 px-5 py-4">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          <Icon size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700/60 px-5 py-4 bg-slate-50/60 dark:bg-slate-900/30">
          {footer}
        </div>
      )}
    </Card>
  );
}

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const { data, isLoading } = useGetAppSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateAppSettingsMutation();
  const [resetSettings, { isLoading: resetting }] = useResetAppSettingsMutation();

  const remote = data?.data ?? data ?? null;

  const TABS = useMemo(
    () => (isAdmin
      ? ["Security", "Organisation", "Locale", "Dropdowns", "Permissions"]
      : ["Security"]),
    [isAdmin]
  );
  const [tab, setTab] = useState("Security");

  // ── Password form ───────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [reveal, setReveal] = useState({ current: false, new: false, confirm: false });
  const [changingPassword, setChangingPassword] = useState(false);

  const savePassword = async () => {
    if (!passwords.current || !passwords.new) {
      toast?.push("Please fill in all fields", "error");
      return;
    }
    if (passwords.new.length < 6) {
      toast?.push("New password must be at least 6 characters", "error");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast?.push("New passwords do not match", "error");
      return;
    }

    setChangingPassword(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast?.push("Password updated successfully", "success");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      toast?.push(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  // ── Org / locale / options / permissions ────────────────────────────────────
  const [draft, setDraft] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (remote) {
      setDraft({
        organization: { ...remote.organization },
        locale: { ...remote.locale },
        options: {
          leadSources: [...(remote.options?.leadSources || [])],
          pipelineStages: [...(remote.options?.pipelineStages || [])],
          expenseCategories: [...(remote.options?.expenseCategories || [])],
          projectStages: [...(remote.options?.projectStages || [])],
        },
        permissions: { ...(remote.permissions || {}) },
        preferences: { ...remote.preferences },
      });
    }
  }, [remote]);

  const setOrg = (k, v) => setDraft((d) => ({ ...d, organization: { ...d.organization, [k]: v } }));
  const setLocale = (k, v) => setDraft((d) => ({ ...d, locale: { ...d.locale, [k]: v } }));
  const setPrefs = (k, v) => setDraft((d) => ({ ...d, preferences: { ...d.preferences, [k]: v } }));
  const setOptions = (k, v) => setDraft((d) => ({ ...d, options: { ...d.options, [k]: v } }));

  const togglePermission = (role, key) => {
    setDraft((d) => {
      const current = d.permissions[role] || [];
      const next = current.includes(key)
        ? current.filter((x) => x !== key)
        : [...current, key];
      return { ...d, permissions: { ...d.permissions, [role]: next } };
    });
  };

  const save = async (payload, label) => {
    try {
      await updateSettings(payload).unwrap();
      toast?.push(`${label} saved`, "success");
    } catch (err) {
      toast?.push(err?.data?.message || `Failed to save ${label.toLowerCase()}`, "error");
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings().unwrap();
      toast?.push("Settings reset to defaults", "info");
    } catch (err) {
      toast?.push(err?.data?.message || "Failed to reset settings", "error");
    } finally {
      setResetOpen(false);
    }
  };

  const passwordFields = [
    { key: "current", label: "Current Password" },
    { key: "new", label: "New Password" },
    { key: "confirm", label: "Confirm New Password" },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle={isAdmin ? "Account security, organisation profile and system configuration" : "Manage your account security"}
        action={
          isAdmin && (
            <Button variant="outline" icon={RotateCcw} onClick={() => setResetOpen(true)} disabled={resetting}>
              Reset to defaults
            </Button>
          )
        }
      />

      <div className="mb-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "Security" && (
        <div className="max-w-2xl">
          <SectionCard
            icon={Lock}
            title="Password & Security"
            description="Changing your password signs you out of other devices."
            footer={
              <Button onClick={savePassword} loading={changingPassword} icon={Save}>
                Update Password
              </Button>
            }
          >
            <div className="flex flex-col gap-4">
              {passwordFields.map(({ key, label }) => (
                <Field key={key} label={label}>
                  <div className="relative">
                    <Input
                      type={reveal[key] ? "text" : "password"}
                      placeholder="••••••••"
                      className="pr-10"
                      value={passwords[key]}
                      onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setReveal((r) => ({ ...r, [key]: !r[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {reveal[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {isLoading && tab !== "Security" && <LoadingState label="Loading settings..." />}

      {draft && isAdmin && tab === "Organisation" && (
        <div className="max-w-3xl">
          <SectionCard
            icon={Building2}
            title="Organisation Profile"
            description="Appears on invoices, exports and system emails."
            footer={
              <Button icon={Save} loading={saving} onClick={() => save({ organization: draft.organization }, "Organisation profile")}>
                Save changes
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Display Name" required>
                <Input value={draft.organization.name || ""} onChange={(e) => setOrg("name", e.target.value)} placeholder="CRM Gangatara" />
              </Field>
              <Field label="Registered Legal Name">
                <Input value={draft.organization.legalName || ""} onChange={(e) => setOrg("legalName", e.target.value)} placeholder="Gangatara Technologies Pvt Ltd" />
              </Field>
              <Field label="Contact Email">
                <Input type="email" value={draft.organization.email || ""} onChange={(e) => setOrg("email", e.target.value)} placeholder="hello@company.com" />
              </Field>
              <Field label="Phone">
                <Input value={draft.organization.phone || ""} onChange={(e) => setOrg("phone", e.target.value)} placeholder="+91 98200 11234" />
              </Field>
              <Field label="Website">
                <Input value={draft.organization.website || ""} onChange={(e) => setOrg("website", e.target.value)} placeholder="https://company.com" />
              </Field>
              <Field label="GSTIN / Tax ID">
                <Input value={draft.organization.taxId || ""} onChange={(e) => setOrg("taxId", e.target.value)} placeholder="22AAAAA0000A1Z5" />
              </Field>
              <Field label="Registered Address" className="sm:col-span-2">
                <Input value={draft.organization.address || ""} onChange={(e) => setOrg("address", e.target.value)} placeholder="Street, City, State, PIN" />
              </Field>
            </div>
          </SectionCard>
        </div>
      )}

      {draft && isAdmin && tab === "Locale" && (
        <div className="max-w-3xl flex flex-col gap-5">
          <SectionCard
            icon={Globe}
            title="Locale & Formatting"
            description="Controls how currency and dates render across every module."
            footer={
              <Button icon={Save} loading={saving} onClick={() => save({ locale: draft.locale, preferences: draft.preferences }, "Locale settings")}>
                Save changes
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Currency">
                <Select
                  value={draft.locale.currency || "INR"}
                  onChange={(e) => {
                    const match = CURRENCIES.find((c) => c.code === e.target.value);
                    setDraft((d) => ({
                      ...d,
                      locale: { ...d.locale, currency: e.target.value, currencySymbol: match?.symbol || "" },
                    }));
                  }}
                >
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </Select>
              </Field>
              <Field label="Number Locale" hint="e.g. en-IN renders 1,00,000 — en-US renders 100,000.">
                <Input value={draft.locale.locale || ""} onChange={(e) => setLocale("locale", e.target.value)} placeholder="en-IN" />
              </Field>
              <Field label="Timezone">
                <Input value={draft.locale.timezone || ""} onChange={(e) => setLocale("timezone", e.target.value)} placeholder="Asia/Kolkata" />
              </Field>
              <Field label="Financial Year Starts">
                <Select
                  value={draft.locale.financialYearStartMonth || 4}
                  onChange={(e) => setLocale("financialYearStartMonth", Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </Select>
              </Field>
              <Field
                label="Flag inactive accounts after"
                hint="Days without a sign-in before Team Accounts shows a warning."
              >
                <Input
                  type="number"
                  min={1}
                  value={draft.preferences?.staleAccountDays ?? 30}
                  onChange={(e) => setPrefs("staleAccountDays", Number(e.target.value))}
                />
              </Field>
            </div>
          </SectionCard>
        </div>
      )}

      {draft && isAdmin && tab === "Dropdowns" && (
        <div className="max-w-3xl">
          <SectionCard
            icon={ListChecks}
            title="Configurable Options"
            description="Add or remove choices without a code change. Existing records keep their current value even if you remove an option."
            footer={
              <Button icon={Save} loading={saving} onClick={() => save({ options: draft.options }, "Dropdown options")}>
                Save changes
              </Button>
            }
          >
            <div className="flex flex-col gap-6">
              {OPTION_GROUPS.map((group) => (
                <div key={group.key}>
                  <div className="flex items-baseline justify-between mb-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {group.label}
                    </p>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">{group.hint}</span>
                  </div>
                  <TagListEditor
                    values={draft.options[group.key] || []}
                    onChange={(v) => setOptions(group.key, v)}
                    placeholder={`Add a ${group.label.toLowerCase().replace(/s$/, "")}...`}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {draft && isAdmin && tab === "Permissions" && (
        <SectionCard
          icon={ShieldCheck}
          title="Role Permissions"
          description="Which modules each role can open. Admins always have full access."
          footer={
            <Button icon={Save} loading={saving} onClick={() => save({ permissions: draft.permissions }, "Role permissions")}>
              Save changes
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white dark:bg-slate-800 text-left font-semibold text-slate-500 dark:text-slate-400 px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
                    Module
                  </th>
                  {Object.values(ROLES).map((role) => (
                    <th key={role} className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROUTE_KEYS.map((key) => (
                  <tr key={key} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/20">
                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-3 py-2 border-b border-slate-50 dark:border-slate-700/50 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {key.replace(/_/g, " ")}
                    </td>
                    {Object.values(ROLES).map((role) => {
                      const list = draft.permissions[role] || [];
                      const isWildcard = list.includes("*");
                      const checked = isWildcard || list.includes(key);
                      return (
                        <td key={role} className="text-center px-3 py-2 border-b border-slate-50 dark:border-slate-700/50">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isWildcard}
                            onChange={() => togglePermission(role, key)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-primary-600 focus:ring-primary-500/40 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            title={isWildcard ? "Admins always have full access" : undefined}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge tone="primary">Admin = full access</Badge>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Changes take effect for each user on their next sign-in.
            </span>
          </div>
        </SectionCard>
      )}

      <ConfirmDialog
        open={resetOpen}
        title="Reset all settings?"
        description="Organisation profile, locale, dropdown options and role permissions all return to their defaults. Your team accounts and business data are untouched."
        confirmLabel="Reset"
        tone="danger"
        onConfirm={handleReset}
        onClose={() => setResetOpen(false)}
      />
    </div>
  );
}
