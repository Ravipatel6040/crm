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
import { authenticate } from "../middleware/auth.middleware.js";

const invoiceRouter = Router();
const paymentRouter = Router();
const expenseRouter = Router();

// Invoices
invoiceRouter.use(authenticate);
invoiceRouter.route("/").get(getInvoices).post(createInvoice);
invoiceRouter.route("/:id").get(getInvoiceById).patch(updateInvoice).delete(deleteInvoice);

// Payments
paymentRouter.use(authenticate);
paymentRouter.route("/summary").get(getPaymentsSummary);
paymentRouter.route("/").get(getPayments).post(createPayment);
paymentRouter.route("/:id").patch(updatePayment).delete(deletePayment);

// Expenses
expenseRouter.use(authenticate);
expenseRouter.route("/").get(getExpenses).post(createExpense);
expenseRouter.route("/:id").patch(updateExpense).delete(deleteExpense);

export { invoiceRouter, paymentRouter, expenseRouter };
