import {
  LayoutDashboard, Users, GitBranch, Briefcase, FolderKanban, CheckSquare,
  CreditCard, BarChart3, Megaphone, Radio, LineChart, MessageSquare,
  FileText, Bell, ClipboardList, UserCircle, Settings, Package, Wrench, UserCog
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { key: "leads", label: "Leads", to: "/leads", icon: Users },
      { key: "pipeline", label: "Sales Pipeline", to: "/pipeline", icon: GitBranch },
      { key: "clients", label: "Clients", to: "/clients", icon: Briefcase },
      { key: "projects", label: "Projects", to: "/projects", icon: FolderKanban },
      { key: "payments", label: "Payments", to: "/payments", icon: CreditCard },
      { key: "reports", label: "Reports", to: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Administration",
    items: [
      { key: "accounts", label: "Team Accounts", to: "/accounts", icon: UserCog },
    ],
  },
  {
    title: "Catalog",
    items: [
      { key: "products", label: "Products", to: "/products", icon: Package },
      { key: "services", label: "Services", to: "/services", icon: Wrench },
    ],
  },
  {
    title: "Marketing",
    items: [
      { key: "campaigns", label: "Campaigns", to: "/marketing/campaigns", icon: Megaphone },
      { key: "lead-sources", label: "Lead Sources", to: "/marketing/lead-sources", icon: Radio },
      { key: "marketing-analytics", label: "Marketing Analytics", to: "/marketing/analytics", icon: LineChart },
    ],
  },
  {
    title: "Management",
    items: [
      { key: "communication", label: "Communication", to: "/communication", icon: MessageSquare },
      { key: "documents", label: "Documents", to: "/documents", icon: FileText },
      { key: "notifications", label: "Notifications", to: "/notifications", icon: Bell },
      { key: "activity", label: "Activity Logs", to: "/activity", icon: ClipboardList },
    ],
  },
  {
    title: "Settings",
    items: [
      { key: "profile", label: "Profile", to: "/profile", icon: UserCircle },
      { key: "settings", label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];
