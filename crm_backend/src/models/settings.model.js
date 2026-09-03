import mongoose from "mongoose";

/**
 * Single global settings document (key: "GLOBAL"). Holds organisation
 * details, locale/formatting, the configurable dropdown options that used to
 * be hard-coded enums, and the role → route-key permission matrix that the
 * frontend reads from /auth/me.
 */

// Defaults mirror what was previously hard-coded in the schemas and in the
// frontend's constants/roles.js + services/mockData.js.
export const DEFAULT_OPTIONS = {
  leadSources: [
    "Website", "Referral", "LinkedIn", "Facebook", "Instagram",
    "Google", "Cold Call", "Email", "Other",
  ],
  pipelineStages: [
    "New", "Contacted", "Follow-up", "Proposal", "Negotiation", "Won", "Lost",
  ],
  expenseCategories: [
    "Salaries", "Software", "Marketing", "Office", "Travel", "Utilities", "Other",
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
    "clients", "projects", "reports", "settings",
  ],
  MARKETING: [
    "dashboard", "marketing", "campaigns", "lead_sources", "analytics",
    "leads", "reports", "settings",
  ],
  PROJECT_MANAGER: [
    "dashboard", "clients", "projects", "tasks", "reports", "settings",
  ],
  FINANCE: [
    "dashboard", "finance", "invoices", "payments", "expenses", "revenue",
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
 * Returns the singleton settings document, creating it on first access so
 * every caller can assume it exists.
 */
export const getSettings = async () => {
  let settings = await Settings.findOne({ key: "GLOBAL" });
  if (!settings) {
    settings = await Settings.create({ key: "GLOBAL" });
  }
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
