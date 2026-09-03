import { Router } from "express";

import {
  createLead,
  getLeads,
  getLead,
  updateLead,
  deleteLead,
  getLeadActivities,
  createLeadActivity,
  updateLeadActivity,
  deleteLeadActivity,
  convertLead,
} from "../controllers/lead.controller.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware.js";

const router = Router();

// Get all leads
router.get(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "BD_SALES",
    "MARKETING",
    "PROJECT_MANAGER"
  ),
  getLeads
);

// Create lead
router.post(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "BD_SALES",
    "MARKETING"
  ),
  createLead
);

// Get single lead
router.get(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "BD_SALES",
    "MARKETING",
    "PROJECT_MANAGER"
  ),
  getLead
);

// Update lead (supports PUT and PATCH)
router.put(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "BD_SALES",
    "MARKETING"
  ),
  updateLead
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "BD_SALES",
    "MARKETING"
  ),
  updateLead
);

// Delete lead
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "BD_SALES"
  ),
  deleteLead
);

// Get all lead activities
router.get(
  "/:id/activities",
  authenticate,
  authorizeRoles("ADMIN", "BD_SALES", "MARKETING", "PROJECT_MANAGER"),
  getLeadActivities
);

// Create lead activity
router.post(
  "/:id/activities",
  authenticate,
  authorizeRoles("ADMIN", "BD_SALES", "MARKETING", "PROJECT_MANAGER"),
  createLeadActivity
);

// Update lead activity
router.put(
  "/:id/activities/:activityId",
  authenticate,
  authorizeRoles("ADMIN", "BD_SALES", "MARKETING", "PROJECT_MANAGER"),
  updateLeadActivity
);

// Delete lead activity
router.delete(
  "/:id/activities/:activityId",
  authenticate,
  authorizeRoles("ADMIN", "BD_SALES", "MARKETING", "PROJECT_MANAGER"),
  deleteLeadActivity
);

// Convert lead to client
router.post(
  "/:id/convert",
  authenticate,
  authorizeRoles("ADMIN", "BD_SALES", "MARKETING"),
  convertLead
);

export { router as leadRoutes };