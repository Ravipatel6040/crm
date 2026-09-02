import mongoose from "mongoose";
import { Invoice } from "../models/invoice.model.js";
import { Payment } from "../models/payment.model.js";
import { Expense } from "../models/expense.model.js";
import { Client } from "../models/client.model.js";
import { Project } from "../models/project.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ==========================================
// 1. INVOICES CONTROLLERS
// ==========================================

export const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find()
    .populate("client", "name company email phone")
    .populate("project", "name client status")
    .sort({ createdAt: -1 });

  const formatted = invoices.map((inv) => ({
    id: inv._id.toString(),
    _id: inv._id.toString(),
    invoiceNumber: inv.invoiceNumber,
    client: inv.client?._id?.toString() || inv.client,
    clientName: inv.client?.company || inv.client?.name || inv.clientName || "Direct Client",
    clientObj: inv.client || null,
    project: inv.project?._id?.toString() || inv.project,
    projectName: inv.project?.name || inv.projectName || "General",
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    items: inv.items || [],
    subtotal: inv.subtotal || 0,
    tax: inv.tax || 0,
    discount: inv.discount || 0,
    total: inv.total || 0,
    amount: inv.total || 0,
    paidAmount: inv.paidAmount || 0,
    balanceDue: Math.max(0, (inv.total || 0) - (inv.paidAmount || 0)),
    status: inv.status || "Sent",
    notes: inv.notes || "",
    createdAt: inv.createdAt,
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Invoices fetched successfully"));
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const inv = await Invoice.findById(id)
    .populate("client", "name company email phone address")
    .populate("project", "name client status");

  if (!inv) {
    return res.status(404).json(new ApiResponse(404, null, "Invoice not found"));
  }

  const formatted = {
    id: inv._id.toString(),
    _id: inv._id.toString(),
    invoiceNumber: inv.invoiceNumber,
    client: inv.client?._id?.toString() || inv.client,
    clientName: inv.client?.company || inv.client?.name || inv.clientName || "Direct Client",
    clientObj: inv.client || null,
    project: inv.project?._id?.toString() || inv.project,
    projectName: inv.project?.name || inv.projectName || "General",
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    items: inv.items || [],
    subtotal: inv.subtotal || 0,
    tax: inv.tax || 0,
    discount: inv.discount || 0,
    total: inv.total || 0,
    amount: inv.total || 0,
    paidAmount: inv.paidAmount || 0,
    balanceDue: Math.max(0, (inv.total || 0) - (inv.paidAmount || 0)),
    status: inv.status || "Sent",
    notes: inv.notes || "",
    createdAt: inv.createdAt,
  };

  return res.status(200).json(new ApiResponse(200, formatted, "Invoice fetched successfully"));
});

export const createInvoice = asyncHandler(async (req, res) => {
  const {
    invoiceNumber,
    client,
    clientName,
    project,
    projectName,
    issueDate,
    dueDate,
    items,
    subtotal,
    tax,
    discount,
    total,
    paidAmount,
    status = "Sent",
    notes,
  } = req.body;

  let generatedNumber = invoiceNumber;
  if (!generatedNumber) {
    const count = await Invoice.countDocuments();
    generatedNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
  }

  const invoice = await Invoice.create({
    invoiceNumber: generatedNumber,
    client: client && mongoose.Types.ObjectId.isValid(client) ? client : null,
    clientName: clientName || "Direct Client",
    project: project && mongoose.Types.ObjectId.isValid(project) ? project : null,
    projectName: projectName || "",
    issueDate: issueDate ? new Date(issueDate) : new Date(),
    dueDate: dueDate ? new Date(dueDate) : null,
    items: items || [{ description: "Consulting & Delivery", quantity: 1, rate: total || 0, amount: total || 0 }],
    subtotal: subtotal || total || 0,
    tax: tax || 0,
    discount: discount || 0,
    total: total || 0,
    paidAmount: paidAmount || (status === "Paid" ? total || 0 : 0),
    status,
    notes: notes || "",
    createdBy: req.user?._id || null,
  });

  return res.status(201).json(new ApiResponse(201, invoice, "Invoice created successfully"));
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return res.status(404).json(new ApiResponse(404, null, "Invoice not found"));
  }

  const allowedFields = [
    "invoiceNumber", "client", "clientName", "project", "projectName",
    "issueDate", "dueDate", "items", "subtotal", "tax", "discount",
    "total", "paidAmount", "status", "notes"
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "issueDate" || field === "dueDate") {
        invoice[field] = req.body[field] ? new Date(req.body[field]) : null;
      } else {
        invoice[field] = req.body[field];
      }
    }
  });

  await invoice.save();
  return res.status(200).json(new ApiResponse(200, invoice, "Invoice updated successfully"));
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findByIdAndDelete(id);

  if (!invoice) {
    return res.status(404).json(new ApiResponse(404, null, "Invoice not found"));
  }

  return res.status(200).json(new ApiResponse(200, null, "Invoice deleted successfully"));
});

// ==========================================
// 2. PAYMENTS CONTROLLERS
// ==========================================

export const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("client", "name company email")
    .populate("project", "name status")
    .sort({ createdAt: -1 });

  const formatted = payments.map((p) => ({
    id: p._id.toString(),
    _id: p._id.toString(),
    invoiceNumber: p.invoiceNumber,
    client: p.client?.company || p.client?.name || "Direct Client",
    clientId: p.client?._id?.toString() || p.client,
    project: p.project?._id?.toString() || p.project,
    projectName: p.project?.name || "General",
    amount: p.amount,
    paid: p.status === "Paid" ? p.amount : 0,
    pending: p.status === "Paid" ? 0 : p.amount,
    status: p.status,
    dueDate: p.dueDate,
    paidDate: p.paidDate,
    notes: p.notes,
    createdAt: p.createdAt,
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Payments fetched successfully"));
});

export const getPaymentsSummary = asyncHandler(async (req, res) => {
  const payments = await Payment.find();
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPaid = payments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = payments.filter((p) => p.status !== "Paid").reduce((sum, p) => sum + (p.amount || 0), 0);
  const overdue = payments.filter((p) => p.status === "Overdue").reduce((sum, p) => sum + (p.amount || 0), 0);

  return res.status(200).json(
    new ApiResponse(200, { totalRevenue, totalPaid, totalPending, overdue }, "Summary fetched successfully")
  );
});

export const createPayment = asyncHandler(async (req, res) => {
  const {
    invoiceNumber,
    client,
    project,
    amount,
    status = "Paid",
    dueDate,
    paidDate,
    notes,
  } = req.body;

  let generatedNumber = invoiceNumber;
  if (!generatedNumber) {
    const count = await Payment.countDocuments();
    generatedNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
  }

  const payment = await Payment.create({
    invoiceNumber: generatedNumber,
    client: client && mongoose.Types.ObjectId.isValid(client) ? client : null,
    project: project && mongoose.Types.ObjectId.isValid(project) ? project : null,
    amount: Number(amount) || 0,
    status,
    dueDate: dueDate ? new Date(dueDate) : new Date(),
    paidDate: paidDate ? new Date(paidDate) : (status === "Paid" ? new Date() : null),
    notes: notes || "",
  });

  return res.status(201).json(new ApiResponse(201, payment, "Payment recorded successfully"));
});

export const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findById(id);

  if (!payment) {
    return res.status(404).json(new ApiResponse(404, null, "Payment not found"));
  }

  const allowedFields = ["invoiceNumber", "client", "project", "amount", "status", "dueDate", "paidDate", "notes"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "dueDate" || field === "paidDate") {
        payment[field] = req.body[field] ? new Date(req.body[field]) : null;
      } else {
        payment[field] = req.body[field];
      }
    }
  });

  await payment.save();
  return res.status(200).json(new ApiResponse(200, payment, "Payment updated successfully"));
});

export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findByIdAndDelete(id);

  if (!payment) {
    return res.status(404).json(new ApiResponse(404, null, "Payment not found"));
  }

  return res.status(200).json(new ApiResponse(200, null, "Payment deleted successfully"));
});

// ==========================================
// 3. EXPENSES CONTROLLERS
// ==========================================

export const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });

  const formatted = expenses.map((e) => ({
    id: e._id.toString(),
    _id: e._id.toString(),
    title: e.title,
    category: e.category,
    amount: e.amount,
    date: e.date,
    notes: e.notes,
    createdAt: e.createdAt,
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Expenses fetched successfully"));
});

export const createExpense = asyncHandler(async (req, res) => {
  const { title, category = "Other", amount, date, notes } = req.body;

  const expense = await Expense.create({
    title,
    category,
    amount: Number(amount) || 0,
    date: date ? new Date(date) : new Date(),
    notes: notes || "",
    approvedBy: req.user?._id || null,
  });

  return res.status(201).json(new ApiResponse(201, expense, "Expense recorded successfully"));
});

export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findById(id);

  if (!expense) {
    return res.status(404).json(new ApiResponse(404, null, "Expense not found"));
  }

  const allowedFields = ["title", "category", "amount", "date", "notes"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "date") {
        expense[field] = req.body[field] ? new Date(req.body[field]) : new Date();
      } else {
        expense[field] = req.body[field];
      }
    }
  });

  await expense.save();
  return res.status(200).json(new ApiResponse(200, expense, "Expense updated successfully"));
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findByIdAndDelete(id);

  if (!expense) {
    return res.status(404).json(new ApiResponse(404, null, "Expense not found"));
  }

  return res.status(200).json(new ApiResponse(200, null, "Expense deleted successfully"));
});
