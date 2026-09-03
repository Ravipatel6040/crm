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

// Routes
router
  .route("/")
  .post(createClient)
  .get(getClients);

router
  .route("/:id")
  .get(getClientById)
  .put(updateClient)
  .delete(deleteClient);

export { router as clientRoutes };
