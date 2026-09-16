import express from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/client.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all client routes
router.use(verifyJWT);

const CAN_READ = ["ADMIN", "BD_SALES", "PROJECT_MANAGER", "MARKETING", "FINANCE"];
const CAN_WRITE = ["ADMIN", "BD_SALES", "PROJECT_MANAGER"];
const CAN_DELETE = ["ADMIN", "BD_SALES"];

// Routes
router
  .route("/")
  .post(authorizeRoles(...CAN_WRITE), createClient)
  .get(authorizeRoles(...CAN_READ), getClients);

router
  .route("/:id")
  .get(authorizeRoles(...CAN_READ), getClientById)
  .put(authorizeRoles(...CAN_WRITE), updateClient)
  .patch(authorizeRoles(...CAN_WRITE), updateClient)
  .delete(authorizeRoles(...CAN_DELETE), deleteClient);

export { router as clientRoutes };
