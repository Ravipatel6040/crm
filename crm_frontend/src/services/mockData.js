export const currentUser = {};
export const users = [];
export const leads = [];
export const leadSources = ["Website", "Referral", "Social Media", "Cold Call", "Other"];
export const pipelineStages = ["New", "Contacted", "Follow-up", "Proposal", "Negotiation", "Won", "Lost"];
export const revenueOverview = [
  { month: "Jan", paid: 48000, pending: 16000 },
  { month: "Feb", paid: 56000, pending: 19000 },
  { month: "Mar", paid: 64000, pending: 22000 },
  { month: "Apr", paid: 78000, pending: 25000 },
  { month: "May", paid: 92000, pending: 28000 },
  { month: "Jun", paid: 115000, pending: 34000 },
];
export const notifications = [];
export const projects = [];
export const projectStatuses = [];
export const tasks = [];
export const documents = [];
export const activityLogs = [];
export const clients = [];
export const payments = [];
export const paymentStatuses = [];
export const documentTypes = [];
export const communications = [];
export const campaigns = [];
export const taskPriorities = [];
export const kpis = {
  totalLeads: 0,
  newLeadsToday: 0,
  activeDeals: 0,
  wonThisMonth: 0,
  activeProjects: 0,
  pendingPayments: 0,
  followUpsToday: 0,
  overdueTasks: 0
};

export const products = [
  { id: "PRD-001", name: "Enterprise CRM License", category: "Software", price: 499, status: "Active", stock: "Unlimited" },
  { id: "PRD-002", name: "Premium Support Add-on", category: "Support", price: 199, status: "Active", stock: "Unlimited" },
  { id: "PRD-003", name: "On-Premise Server Hardware", category: "Hardware", price: 4500, status: "Low Stock", stock: 12 },
];

export const services = [
  { id: "SVC-001", name: "Data Migration", category: "Consulting", rate: 150, unit: "Hourly", status: "Active" },
  { id: "SVC-002", name: "Custom API Integration", category: "Development", rate: 200, unit: "Hourly", status: "Active" },
  { id: "SVC-003", name: "Team Training Session", category: "Training", rate: 500, unit: "Flat", status: "Active" },
];
