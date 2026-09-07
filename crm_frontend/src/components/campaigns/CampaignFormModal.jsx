import { useEffect, useState, useMemo } from "react";
import { Copy, Check, Link, Tag, BarChart2, Info } from "lucide-react";
import { Modal, Button, Field, Input, Select } from "../common";
import { classNames } from "../../utils/format";

export const platforms = [
  "Google Ads", "Instagram", "Facebook", "LinkedIn",
  "WhatsApp", "Website", "Referral",
];

const UTM_MEDIUM_SUGGESTIONS = ["cpc", "cpm", "cpv", "email", "social", "organic", "referral", "display", "affiliate"];
const UTM_SOURCE_SUGGESTIONS  = ["google", "facebook", "instagram", "linkedin", "newsletter", "partner"];

const emptyUtm = {
  source: "",
  medium: "",
  campaign: "",
  landingUrl: "",
};

const empty = {
  name: "",
  platform: platforms[0],
  startDate: "",
  endDate: "",
  budget: "",
  spend: "0",
  leads: "0",
  qualified: "0",
  proposals: "0",
  won: "0",
  revenue: "0",
  status: "Active",
  utm: { ...emptyUtm },
  imageUrl: "",
  videoUrl: "",
};

// ─── UTM URL builder ─────────────────────────────────────────────────────────
function buildUtmUrl(utm) {
  if (!utm.landingUrl) return "";
  try {
    const base = utm.landingUrl.startsWith("http") ? utm.landingUrl : `https://${utm.landingUrl}`;
    const url  = new URL(base);
    if (utm.source)   url.searchParams.set("utm_source",   utm.source);
    if (utm.medium)   url.searchParams.set("utm_medium",   utm.medium);
    if (utm.campaign) url.searchParams.set("utm_campaign", utm.campaign);
    return url.toString();
  } catch {
    return "";
  }
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────
function Chips({ options, value, onPick }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={classNames(
            "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
            value === o
              ? "bg-primary-500 text-white border-primary-500"
              : "bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary-400 hover:text-primary-600"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function Tab({ active, icon: Icon, label, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
        active
          ? "bg-primary-500 text-white shadow-sm"
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
      )}
    >
      <Icon size={15} />
      {label}
      {badge && (
        <span className={classNames(
          "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
          active ? "bg-white/25 text-white" : "bg-primary-100 text-primary-700"
        )}>{badge}</span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CampaignFormModal({ open, onClose, onSave, initial }) {
  const [form,  setForm]  = useState(empty);
  const [tab,   setTab]   = useState("details");
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  const set    = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setUtm = (k, v) => setForm((f) => ({ ...f, utm: { ...f.utm, [k]: v } }));

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { ...empty, ...initial, utm: { ...emptyUtm, ...(initial.utm || {}) } }
        : empty
      );
      setErrors({});
      setTab("details");
      setCopied(false);
    }
  }, [open, initial]);

  // Live UTM URL
  const utmUrl = useMemo(() => buildUtmUrl(form.utm), [form.utm]);

  // Count filled UTM fields
  const utmFilled = Object.values(form.utm).filter(Boolean).length;

  const handleCopy = () => {
    if (!utmUrl) return;
    navigator.clipboard.writeText(utmUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const submit = () => {
    const errs = {};
    if (!form.name || !form.name.trim()) errs.name = "Campaign name is required";
    
    if (Number(form.budget) < 0) errs.budget = "Cannot be negative";
    if (Number(form.spend) < 0) errs.spend = "Cannot be negative";

    if (form.startDate && form.endDate) {
      if (new Date(form.endDate) < new Date(form.startDate)) {
        errs.endDate = "End date must be after start date";
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTab("details");
      return;
    }
    setErrors({});
    onSave({
      ...form,
      name:      form.name.trim(),
      id:        initial?.id || initial?._id || undefined,
      budget:    Number(form.budget)    || 0,
      spend:     Number(form.spend)     || 0,
      leads:     Number(form.leads)     || 0,
      qualified: Number(form.qualified) || 0,
      proposals: Number(form.proposals) || 0,
      won:       Number(form.won)       || 0,
      revenue:   Number(form.revenue)   || 0,
      status:    form.status            || "Active",
      utm:       form.utm,
      imageUrl:  form.imageUrl          || "",
      videoUrl:  form.videoUrl          || "",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Campaign" : "New Campaign"}
      subtitle={initial ? `Editing: ${initial.name}` : "Launch a new marketing campaign"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save Changes" : "Create Campaign"}</Button>
        </>
      }
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1.5 mb-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-1">
        <Tab
          active={tab === "details"}
          icon={BarChart2}
          label="Campaign Details"
          onClick={() => setTab("details")}
        />
        <Tab
          active={tab === "utm"}
          icon={Tag}
          label="UTM Tracking"
          badge={utmFilled > 0 ? utmFilled : undefined}
          onClick={() => setTab("utm")}
        />
      </div>

      {/* ── TAB: Campaign Details ─────────────────────────────────────────── */}
      {tab === "details" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Campaign Name" required error={errors.name} className="sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Festive Season Google Ads"
            />
          </Field>

          <Field label="Platform">
            <Select value={form.platform} onChange={(e) => set("platform", e.target.value)}>
              {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>

          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {["Active", "Paused", "Completed"].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>

          <Field label="Budget (₹)" error={errors.budget}>
            <Input
              type="number"
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
              placeholder="e.g. 50000"
            />
          </Field>

          <Field label="Spend (₹)" error={errors.spend}>
            <Input
              type="number"
              value={form.spend}
              onChange={(e) => set("spend", e.target.value)}
              placeholder="Actual spend so far"
            />
          </Field>

          <Field label="Start Date" error={errors.startDate}>
            <Input
              type="date"
              value={form.startDate ? String(form.startDate).split("T")[0] : ""}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>

          <Field label="End Date" error={errors.endDate}>
            <Input
              type="date"
              value={form.endDate ? String(form.endDate).split("T")[0] : ""}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>

          <Field label="Campaign Image">
            <Input
              type="file"
              accept="image/*"
              className="file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400 cursor-pointer"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  set("imageUrl", URL.createObjectURL(e.target.files[0]));
                }
              }}
            />
            {form.imageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-center">
                <img src={form.imageUrl} alt="Campaign preview" className="max-h-40 object-contain" />
              </div>
            )}
          </Field>

          <Field label="Campaign Video">
            <Input
              type="file"
              accept="video/*"
              className="file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400 cursor-pointer"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  set("videoUrl", URL.createObjectURL(e.target.files[0]));
                }
              }}
            />
            {form.videoUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-center">
                <video src={form.videoUrl} controls className="max-h-40 object-contain" />
              </div>
            )}
          </Field>


        </div>
      )}

      {/* ── TAB: UTM Tracking ────────────────────────────────────────────── */}
      {tab === "utm" && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 px-4 py-3">
            <Info size={15} className="text-primary-500 mt-0.5 shrink-0" />
            <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">
              UTM parameters let you track the exact source, channel, and content that drives traffic.
              Fill in the fields below and copy the generated tracking URL into your ad platform.
            </p>
          </div>

          <Field
            label="Landing Page URL"
            hint="The page visitors land on — e.g. https://yoursite.com/landing"
          >
            <div className="relative">
              <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                value={form.utm.landingUrl}
                onChange={(e) => setUtm("landingUrl", e.target.value)}
                placeholder="https://yoursite.com/landing"
                className="pl-9"
              />
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="UTM Source"
              hint="Who sends the traffic — e.g. google, newsletter"
            >
              <Input
                value={form.utm.source}
                onChange={(e) => setUtm("source", e.target.value)}
                placeholder="google"
              />
              <Chips
                options={UTM_SOURCE_SUGGESTIONS}
                value={form.utm.source}
                onPick={(v) => setUtm("source", v)}
              />
            </Field>

            <Field
              label="UTM Medium"
              hint="Marketing channel — e.g. cpc, email, social"
            >
              <Input
                value={form.utm.medium}
                onChange={(e) => setUtm("medium", e.target.value)}
                placeholder="cpc"
              />
              <Chips
                options={UTM_MEDIUM_SUGGESTIONS}
                value={form.utm.medium}
                onPick={(v) => setUtm("medium", v)}
              />
            </Field>

            <Field
              label="UTM Campaign"
              hint="Campaign name slug — e.g. summer-sale-2026"
              className="sm:col-span-2"
            >
              <Input
                value={form.utm.campaign}
                onChange={(e) => setUtm("campaign", e.target.value)}
                placeholder="summer-sale-2026"
              />
            </Field>
          </div>

          {/* Live UTM URL Preview */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Generated Tracking URL
              </p>
              {utmUrl && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy URL"}
                </button>
              )}
            </div>
            <div
              className={classNames(
                "rounded-xl border px-4 py-3 font-mono text-[11px] break-all leading-relaxed min-h-[56px] transition-colors",
                utmUrl
                  ? "bg-slate-900 dark:bg-slate-950 border-slate-700 text-emerald-400"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 italic"
              )}
            >
              {utmUrl || "Fill in the fields above to generate your UTM URL…"}
            </div>

            {/* Parameter pills */}
            {utmUrl && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { k: "utm_source",   v: form.utm.source },
                  { k: "utm_medium",   v: form.utm.medium },
                  { k: "utm_campaign", v: form.utm.campaign },
                ].filter((p) => p.v).map((p) => (
                  <span
                    key={p.k}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                  >
                    <span className="text-primary-500 font-semibold">{p.k}</span>=<span>{p.v}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
