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

// Which top-level route "keys" each role may access.
// Admin implicitly has access to everything, including "accounts" (Team
// Accounts / create BD-Sales, Marketing, Project & Finance logins) which
// is intentionally left out of every other role's list below.
export const ROLE_ACCESS = {
  [ROLES.ADMIN]: ["*"],
  [ROLES.SALES]: [
    "dashboard", "leads", "pipeline", "clients", "communication",
    "documents", "notifications", "activity", "reports", "profile", "settings",
    "products", "services",
  ],
  [ROLES.MARKETING]: [
    "dashboard", "campaigns", "lead-sources", "marketing-analytics", "leads",
    "documents", "notifications", "activity", "reports", "profile", "settings",
    "products", "services",
  ],
  [ROLES.PROJECT_MANAGER]: [
    "dashboard", "projects", "clients", "communication",
    "documents", "notifications", "activity", "reports", "profile", "settings",
    "products", "services",
  ],
  [ROLES.FINANCE]: [
    "dashboard", "payments", "clients", "projects", "reports",
    "documents", "notifications", "activity", "profile", "settings",
    "products", "services",
  ],
};

export function canAccess(role, key) {
  if (!role) return false;
  const allowed = ROLE_ACCESS[role] || [];
  return allowed.includes("*") || allowed.includes(key);
}

