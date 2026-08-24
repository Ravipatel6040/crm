import { Router } from "express";

import {
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../controllers/user.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", authenticate, logoutUser);

export { router as userRoutes };