import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
} from "../controllers/quotation.controller.js";

const router = Router();

router.use(authenticate);

// Sales creates and sends quotations; admins oversee everything. Editing and
// deleting are further limited to the author (or an admin) in the controller.
const CAN_ACCESS = ["ADMIN", "BD_SALES"];

router.route("/")
  .get(authorizeRoles(...CAN_ACCESS), getQuotations)
  .post(authorizeRoles(...CAN_ACCESS), createQuotation);

router.route("/:id")
  .get(authorizeRoles(...CAN_ACCESS), getQuotationById)
  .patch(authorizeRoles(...CAN_ACCESS), updateQuotation)
  .delete(authorizeRoles(...CAN_ACCESS), deleteQuotation);

export { router as quotationRoutes };
