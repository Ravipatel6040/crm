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
  refreshAdminToken,
  adminLogout,
  getAdminProfile,
} from "../controllers/admin.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// ─── Public routes (no auth required) ────────────────────────────────────────
router.post("/create", createAdmin);
router.post("/login", validate(loginSchema), adminLogin);
router.post("/refresh", refreshAdminToken);

// ─── Protected routes (valid access token required) ───────────────────────────
router.post("/logout", authenticate, adminLogout);
router.get("/me", authenticate, authorizeRoles("ADMIN"), getAdminProfile);
router.post("/users/create", authenticate, authorizeRoles("ADMIN"), validate(createUserSchema), createUserAccount);
router.get("/users", authenticate, authorizeRoles("ADMIN"), getUsers);
router.patch("/users/:id", authenticate, authorizeRoles("ADMIN"), updateUserAccount);
router.delete("/users/:id", authenticate, authorizeRoles("ADMIN"), deleteUserAccount);

export { router as adminRoutes };
