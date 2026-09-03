import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, createUserSchema } from "../utils/validation.js";

import {
  adminLogin,
  createAdmin,
  createUserAccount,
  getUsers,
  updateUserAccount,
  deleteUserAccount,
  getUserWorkload,
  forceLogoutUser,
  getAuditLogs,
  refreshAdminToken,
  adminLogout,
  getAdminProfile,
} from "../controllers/admin.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// ─── Public routes (no auth required) ────────────────────────────────────────
// /create is a one-time bootstrap: it refuses once any ADMIN exists and can be
// further gated with ADMIN_BOOTSTRAP_SECRET. See createAdmin.
router.post("/create", createAdmin);
router.post("/login", validate(loginSchema), adminLogin);
router.post("/refresh", refreshAdminToken);

// ─── Protected routes (valid access token required) ───────────────────────────
router.post("/logout", authenticate, adminLogout);
router.get("/me", authenticate, authorizeRoles("ADMIN"), getAdminProfile);
router.post("/users/create", authenticate, authorizeRoles("ADMIN"), validate(createUserSchema), createUserAccount);
router.get("/users", authenticate, authorizeRoles("ADMIN", "BD_SALES", "PROJECT_MANAGER", "MARKETING", "FINANCE"), getUsers);
router.get("/users/:id/workload", authenticate, authorizeRoles("ADMIN"), getUserWorkload);
router.post("/users/:id/force-logout", authenticate, authorizeRoles("ADMIN"), forceLogoutUser);
router.patch("/users/:id", authenticate, authorizeRoles("ADMIN"), updateUserAccount);
router.delete("/users/:id", authenticate, authorizeRoles("ADMIN"), deleteUserAccount);

// Audit trail
router.get("/audit-logs", authenticate, authorizeRoles("ADMIN"), getAuditLogs);

export { router as adminRoutes };
