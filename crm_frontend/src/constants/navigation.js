import {
  LayoutDashboard, Users, GitBranch, Briefcase, FolderKanban, CheckSquare,
  CreditCard, BarChart3, Megaphone, Radio, LineChart, MessageSquare,
  FileText, Bell, ClipboardList, UserCircle, Settings, Package, Wrench, UserCog,
  Clock, Receipt
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { key: "leads", label: "Leads", to: "/leads", icon: Users },
      { key: "projects", label: "Projects", to: "/projects", icon: FolderKanban },
      { key: "marketing", label: "Marketing", to: "/marketing", icon: Megaphone },
      { key: "finance", label: "Finance", to: "/finance", icon: CreditCard },
      { key: "reports", label: "Reports", to: "/reports", icon: BarChart3 },
    ],
  },

  {
    title: "Sales",
    items: [
      { key: "follow_ups", label: "Follow-ups", to: "/follow-ups", icon: Clock },
      { key: "calls", label: "Calls", to: "/communication", icon: MessageSquare },
    ],
  },
  {
    title: "Marketing Features",
    items: [
      { key: "campaigns", label: "Campaigns", to: "/marketing/campaigns", icon: Megaphone },
      { key: "lead_sources", label: "Lead Sources", to: "/marketing/lead-sources", icon: Radio },
    ],
  },
  {
    title: "Finance Features",
    items: [
      { key: "invoices", label: "Invoices", to: "/invoices", icon: FileText },
      { key: "payments", label: "Payments", to: "/payments", icon: CreditCard },
      { key: "expenses", label: "Expenses", to: "/expenses", icon: Receipt },
      { key: "revenue", label: "Revenue", to: "/finance", icon: LineChart },
    ],
  },
  {
    title: "Administration",
    items: [
      { key: "team", label: "Team", to: "/accounts", icon: UserCog },
      { key: "settings", label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];
