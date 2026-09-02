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
  [ROLES.ADMIN]: [
    "dashboard", "sales", "leads", "follow_ups", "clients", "projects", "tasks", "reports", "team", "settings"
  ],
  [ROLES.SALES]: [
    "dashboard", "sales", "leads", "my_leads", "follow_ups", "calls", "clients", "projects", "reports"
  ],
  [ROLES.MARKETING]: [
    "dashboard", "campaigns", "lead_sources", "analytics", "reports"
  ],
  [ROLES.PROJECT_MANAGER]: [
    "dashboard", "clients", "projects", "tasks", "reports"
  ],
  [ROLES.FINANCE]: [
    "dashboard", "invoices", "payments", "expenses", "revenue", "reports"
  ],
};

export function canAccess(role, key) {
  if (!role) return false;
  const allowed = ROLE_ACCESS[role] || [];
  return allowed.includes("*") || allowed.includes(key);
}

