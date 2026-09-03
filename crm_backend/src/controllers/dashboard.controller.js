import { Lead } from "../models/lead.model.js";
import { User } from "../models/user.model.js";
import { Client } from "../models/client.model.js";
import { Project } from "../models/project.model.js";
import { Payment } from "../models/payment.model.js";
import { Expense } from "../models/expense.model.js";
import { Campaign } from "../models/campaign.model.js";
import { Task } from "../models/task.model.js";
import { Requirement } from "../models/requirement.model.js";
import { getSettings } from "../models/settings.model.js";
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
  const activeStages = ["Planning", "Requirements", "Development", "Testing", "Client Review", "Active"];
  projects.forEach(p => {
    if (p._id === "Completed") {
      projectStats.completed += p.count;
    } else if (p._id === "Pending") {
      projectStats.pending += p.count;
    } else if (p._id === "Delayed") {
      projectStats.delayed += p.count;
    } else if (activeStages.includes(p._id) || !p._id) {
      projectStats.active += p.count;
    }
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

  // E. Current-month figures (real, not estimated)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthlyRevenueAgg, newClientsThisMonth, wonThisMonth] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          status: "Paid",
          $expr: {
            $gte: [{ $ifNull: ["$paidDate", "$createdAt"] }, monthStart]
          }
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Client.countDocuments({ createdAt: { $gte: monthStart } }),
    Lead.countDocuments({ status: "Won", updatedAt: { $gte: monthStart } }),
  ]);

  // Compile final summary payload
  return res.status(200).json(
    new ApiResponse(200, {
      business: {
        totalRevenue: financeStats.totalRevenue,
        monthlyRevenue: monthlyRevenueAgg[0]?.total || 0,
        pendingPayments: financeStats.pendingPayments,
        totalExpenses: financeStats.totalExpenses,
        netRevenue: financeStats.netRevenue,
        newClients: newClientsThisMonth,
        lostClients: clientStats.inactive,
        activeProjects: projectStats.active,
        dealsWonThisMonth: wonThisMonth,
      },
      leads: leadStats,
      clients: clientStats,
      projects: projectStats,
      finance: financeStats
    }, "Dashboard summary fetched successfully")
  );
});

// ─── GET /api/v1/dashboard/team-performance ───────────────────────────────────
// Per-rep pipeline, conversion and value. This is what an owner opens the
// dashboard to see and it was previously only available in aggregate.

export const getTeamPerformance = asyncHandler(async (req, res) => {
  const rows = await Lead.aggregate([
    { $match: { assignedTo: { $ne: null } } },
    {
      $group: {
        _id: "$assignedTo",
        total: { $sum: 1 },
        won: { $sum: { $cond: [{ $eq: ["$status", "Won"] }, 1, 0] } },
        lost: { $sum: { $cond: [{ $eq: ["$status", "Lost"] }, 1, 0] } },
        openValue: {
          $sum: {
            $cond: [
              { $in: ["$status", ["New", "Contacted", "Follow-up", "Proposal", "Negotiation"]] },
              { $ifNull: ["$budget", 0] },
              0
            ]
          }
        },
        wonValue: {
          $sum: { $cond: [{ $eq: ["$status", "Won"] }, { $ifNull: ["$budget", 0] }, 0] }
        },
        overdueFollowUps: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$nextFollowUp", null] },
                  { $lt: ["$nextFollowUp", new Date()] },
                  { $not: [{ $in: ["$status", ["Won", "Lost"]] }] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $match: { "user.isArchived": { $ne: true } } },
    { $sort: { wonValue: -1, won: -1 } }
  ]);

  const data = rows.map((r) => ({
    id: r._id.toString(),
    name: r.user.name,
    email: r.user.email,
    role: r.user.role,
    designation: r.user.designation || "",
    total: r.total,
    won: r.won,
    lost: r.lost,
    open: r.total - r.won - r.lost,
    openValue: r.openValue,
    wonValue: r.wonValue,
    overdueFollowUps: r.overdueFollowUps,
    conversionRate: r.total > 0 ? Math.round((r.won / r.total) * 100) : 0,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Team performance fetched successfully"));
});

export const getRevenueOverview = asyncHandler(async (req, res) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  // Sliding 6-month window ending with the current month, seeded at zero.
  // Every figure below comes from the database — no baselines, no demo data.
  const monthsMap = new Map();
  const monthsList = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const item = {
      year: d.getFullYear(),
      monthNum: d.getMonth() + 1,
      month: monthNames[d.getMonth()],
      name: monthNames[d.getMonth()],
      paid: 0,
      pending: 0,
    };
    monthsMap.set(key, item);
    monthsList.push(item);
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // 1. Aggregate from Payment collection and add on top of baseline
  const paymentAgg = await Payment.aggregate([
    {
      $match: {
        $or: [
          { createdAt: { $gte: sixMonthsAgo } },
          { dueDate: { $gte: sixMonthsAgo } },
          { paidDate: { $gte: sixMonthsAgo } }
        ]
      }
    },
    {
      $project: {
        amount: 1,
        status: 1,
        date: { $ifNull: ["$paidDate", { $ifNull: ["$dueDate", "$createdAt"] }] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          status: "$status"
        },
        total: { $sum: "$amount" }
      }
    }
  ]);

  paymentAgg.forEach(p => {
    const key = `${p._id.year}-${p._id.month}`;
    if (monthsMap.has(key)) {
      const entry = monthsMap.get(key);
      if (p._id.status === "Paid") {
        entry.paid += p.total;
      } else {
        entry.pending += p.total;
      }
    }
  });

  // 2. Real expenses per month, so the chart compares like with like.
  const expenseAgg = await Expense.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $project: {
        amount: 1,
        date: { $ifNull: ["$date", "$createdAt"] }
      }
    },
    {
      $group: {
        _id: { year: { $year: "$date" }, month: { $month: "$date" } },
        total: { $sum: "$amount" }
      }
    }
  ]);

  const expenseByMonth = new Map();
  expenseAgg.forEach(e => {
    expenseByMonth.set(`${e._id.year}-${e._id.month}`, e.total);
  });

  const finalOverview = monthsList.map(m => {
    const key = `${m.year}-${m.monthNum}`;
    return {
      month: m.month,
      name: m.month,
      paid: m.paid,
      revenue: m.paid,
      pending: m.pending,
      expenses: expenseByMonth.get(key) || 0
    };
  });

  return res.status(200).json(new ApiResponse(200, finalOverview, "Revenue overview fetched successfully"));
});

export const getPipelineSummary = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const isAdmin = req.user?.role === "ADMIN";

  let matchFilter = {};
  if (!isAdmin && req.user?.role === "BD_SALES" && userId) {
    const repLeadsCount = await Lead.countDocuments({ assignedTo: userId });
    if (repLeadsCount > 0) {
      matchFilter = { assignedTo: userId };
    }
  }

  const pipelineAgg = await Lead.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const map = {};
  pipelineAgg.forEach(p => {
    map[p._id] = p.count;
  });

  const settings = await getSettings();
  const stages = settings.options?.pipelineStages?.length
    ? settings.options.pipelineStages
    : ["New", "Contacted", "Follow-up", "Proposal", "Negotiation", "Won", "Lost"];

  const result = stages.map(st => ({
    stage: st,
    name: st,
    count: map[st] || 0,
    value: map[st] || 0
  }));

  return res.status(200).json(new ApiResponse(200, result, "Pipeline summary fetched"));
});

export const getLeadSourcesSummary = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const isAdmin = req.user?.role === "ADMIN";

  let matchFilter = {};
  if (!isAdmin && req.user?.role === "BD_SALES" && userId) {
    const repLeadsCount = await Lead.countDocuments({ assignedTo: userId });
    if (repLeadsCount > 0) {
      matchFilter = { assignedTo: userId };
    }
  }

  const sourcesAgg = await Lead.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: "$source",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const result = sourcesAgg.map(s => ({
    name: s._id || "Other",
    value: s.count
  }));

  return res.status(200).json(new ApiResponse(200, result, "Lead sources fetched"));
});

export const getSalesDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const isAdmin = req.user.role === "ADMIN";

  // 1. Leads overview (all for ADMIN, assigned only for sales reps)
  const matchFilter = isAdmin ? {} : { assignedTo: userId };
  const leads = await Lead.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      }
    }
  ]);
  
  const leadStats = { total: 0, new: 0, contacted: 0, followUp: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 };
  leads.forEach(l => {
    leadStats.total += l.count;
    if (l._id === "New") leadStats.new = l.count;
    if (l._id === "Contacted") leadStats.contacted = l.count;
    if (l._id === "Follow-up") leadStats.followUp = l.count;
    if (l._id === "Proposal") leadStats.proposal = l.count;
    if (l._id === "Negotiation") leadStats.negotiation = l.count;
    if (l._id === "Won") leadStats.won = l.count;
    if (l._id === "Lost") leadStats.lost = l.count;
  });

  // 2. Real Revenue from deals won in MongoDB
  const wonRevenueAgg = await Lead.aggregate([
    { $match: { ...matchFilter, status: "Won" } },
    { $group: { _id: null, total: { $sum: "$budget" } } }
  ]);
  const wonRevenue = wonRevenueAgg.length > 0 ? wonRevenueAgg[0].total : 0;

  const paymentsAgg = await Payment.aggregate([
    { $match: { status: "Paid" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const paidRevenue = paymentsAgg.length > 0 ? paymentsAgg[0].total : 0;

  const revenue = wonRevenue > 0 ? wonRevenue : paidRevenue;

  // 3. Today's Follow-ups
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const followUpQuery = isAdmin
    ? { nextFollowUp: { $gte: todayStart, $lte: todayEnd } }
    : { assignedTo: userId, nextFollowUp: { $gte: todayStart, $lte: todayEnd } };

  const todaysFollowUps = await Lead.find(followUpQuery)
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
  const isAdmin = req.user.role === "ADMIN";

  // 1. Clients (all for ADMIN, assigned to this PM otherwise)
  const clientFilter = isAdmin ? {} : { accountManager: userId };
  const myClientsCount = await Client.countDocuments(clientFilter);

  // 2. Projects (all for ADMIN, assigned to this PM otherwise)
  const projectFilter = isAdmin ? {} : { projectManager: userId };
  const projects = await Project.find(projectFilter).lean();
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

  // 4. Requirements for these projects or assigned to this PM
  const requirements = await Requirement.find({
    $or: [
      { project: { $in: projectIds } },
      { assignedTo: userId }
    ]
  }).sort({ createdAt: -1 }).limit(10).lean();

  const formattedProjects = projects.map(p => ({
    id: p._id.toString(),
    _id: p._id.toString(),
    name: p.name,
    clientName: p.clientName || "Direct Client",
    status: p.status,
    priority: p.priority,
    deadline: p.deadline,
    notes: p.notes,
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
      assignedProjects: formattedProjects,
      requirements: requirements.map(r => ({
        id: r._id.toString(),
        _id: r._id.toString(),
        title: r.title,
        description: r.description,
        projectName: r.projectName,
        category: r.category,
        priority: r.priority,
        status: r.status,
        completed: r.completed
      })),
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
