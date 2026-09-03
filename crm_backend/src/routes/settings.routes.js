import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import {
  getAppSettings,
  updateAppSettings,
  resetAppSettings,
} from "../controllers/settings.controller.js";

const router = Router();

// Every signed-in user reads settings (currency, date format, dropdown
// options); only an admin writes them.
router.get("/", authenticate, getAppSettings);
router.patch("/", authenticate, authorizeRoles("ADMIN"), updateAppSettings);
router.post("/reset", authenticate, authorizeRoles("ADMIN"), resetAppSettings);

export { router as settingsRoutes };
