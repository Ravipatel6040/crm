export const ROLES = {
  ADMIN: "ADMIN",
  SALES: "BD_SALES",
  MARKETING: "MARKETING",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  FINANCE: "FINANCE",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.SALES]: "BD / Sales",
  [ROLES.MARKETING]: "Marketing",
  [ROLES.PROJECT_MANAGER]: "Project Manager",
  [ROLES.FINANCE]: "Finance",
};

/**
 * Fallback permission matrix.
 *
 * The authoritative matrix now lives in the database (Settings.permissions)
 * and arrives on the user object from /auth/login and /auth/me. This map is
 * only used before that payload lands, or if the settings document is
 * unreachable — so it must stay in sync with DEFAULT_PERMISSIONS in
 * crm_backend/src/models/settings.model.js.
 *
 * "*" means every route key.
 */
export const ROLE_ACCESS = {
  [ROLES.ADMIN]: ["*"],
  [ROLES.SALES]: [
    "dashboard", "sales", "leads", "my_leads", "follow_ups", "calls",
    "clients", "projects", "reports", "settings",
  ],
  [ROLES.MARKETING]: [
    "dashboard", "marketing", "campaigns", "lead_sources", "analytics",
    "leads", "reports", "settings",
  ],
  [ROLES.PROJECT_MANAGER]: [
    "dashboard", "clients", "projects", "tasks", "reports", "settings",
  ],
  [ROLES.FINANCE]: [
    "dashboard", "finance", "invoices", "payments", "expenses", "revenue",
    "reports", "settings",
  ],
};

/**
 * canAccess(roleOrUser, key)
 *
 * Accepts either a plain role string (legacy call sites) or the full user
 * object. When given a user carrying a server-issued `permissions` array,
 * that list wins over the static fallback above.
 */
export function canAccess(roleOrUser, key) {
  if (!roleOrUser) return false;

  const isUserObject = typeof roleOrUser === "object";
  const role = isUserObject ? roleOrUser.role : roleOrUser;

  const allowed =
    (isUserObject && Array.isArray(roleOrUser.permissions) && roleOrUser.permissions.length
      ? roleOrUser.permissions
      : ROLE_ACCESS[role]) || [];

  return allowed.includes("*") || allowed.includes(key);
}
