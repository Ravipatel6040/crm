import { Lead } from "../models/lead.model.js";
import { User } from "../models/user.model.js";
import { Client } from "../models/client.model.js";
import { Project } from "../models/project.model.js";
import { Payment } from "../models/payment.model.js";
import { Expense } from "../models/expense.model.js";
import { Campaign } from "../models/campaign.model.js";
import { Task } from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
  // A. Leads Overview
  const leads = await Lead.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      }
    }
  ]);
  const leadStats = { total: 0, new: 0, contacted: 0, followUp: 0, proposal: 0, won: 0, lost: 0 };
  leads.forEach(l => {
    leadStats.total += l.count;
    if (l._id === "New") leadStats.new = l.count;
    if (l._id === "Contacted") leadStats.contacted = l.count;
    if (l._id === "Follow-up") leadStats.followUp = l.count;
    if (l._id === "Proposal") leadStats.proposal = l.count;
    if (l._id === "Won") leadStats.won = l.count;
    if (l._id === "Lost") leadStats.lost = l.count;
  });

  // B. Clients Overview
  const clients = await Client.aggregate([
    {
      $group: {
        _id: { status: "$status", highValue: "$isHighValue" },
        count: { $sum: 1 },
      }
    }
  ]);
  const clientStats = { total: 0, active: 0, inactive: 0, highValue: 0 };
  clients.forEach(c => {
    clientStats.total += c.count;
    if (c._id.status === "Active") clientStats.active += c.count;
    if (c._id.status === "Inactive") clientStats.inactive += c.count;
    if (c._id.highValue) clientStats.highValue += c.count;
  });

  // C. Projects Overview
  const projects = await Project.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
  const projectStats = { active: 0, completed: 0, pending: 0, delayed: 0 };
  projects.forEach(p => {
    if (p._id === "Active") projectStats.active = p.count;
    if (p._id === "Completed") projectStats.completed = p.count;
    if (p._id === "Pending") projectStats.pending = p.count;
    if (p._id === "Delayed") projectStats.delayed = p.count;
  });

  // D. Finance Overview
  const payments = await Payment.aggregate([
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);
  const financeStats = { totalRevenue: 0, pendingPayments: 0, overduePayments: 0 };
  payments.forEach(p => {
    if (p._id === "Paid") financeStats.totalRevenue += p.totalAmount;
    if (p._id === "Pending") financeStats.pendingPayments += p.totalAmount;
    if (p._id === "Overdue") financeStats.overduePayments += p.totalAmount;
  });

  const expenses = await Expense.aggregate([
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" }
      }
    }
  ]);
  const totalExpenses = expenses.length > 0 ? expenses[0].totalExpenses : 0;
  financeStats.totalExpenses = totalExpenses;
  financeStats.netRevenue = financeStats.totalRevenue - totalExpenses;

  // Compile final summary payload
  return res.status(200).json(
    new ApiResponse(200, {
      business: {
        totalRevenue: financeStats.totalRevenue,
        monthlyRevenue: 0, // Mock for now, would group by month
        pendingPayments: financeStats.pendingPayments,
        totalExpenses: financeStats.totalExpenses,
        netRevenue: financeStats.netRevenue,
        newClients: clientStats.total, // mock new clients
        lostClients: clientStats.inactive,
        activeProjects: projectStats.active
      },
      leads: leadStats,
      clients: clientStats,
      projects: projectStats,
      finance: financeStats
    }, "Dashboard summary fetched successfully")
  );
});

export const getRevenueOverview = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, [
    { name: "Jan", revenue: 4000, expenses: 2400 },
    { name: "Feb", revenue: 3000, expenses: 1398 },
    { name: "Mar", revenue: 2000, expenses: 9800 },
    { name: "Apr", revenue: 2780, expenses: 3908 },
    { name: "May", revenue: 1890, expenses: 4800 },
    { name: "Jun", revenue: 2390, expenses: 3800 },
  ], "Revenue overview fetched"));
});

export const getPipelineSummary = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, [
    { name: "New", value: 400 },
    { name: "Contacted", value: 300 },
    { name: "Proposal", value: 300 },
    { name: "Won", value: 200 },
  ], "Pipeline summary fetched"));
});

export const getLeadSourcesSummary = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, [
    { name: "Website", value: 400 },
    { name: "Referral", value: 300 },
    { name: "Social Media", value: 300 },
    { name: "Cold Call", value: 200 },
  ], "Lead sources fetched"));
});

export const getSalesDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Leads specific to the user
  const leads = await Lead.aggregate([
    { $match: { assignedTo: userId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      }
    }
  ]);
  
  const leadStats = { total: 0, new: 0, contacted: 0, followUp: 0, proposal: 0, won: 0, lost: 0 };
  leads.forEach(l => {
    leadStats.total += l.count;
    if (l._id === "New") leadStats.new = l.count;
    if (l._id === "Contacted") leadStats.contacted = l.count;
    if (l._id === "Follow-up") leadStats.followUp = l.count;
    if (l._id === "Proposal") leadStats.proposal = l.count;
    if (l._id === "Won") leadStats.won = l.count;
    if (l._id === "Lost") leadStats.lost = l.count;
  });

  // 2. Revenue from deals won by the user (mock logic: assuming we check Payments for projects owned by the user, or Leads won)
  // For now, let's just query Payments directly, assuming we'll associate payments with the sales rep in the future.
  // Using a mock revenue sum for demonstration:
  const revenue = 850000; 

  // 3. Today's Follow-ups
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaysFollowUps = await Lead.find({
    assignedTo: userId,
    nextFollowUp: { $gte: todayStart, $lte: todayEnd }
  })
  .select("name company nextFollowUp notes")
  .sort("nextFollowUp")
  .lean();

  return res.status(200).json(
    new ApiResponse(200, {
      leads: leadStats,
      revenue,
      followUps: todaysFollowUps
    }, "Sales dashboard summary fetched successfully")
  );
});

export const getMarketingDashboardSummary = asyncHandler(async (req, res) => {
  // 1. Leads overview
  const totalLeads = await Lead.countDocuments();
  const qualifiedLeads = await Lead.countDocuments({ status: { $in: ["Follow-up", "Proposal", "Negotiation", "Won"] } });
  const conversions = await Lead.countDocuments({ status: "Won" });
  
  // 2. Campaigns overview
  const totalCampaigns = await Campaign.countDocuments();
  
  const campaignsAgg = await Campaign.aggregate([
    {
      $group: {
        _id: null,
        totalSpend: { $sum: "$spend" }
      }
    }
  ]);
  const campaignSpend = campaignsAgg.length > 0 ? campaignsAgg[0].totalSpend : 0;

  // 3. Conversion Rate
  const conversionRate = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) : 0;
  
  // 4. Lead Sources Breakdown
  const sourcesAgg = await Lead.aggregate([
    {
      $group: {
        _id: "$source",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  const leadSources = sourcesAgg.map(s => ({
    name: s._id || "Other",
    value: s.count
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      kpis: {
        totalCampaigns,
        leadsGenerated: totalLeads,
        qualifiedLeads,
        conversions,
        conversionRate,
        campaignSpend
      },
      leadSources
    }, "Marketing dashboard summary fetched successfully")
  );
});

export const getProjectDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. My Clients (assigned to this PM)
  const myClientsCount = await Client.countDocuments({ accountManager: userId });

  // 2. Projects (assigned to this PM)
  const projects = await Project.find({ projectManager: userId }).lean();
  let activeProjects = 0;
  let delayedProjects = 0;
  let completedProjects = 0;
  
  const projectIds = projects.map(p => p._id);

  projects.forEach(p => {
    if (p.status === "Active") activeProjects++;
    if (p.status === "Delayed") delayedProjects++;
    if (p.status === "Completed") completedProjects++;
  });

  // 3. Tasks
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const pendingTasks = await Task.countDocuments({ project: { $in: projectIds }, status: { $ne: "COMPLETED" } });
  const tasksDueToday = await Task.countDocuments({ project: { $in: projectIds }, status: { $ne: "COMPLETED" }, dueDate: { $gte: todayStart, $lte: todayEnd } });
  
  const allTasks = await Task.find({ project: { $in: projectIds } }).populate("project", "name").sort("dueDate").lean();
  
  // Categorize tasks for Kanban board
  const todoTasks = allTasks.filter(t => t.status === "TODO");
  const inProgressTasks = allTasks.filter(t => t.status === "IN PROGRESS");
  const completedTasks = allTasks.filter(t => t.status === "COMPLETED");
  
  // Project Alerts (Tasks due today or overdue)
  const alerts = allTasks.filter(t => t.status !== "COMPLETED" && new Date(t.dueDate) <= todayEnd).map(t => ({
    title: t.title,
    projectName: t.project?.name,
    dueDate: t.dueDate,
    isOverdue: new Date(t.dueDate) < todayStart
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      kpis: {
        myClients: myClientsCount,
        activeProjects,
        pendingTasks,
        tasksDueToday,
        delayedProjects,
        completedProjects
      },
      taskBoard: {
        todo: todoTasks,
        inProgress: inProgressTasks,
        completed: completedTasks
      },
      alerts
    }, "Project dashboard summary fetched successfully")
  );
});

export const getFinanceDashboardSummary = asyncHandler(async (req, res) => {
  // 1. Finance Overview (Payments)
  const payments = await Payment.aggregate([
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const financeStats = { totalRevenue: 0, received: 0, pending: 0, overdue: 0 };
  
  payments.forEach(p => {
    financeStats.totalRevenue += p.totalAmount;
    if (p._id === "Paid") financeStats.received += p.totalAmount;
    if (p._id === "Pending") financeStats.pending += p.totalAmount;
    if (p._id === "Overdue") financeStats.overdue += p.totalAmount;
  });

  // 2. Expenses Overview
  const expenses = await Expense.aggregate([
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" }
      }
    }
  ]);
  
  const totalExpenses = expenses.length > 0 ? expenses[0].totalExpenses : 0;
  financeStats.totalExpenses = totalExpenses;
  financeStats.netRevenue = financeStats.received - totalExpenses; // Net revenue typically based on received

  return res.status(200).json(
    new ApiResponse(200, {
      kpis: financeStats
    }, "Finance dashboard summary fetched successfully")
  );
});
