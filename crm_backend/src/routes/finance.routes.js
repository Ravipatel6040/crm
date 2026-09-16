import { Router } from "express";
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getPayments,
  getPaymentsSummary,
  createPayment,
  updatePayment,
  deletePayment,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/finance.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const invoiceRouter = Router();
const paymentRouter = Router();
const expenseRouter = Router();

// Finance data is read-only for BD_SALES/PROJECT_MANAGER/MARKETING (they see
// figures tied to their own leads/projects elsewhere); only ADMIN and
// FINANCE can create, edit or delete.
const CAN_READ = ["ADMIN", "FINANCE", "BD_SALES", "PROJECT_MANAGER", "MARKETING"];
const CAN_WRITE = ["ADMIN", "FINANCE"];

// Invoices
invoiceRouter.use(authenticate);
invoiceRouter.route("/")
  .get(authorizeRoles(...CAN_READ), getInvoices)
  .post(authorizeRoles(...CAN_WRITE), createInvoice);
invoiceRouter.route("/:id")
  .get(authorizeRoles(...CAN_READ), getInvoiceById)
  .patch(authorizeRoles(...CAN_WRITE), updateInvoice)
  .delete(authorizeRoles(...CAN_WRITE), deleteInvoice);

// Payments
paymentRouter.use(authenticate);
paymentRouter.get("/summary", authorizeRoles(...CAN_READ), getPaymentsSummary);
paymentRouter.route("/")
  .get(authorizeRoles(...CAN_READ), getPayments)
  .post(authorizeRoles(...CAN_WRITE), createPayment);
paymentRouter.route("/:id")
  .patch(authorizeRoles(...CAN_WRITE), updatePayment)
  .delete(authorizeRoles(...CAN_WRITE), deletePayment);

// Expenses
expenseRouter.use(authenticate);
expenseRouter.route("/")
  .get(authorizeRoles(...CAN_READ), getExpenses)
  .post(authorizeRoles(...CAN_WRITE), createExpense);
expenseRouter.route("/:id")
  .patch(authorizeRoles(...CAN_WRITE), updateExpense)
  .delete(authorizeRoles(...CAN_WRITE), deleteExpense);

export { invoiceRouter, paymentRouter, expenseRouter };
