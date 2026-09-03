import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema } from "../utils/validation.js";

import {
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById,
  changeUserPassword,
  getUserActivity,
} from "../controllers/user.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", authenticate, logoutUser);

// Self-service + admin user management. Per-record authorisation is enforced
// inside each controller (self, or ADMIN).
router.get("/:id", authenticate, getUserById);
router.patch("/:id/password", authenticate, changeUserPassword);
router.get("/:id/activity", authenticate, getUserActivity);

export { router as userRoutes };
