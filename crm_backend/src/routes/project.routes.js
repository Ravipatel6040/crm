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
// Tasks module hidden — uncomment this import and the routes below to restore.
// import {
//   getProjectTasks,
//   createProjectTask,
//   updateProjectTask,
//   deleteProjectTask,
// } from "../controllers/task.controller.js";

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

// Tasks, nested under a project — module hidden
// router.get("/:projectId/tasks", getProjectTasks);
// router.post("/:projectId/tasks", createProjectTask);
// router.patch("/:projectId/tasks/:taskId", updateProjectTask);
// router.delete("/:projectId/tasks/:taskId", deleteProjectTask);

export { router as projectRoutes };
