import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema } from "../utils/validation.js";

import {
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../controllers/user.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", authenticate, logoutUser);

export { router as userRoutes };