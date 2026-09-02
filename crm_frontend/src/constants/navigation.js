import {
  LayoutDashboard, Users, GitBranch, Briefcase, FolderKanban, CheckSquare,
  CreditCard, BarChart3, Megaphone, Radio, LineChart, MessageSquare,
  FileText, Bell, ClipboardList, UserCircle, Settings, Package, Wrench, UserCog,
  Clock, Target
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { key: "leads", label: "Leads", to: "/leads", icon: Users },
      { key: "projects", label: "Projects", to: "/projects", icon: FolderKanban },
      { key: "sales", label: "BD / Sales", to: "/sales", icon: Target },
      { key: "marketing", label: "Marketing", to: "/marketing", icon: Megaphone },
      { key: "finance", label: "Finance", to: "/finance", icon: CreditCard },
      { key: "reports", label: "Reports", to: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Project Management",
    items: [
      { key: "milestones", label: "Milestones", to: "/projects", icon: FolderKanban },
      { key: "requirements", label: "Requirements", to: "/projects", icon: FileText },
    ],
  },
  {
    title: "BD / Sales",
    items: [
      { key: "follow_ups", label: "Follow-ups", to: "/follow-ups", icon: Clock },
      { key: "calls", label: "Calls", to: "/communication", icon: MessageSquare },
      { key: "proposals", label: "Proposals", to: "/documents", icon: FileText },
    ],
  },
  {
    title: "Marketing Features",
    items: [
      { key: "campaigns", label: "Campaigns", to: "/marketing/campaigns", icon: Megaphone },
      { key: "lead_sources", label: "Lead Sources", to: "/marketing/lead-sources", icon: Radio },
      { key: "analytics", label: "Analytics", to: "/marketing/analytics", icon: LineChart },
    ],
  },
  {
    title: "Finance Features",
    items: [
      { key: "invoices", label: "Invoices", to: "/payments", icon: FileText },
      { key: "payments", label: "Payments", to: "/payments", icon: CreditCard },
      { key: "expenses", label: "Expenses", to: "/expenses", icon: CreditCard },
      { key: "revenue", label: "Revenue", to: "/reports", icon: LineChart },
    ],
  },
  {
    title: "Administration",
    items: [
      { key: "team", label: "Team", to: "/accounts", icon: UserCog },
      { key: "audit_logs", label: "Audit Logs", to: "/activity", icon: ClipboardList },
      { key: "settings", label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];
