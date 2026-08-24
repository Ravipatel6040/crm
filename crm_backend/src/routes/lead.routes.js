import { Router } from "express";

import {
  createLead,
  getLeads,
  getLead,
  updateLead,
  deleteLead,
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

// Update lead
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

export { router as leadRoutes };