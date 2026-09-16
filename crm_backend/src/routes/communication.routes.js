import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getCommunications,
  createCommunication,
  deleteCommunication,
} from "../controllers/communication.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getCommunications);
router.post("/", createCommunication);
router.delete("/:id", deleteCommunication);

export { router as communicationRoutes };
