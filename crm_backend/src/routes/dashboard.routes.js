import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import {
  getDashboardSummary,
  getRevenueOverview,
  getPipelineSummary,
  getLeadSourcesSummary,
  getSalesDashboardSummary,
  getMarketingDashboardSummary,
  getProjectDashboardSummary,
  getFinanceDashboardSummary,
  getTeamPerformance
} from "../controllers/dashboard.controller.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate); // Require authentication for all dashboard routes

// Secure specific endpoints strictly by role
dashboardRoutes.get("/summary", authorizeRoles("ADMIN"), getDashboardSummary);
dashboardRoutes.get("/team-performance", authorizeRoles("ADMIN"), getTeamPerformance);
dashboardRoutes.get("/sales-summary", authorizeRoles("ADMIN", "BD_SALES"), getSalesDashboardSummary);
dashboardRoutes.get("/marketing-summary", authorizeRoles("ADMIN", "MARKETING"), getMarketingDashboardSummary);
dashboardRoutes.get("/project-summary", authorizeRoles("ADMIN", "PROJECT_MANAGER"), getProjectDashboardSummary);
dashboardRoutes.get("/finance-summary", authorizeRoles("ADMIN", "FINANCE"), getFinanceDashboardSummary);

// These could be shared across a few roles depending on requirement, currently open to all authenticated users or we can restrict them too:
dashboardRoutes.get("/revenue-overview", authorizeRoles("ADMIN", "FINANCE", "BD_SALES"), getRevenueOverview);
dashboardRoutes.get("/pipeline-summary", authorizeRoles("ADMIN", "BD_SALES", "MARKETING"), getPipelineSummary);
dashboardRoutes.get("/lead-sources-summary", authorizeRoles("ADMIN", "MARKETING", "BD_SALES"), getLeadSourcesSummary);
