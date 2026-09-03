import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema } from "../utils/validation.js";
import {
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public auth routes
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshToken);

// Protected auth routes
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.put("/change-password", authenticate, changePassword);

export { router as authRoutes };
