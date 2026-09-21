import mongoose from "mongoose";
import { Quotation } from "../models/quotation.model.js";
import { Client } from "../models/client.model.js";
import { Lead } from "../models/lead.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { logAudit } from "../utils/audit.js";
import { createWithUniqueNumber } from "../utils/createWithUniqueNumber.js";

const USER_FIELDS = "name email phone designation role";
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const formatQuotation = (q) => ({
  id: q._id.toString(),
  quotationNumber: q.quotationNumber,
  title: q.title,
  recipientType: q.recipientType,
  client: q.client?._id?.toString() || q.client?.toString?.() || null,
  lead: q.lead?._id?.toString() || null,
  leadCode: q.lead?.leadId || null,
  recipientName: q.recipientName,
  recipientCompany: q.recipientCompany,
  recipientEmail: q.recipientEmail,
  recipientPhone: q.recipientPhone,
  issueDate: q.issueDate,
  validUntil: q.validUntil,
  items: q.items || [],
  subtotal: q.subtotal,
  discount: q.discount,
  taxRate: q.taxRate,
  tax: q.tax,
  total: q.total,
  terms: q.terms,
  notes: q.notes,
  status: q.status,
  sentAt: q.sentAt,
  sentBy: q.sentBy
    ? {
        id: q.sentBy._id.toString(),
        name: q.sentBy.name,
        email: q.sentBy.email,
        phone: q.sentBy.phone,
        designation: q.sentBy.designation,
      }
    : null,
  createdBy: q.createdBy
    ? {
        id: q.createdBy._id.toString(),
        name: q.createdBy.name,
        email: q.createdBy.email,
        phone: q.createdBy.phone,
        designation: q.createdBy.designation,
      }
    : null,
  createdAt: q.createdAt,
  updatedAt: q.updatedAt,
});

const populateQuotation = (query) =>
  query
    .populate("sentBy", USER_FIELDS)
    .populate("createdBy", USER_FIELDS)
    .populate("lead", "leadId");

// Line items are re-priced here from quantity × rate and the totals derived
// from them, so a tampered or stale total from the browser can't be saved.
const computeTotals = (rawItems, rawDiscount, rawTaxRate) => {
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .filter((i) => i?.description?.trim())
    .map((i) => {
      const quantity = Math.max(0, Number(i.quantity) || 0);
      const rate = Math.max(0, Number(i.rate) || 0);
      return { description: i.description.trim(), quantity, rate, amount: round2(quantity * rate) };
    });

  if (items.length === 0) {
    throw new ApiError(400, "Add at least one line item with a description");
  }

  const taxRate = Number(rawTaxRate) || 0;
  if (taxRate < 0 || taxRate > 100) {
    throw new ApiError(400, "Tax rate must be between 0 and 100");
  }

  const subtotal = round2(items.reduce((sum, i) => sum + i.amount, 0));
  const discount = Math.min(subtotal, Math.max(0, Number(rawDiscount) || 0));
  const tax = round2((subtotal - discount) * (taxRate / 100));
  const total = round2(subtotal - discount + tax);

  if (total <= 0) {
    throw new ApiError(400, "Quotation total must be greater than 0");
  }

  return { items, subtotal, discount, taxRate, tax, total };
};

// The rest of the app addresses a lead by its "L-1234" code, not its Mongo id.
const findLead = async (idOrCode) => {
  if (!idOrCode) return null;
  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    const byId = await Lead.findById(idOrCode);
    if (byId) return byId;
  }
  return Lead.findOne({ leadId: String(idOrCode) });
};

// Copies the recipient's contact details onto the quotation.
const resolveRecipient = async (recipientType, clientId, leadIdOrCode) => {
  if (recipientType === "Lead") {
    if (!leadIdOrCode) {
      throw new ApiError(400, "Select the lead this quotation is for");
    }
    const lead = await findLead(leadIdOrCode);
    if (!lead) throw new ApiError(404, "Lead not found");
    return {
      recipientType: "Lead",
      client: null,
      lead: lead._id,
      recipientName: lead.name,
      recipientCompany: lead.company,
      recipientEmail: lead.email,
      recipientPhone: lead.phone,
    };
  }

  if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
    throw new ApiError(400, "Select the client this quotation is for");
  }
  const client = await Client.findById(clientId);
  if (!client) throw new ApiError(404, "Client not found");
  return {
    recipientType: "Client",
    client: client._id,
    lead: null,
    recipientName: client.name,
    recipientCompany: client.company,
    recipientEmail: client.email || "",
    recipientPhone: client.phone || "",
  };
};

const parseDates = (issueDate, validUntil) => {
  const issue = issueDate ? new Date(issueDate) : new Date();
  const valid = validUntil ? new Date(validUntil) : null;
  if (Number.isNaN(issue.getTime()) || (valid && Number.isNaN(valid.getTime()))) {
    throw new ApiError(400, "Invalid date");
  }
  if (valid && valid < issue) {
    throw new ApiError(400, "'Valid until' cannot be before the issue date");
  }
  return { issueDate: issue, validUntil: valid };
};

const isOwnerOrAdmin = (quotation, user) =>
  user.role === "ADMIN" ||
  (quotation.createdBy && String(quotation.createdBy._id || quotation.createdBy) === String(user._id));

// ─── GET /api/v1/quotations ───────────────────────────────────────────────────
export const getQuotations = asyncHandler(async (req, res) => {
  const { client, lead, status, sentBy } = req.query;
  const filter = {};
  if (client && mongoose.Types.ObjectId.isValid(client)) filter.client = client;
  if (lead && mongoose.Types.ObjectId.isValid(lead)) filter.lead = lead;
  if (status) filter.status = status;
  if (sentBy && mongoose.Types.ObjectId.isValid(sentBy)) filter.sentBy = sentBy;

  const quotations = await populateQuotation(Quotation.find(filter).sort({ createdAt: -1 }));
  return res
    .status(200)
    .json(new ApiResponse(200, quotations.map(formatQuotation), "Quotations fetched successfully"));
});

// ─── GET /api/v1/quotations/:id ───────────────────────────────────────────────
export const getQuotationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid quotation id");

  const quotation = await populateQuotation(Quotation.findById(id));
  if (!quotation) throw new ApiError(404, "Quotation not found");

  return res.status(200).json(new ApiResponse(200, formatQuotation(quotation), "Quotation fetched successfully"));
});

// ─── POST /api/v1/quotations ──────────────────────────────────────────────────
export const createQuotation = asyncHandler(async (req, res) => {
  const {
    title, recipientType = "Client", client, lead, issueDate, validUntil,
    items, discount, taxRate, terms, notes, status = "Draft",
  } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Quotation title is required");
  if (!["Draft", "Sent"].includes(status)) {
    throw new ApiError(400, "A new quotation can only be saved as Draft or Sent");
  }

  const recipient = await resolveRecipient(recipientType, client, lead);
  const dates = parseDates(issueDate, validUntil);
  const totals = computeTotals(items, discount, taxRate);
  const isSent = status === "Sent";

  const quotation = await createWithUniqueNumber(
    Quotation,
    () => ({
      quotationNumber: `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      ...recipient,
      ...dates,
      ...totals,
      terms: terms || "",
      notes: notes || "",
      status,
      sentBy: isSent ? req.user._id : null,
      sentAt: isSent ? new Date() : null,
      createdBy: req.user._id,
    }),
    true
  );

  await logAudit(req, {
    entityType: "Quotation",
    entityId: quotation._id,
    entityLabel: quotation.quotationNumber,
    action: "CREATE",
    content: `${isSent ? "Created and sent" : "Created draft"} quotation ${quotation.quotationNumber} (Rs. ${quotation.total.toLocaleString("en-IN")}) for ${quotation.recipientCompany || quotation.recipientName}`,
  });

  const populated = await populateQuotation(Quotation.findById(quotation._id));
  return res.status(201).json(new ApiResponse(201, formatQuotation(populated), "Quotation created successfully"));
});

// ─── PATCH /api/v1/quotations/:id ─────────────────────────────────────────────
export const updateQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid quotation id");

  const quotation = await Quotation.findById(id);
  if (!quotation) throw new ApiError(404, "Quotation not found");

  if (!isOwnerOrAdmin(quotation, req.user)) {
    throw new ApiError(403, "You can only edit quotations you created");
  }

  const previousStatus = quotation.status;
  const body = req.body;

  if (body.title !== undefined) {
    if (!body.title.trim()) throw new ApiError(400, "Quotation title is required");
    quotation.title = body.title.trim();
  }

  // Re-snapshot the recipient only when it actually changed, so editing a
  // sent quotation never silently rewrites who it was addressed to.
  if (body.recipientType !== undefined || body.client !== undefined || body.lead !== undefined) {
    const next = await resolveRecipient(
      body.recipientType || quotation.recipientType,
      body.client !== undefined ? body.client : quotation.client,
      body.lead !== undefined ? body.lead : quotation.lead
    );
    const changed =
      next.recipientType !== quotation.recipientType ||
      String(next.client || "") !== String(quotation.client || "") ||
      String(next.lead || "") !== String(quotation.lead || "");
    if (changed) Object.assign(quotation, next);
  }

  if (body.issueDate !== undefined || body.validUntil !== undefined) {
    Object.assign(
      quotation,
      parseDates(
        body.issueDate !== undefined ? body.issueDate : quotation.issueDate,
        body.validUntil !== undefined ? body.validUntil : quotation.validUntil
      )
    );
  }

  if (body.items !== undefined || body.discount !== undefined || body.taxRate !== undefined) {
    Object.assign(
      quotation,
      computeTotals(
        body.items !== undefined ? body.items : quotation.items,
        body.discount !== undefined ? body.discount : quotation.discount,
        body.taxRate !== undefined ? body.taxRate : quotation.taxRate
      )
    );
  }

  if (body.terms !== undefined) quotation.terms = body.terms;
  if (body.notes !== undefined) quotation.notes = body.notes;

  if (body.status !== undefined) {
    if (!["Draft", "Sent", "Accepted", "Rejected"].includes(body.status)) {
      throw new ApiError(400, "Invalid status");
    }
    quotation.status = body.status;
  }

  // The first time a quotation goes out, record who sent it and when. Later
  // edits (or moving it on to Accepted/Rejected) never overwrite that.
  const wasSentNow = quotation.status !== "Draft" && !quotation.sentAt;
  if (wasSentNow) {
    quotation.sentBy = req.user._id;
    quotation.sentAt = new Date();
  }

  await quotation.save();

  const statusChanged = previousStatus !== quotation.status;
  await logAudit(req, {
    entityType: "Quotation",
    entityId: quotation._id,
    entityLabel: quotation.quotationNumber,
    action: "UPDATE",
    content: statusChanged
      ? `Quotation ${quotation.quotationNumber} moved from ${previousStatus} to ${quotation.status}`
      : `Edited quotation ${quotation.quotationNumber}`,
  });

  const populated = await populateQuotation(Quotation.findById(quotation._id));
  return res.status(200).json(new ApiResponse(200, formatQuotation(populated), "Quotation updated successfully"));
});

// ─── DELETE /api/v1/quotations/:id ────────────────────────────────────────────
// A quotation that has been sent is part of the record of what was promised
// to a client, so only drafts can be removed by their author. Admins can
// remove any (e.g. test data).
export const deleteQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid quotation id");

  const quotation = await Quotation.findById(id);
  if (!quotation) throw new ApiError(404, "Quotation not found");

  if (!isOwnerOrAdmin(quotation, req.user)) {
    throw new ApiError(403, "You can only delete quotations you created");
  }
  if (quotation.status !== "Draft" && req.user.role !== "ADMIN") {
    throw new ApiError(
      403,
      "A quotation that has been sent can't be deleted — mark it Rejected instead, or ask an admin"
    );
  }

  await quotation.deleteOne();

  await logAudit(req, {
    entityType: "Quotation",
    entityId: quotation._id,
    entityLabel: quotation.quotationNumber,
    action: "DELETE",
    content: `Deleted quotation ${quotation.quotationNumber} (${quotation.status})`,
  });

  return res.status(200).json(new ApiResponse(200, null, "Quotation deleted successfully"));
});
