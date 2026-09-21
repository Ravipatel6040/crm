import mongoose from "mongoose";

/**
 * Single global settings document (key: "GLOBAL"). Holds organisation
 * details, locale/formatting, the configurable dropdown options that used to
 * be hard-coded enums, and the role → route-key permission matrix that the
 * frontend reads from /auth/me.
 */

// Defaults mirror what was previously hard-coded as Mongoose `enum` arrays on
// Lead.source / Lead.status / Expense.category. Those enums have since been
// removed from the schemas (see lead.model.js, expense.model.js) — this list
// is now the single source of truth, enforced by each controller via
// getOptionList() below instead of by the schema. Keep it aligned with
// whatever categories/sources/stages already exist in real documents; this
// list previously drifted from Expense.category's actual values ("Salaries"
// vs "Salary", missing "Operations") which would have rejected valid
// historical data had validation been added against it as-is.
export const DEFAULT_OPTIONS = {
  leadSources: [
    "Website", "Referral", "LinkedIn", "Facebook", "Instagram",
    "Google", "Cold Call", "Email", "Other",
  ],
  pipelineStages: [
    "New", "Contacted", "Follow-up", "Proposal", "Negotiation", "Won", "Lost",
  ],
  expenseCategories: [
    "Marketing", "Operations", "Salary", "Software", "Travel", "Other",
  ],
  projectStages: [
    "Planning", "Requirements", "Development", "Testing",
    "Client Review", "Completed", "Delayed",
  ],
};

export const DEFAULT_PERMISSIONS = {
  ADMIN: ["*"],
  BD_SALES: [
    "dashboard", "sales", "leads", "my_leads", "follow_ups", "calls",
    "clients", "projects", "documents", "quotations", "reports", "settings",
  ],
  MARKETING: [
    "dashboard", "marketing", "campaigns", "lead_sources", "analytics",
    "leads", "reports", "settings",
  ],
  PROJECT_MANAGER: [
    "dashboard", "clients", "projects", "tasks", "requirements", "documents",
    "reports", "settings",
  ],
  FINANCE: [
    "dashboard", "finance", "invoices", "payments", "expenses", "revenue",
    "documents",
    "reports", "settings",
  ],
};

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "GLOBAL",
      unique: true,
      index: true,
    },

    organization: {
      name: { type: String, trim: true, default: "CRM Gangatara" },
      legalName: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      taxId: { type: String, trim: true, default: "" },
    },

    locale: {
      currency: { type: String, trim: true, default: "INR" },
      currencySymbol: { type: String, trim: true, default: "₹" },
      locale: { type: String, trim: true, default: "en-IN" },
      timezone: { type: String, trim: true, default: "Asia/Kolkata" },
      dateFormat: { type: String, trim: true, default: "dd MMM yyyy" },
      // 4 = April, the Indian financial year start.
      financialYearStartMonth: { type: Number, default: 4, min: 1, max: 12 },
    },

    options: {
      leadSources: { type: [String], default: () => DEFAULT_OPTIONS.leadSources },
      pipelineStages: { type: [String], default: () => DEFAULT_OPTIONS.pipelineStages },
      expenseCategories: { type: [String], default: () => DEFAULT_OPTIONS.expenseCategories },
      projectStages: { type: [String], default: () => DEFAULT_OPTIONS.projectStages },
    },

    // role → list of frontend route keys. "*" means everything.
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_PERMISSIONS }),
    },

    preferences: {
      // Days of inactivity after which an account is flagged in Team Accounts.
      staleAccountDays: { type: Number, default: 30, min: 1 },
      notifyOnLeadAssignment: { type: Boolean, default: true },
      notifyOnDealWon: { type: Boolean, default: true },
    },

    // Ids of the PERMISSION_MIGRATIONS below already applied to this document.
    appliedMigrations: { type: [String], default: [] },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);

/**
 * The permission matrix is stored in the database the first time Settings is
 * read, so a route key added to DEFAULT_PERMISSIONS later never reaches an
 * existing document — non-admin roles would silently not see the new module.
 * Each entry here is applied to an existing document exactly once (tracked in
 * `appliedMigrations`), so it can't re-add a key an admin has since removed in
 * Settings → Permissions. Add a new entry whenever a new route key ships.
 */
const PERMISSION_MIGRATIONS = [
  {
    id: "2026-09-16-documents-requirements",
    add: {
      BD_SALES: ["documents"],
      PROJECT_MANAGER: ["requirements", "documents"],
      FINANCE: ["documents"],
    },
  },
  {
    id: "2026-09-21-quotations",
    add: { BD_SALES: ["quotations"] },
  },
];

const applyPermissionMigrations = async (settings) => {
  const pending = PERMISSION_MIGRATIONS.filter((m) => !settings.appliedMigrations.includes(m.id));
  if (pending.length === 0) return;

  const matrix = { ...(settings.permissions || {}) };
  for (const migration of pending) {
    for (const [role, keys] of Object.entries(migration.add)) {
      const current = matrix[role] || [];
      // "*" already covers everything.
      if (current.includes("*")) continue;
      matrix[role] = [...current, ...keys.filter((k) => !current.includes(k))];
    }
    settings.appliedMigrations.push(migration.id);
  }

  settings.permissions = matrix;
  settings.markModified("permissions");
  await settings.save();
};

/**
 * Returns the singleton settings document, creating it on first access so
 * every caller can assume it exists.
 */
export const getSettings = async () => {
  let settings = await Settings.findOne({ key: "GLOBAL" });
  if (!settings) {
    settings = await Settings.create({ key: "GLOBAL" });
  }
  await applyPermissionMigrations(settings);
  return settings;
};

/**
 * Permission list for a role, falling back to the built-in defaults if the
 * settings document has no entry for it.
 */
export const getPermissionsForRole = async (role) => {
  if (!role) return [];
  try {
    const settings = await getSettings();
    const matrix = settings.permissions || {};
    return matrix[role] || DEFAULT_PERMISSIONS[role] || [];
  } catch (err) {
    return DEFAULT_PERMISSIONS[role] || [];
  }
};

/**
 * The current allowed values for a configurable dropdown (leadSources,
 * pipelineStages, expenseCategories, projectStages), read from the live
 * Settings document. This is what schemas used to hardcode as `enum` — call
 * this from a controller instead of trusting Mongoose to reject bad values,
 * since the schema no longer knows the list and Settings can change it at
 * any time without a deploy.
 */
export const getOptionList = async (groupKey) => {
  try {
    const settings = await getSettings();
    const list = settings.options?.[groupKey];
    return Array.isArray(list) && list.length ? list : (DEFAULT_OPTIONS[groupKey] || []);
  } catch (err) {
    return DEFAULT_OPTIONS[groupKey] || [];
  }
};
