import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getRequirements,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  getProjectManagers,
} from "../controllers/project.controller.js";

const router = Router();

router.use(authenticate);

// Managers endpoint
router.get("/managers", getProjectManagers);

// Requirements endpoints (must be before /:id)
router.get("/requirements", getRequirements);
router.post("/requirements", createRequirement);
router.patch("/requirements/:id", updateRequirement);
router.delete("/requirements/:id", deleteRequirement);

// Projects endpoints
router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

export { router as projectRoutes };
