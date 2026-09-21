import mongoose from "mongoose";
import { Quotation } from "../models/quotation.model.js";
import { Client } from "../models/client.model.js";
import { Lead } from "../models/lead.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { logAudit } from "../utils/audit.js";
import { createWithUniqueNumber } from "../utils/createWithUniqueNumber.js";
import { Activity } from "../models/activity.model.js";
import { Communication } from "../models/communication.model.js";
import { getSettings } from "../models/settings.model.js";
import { buildQuotationPdf } from "../utils/quotationPdf.js";
import { buildQuotationEmail, defaultSubject, defaultMessage } from "../utils/quotationEmail.js";
import { isMailConfigured, getFromAddress, sendMail } from "../utils/mailer.js";

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
  emails: (q.emails || []).map((e) => ({
    id: e._id?.toString(),
    to: e.to,
    cc: e.cc,
    subject: e.subject,
    sentAt: e.sentAt,
    sentBy: e.sentBy?.name ? { id: e.sentBy._id.toString(), name: e.sentBy.name } : null,
  })),
  createdAt: q.createdAt,
  updatedAt: q.updatedAt,
});

const populateQuotation = (query) =>
  query
    .populate("sentBy", USER_FIELDS)
    .populate("createdBy", USER_FIELDS)
    .populate("emails.sentBy", "name")
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

// ─── Emailing ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/;
const MAX_RECIPIENTS = 10;

// Accepts an array or a "a@x.com, b@y.com" string; returns unique lower-cased
// addresses and throws on the first one that isn't a plausible email.
const parseEmails = (input, label) => {
  const list = (Array.isArray(input) ? input : String(input || "").split(/[,;\s]+/))
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(list)];
  const bad = unique.find((v) => !EMAIL_RE.test(v));
  if (bad) throw new ApiError(400, `"${bad}" isn't a valid ${label} email address`);
  return unique;
};

const pdfFilename = (q) => `Quotation-${String(q.quotationNumber).replace(/[^A-Za-z0-9._-]/g, "_")}.pdf`;

const orgFromSettings = async () => {
  const settings = await getSettings();
  const org = settings.organization?.toObject?.() ?? settings.organization ?? {};
  return org;
};

const loadFormatted = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid quotation id");
  const quotation = await populateQuotation(Quotation.findById(id));
  if (!quotation) throw new ApiError(404, "Quotation not found");
  return { quotation, formatted: formatQuotation(quotation) };
};

// ─── GET /api/v1/quotations/:id/pdf ───────────────────────────────────────────
export const getQuotationPdf = asyncHandler(async (req, res) => {
  const { formatted } = await loadFormatted(req.params.id);
  const org = await orgFromSettings();

  const pdf = buildQuotationPdf(formatted, org, { draft: formatted.status === "Draft" });

  res.set({
    "Content-Type": "application/pdf",
    "Content-Length": pdf.length,
    "Content-Disposition": `attachment; filename="${pdfFilename(formatted)}"`,
    "Cache-Control": "no-store",
  });
  return res.status(200).send(pdf);
});

// ─── GET /api/v1/quotations/:id/email-draft ───────────────────────────────────
// What the "Send" dialog opens with: recipient, subject and message, plus
// whether the server can send email at all.
export const getQuotationEmailDraft = asyncHandler(async (req, res) => {
  const { formatted } = await loadFormatted(req.params.id);
  const org = await orgFromSettings();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        configured: isMailConfigured(),
        from: getFromAddress(),
        replyTo: req.user.email || "",
        to: formatted.recipientEmail || "",
        subject: defaultSubject(formatted, org.name),
        message: defaultMessage(formatted, req.user, org.name),
        filename: pdfFilename(formatted),
      },
      "Email draft ready"
    )
  );
});

// ─── POST /api/v1/quotations/:id/send ─────────────────────────────────────────
export const sendQuotation = asyncHandler(async (req, res) => {
  const { quotation, formatted } = await loadFormatted(req.params.id);

  if (!isOwnerOrAdmin(quotation, req.user)) {
    throw new ApiError(403, "You can only send quotations you created");
  }

  const to = parseEmails(req.body.to || formatted.recipientEmail, "recipient");
  if (to.length === 0) {
    throw new ApiError(400, "Add at least one recipient email address");
  }
  const cc = parseEmails(req.body.cc, "CC").filter((a) => !to.includes(a));
  if (to.length + cc.length > MAX_RECIPIENTS) {
    throw new ApiError(400, `You can send to at most ${MAX_RECIPIENTS} addresses at once`);
  }

  const org = await orgFromSettings();
  const subject = String(req.body.subject || "").trim() || defaultSubject(formatted, org.name);
  const message = String(req.body.message || "").trim() || defaultMessage(formatted, req.user, org.name);
  if (subject.length > 200) throw new ApiError(400, "Subject is too long (200 characters max)");
  if (message.length > 5000) throw new ApiError(400, "Message is too long (5000 characters max)");

  // A draft becomes "Sent" by this very email, so the PDF should already name
  // the sender rather than say "Prepared by" and carry the DRAFT watermark.
  const willBeSent = quotation.status === "Draft";
  const sender = {
    id: req.user._id.toString(),
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    designation: req.user.designation,
  };
  const pdfInput = willBeSent ? { ...formatted, status: "Sent", sentBy: sender } : formatted;
  const pdf = buildQuotationPdf(pdfInput, org, { draft: false });
  const filename = pdfFilename(formatted);

  const { html, text } = buildQuotationEmail({ quotation: formatted, message, sender, org });

  // Throws an ApiError with a UI-friendly message if delivery fails; nothing
  // below runs in that case, so a failed send never marks the quotation sent.
  const result = await sendMail({
    to,
    cc,
    subject,
    text,
    html,
    replyTo: req.user.email,
    fromName: `${req.user.name} | ${org.name || "CRM Gangatara"}`,
    attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
  });

  quotation.emails.push({
    to,
    cc,
    subject,
    message,
    filename,
    messageId: result.messageId || "",
    sentBy: req.user._id,
    sentAt: new Date(),
  });
  if (willBeSent) quotation.status = "Sent";
  if (!quotation.sentAt) {
    quotation.sentBy = req.user._id;
    quotation.sentAt = new Date();
  }
  await quotation.save();

  const recipients = [...to, ...cc].join(", ");
  await logAudit(req, {
    entityType: "Quotation",
    entityId: quotation._id,
    entityLabel: quotation.quotationNumber,
    action: "SEND",
    content: `Emailed quotation ${quotation.quotationNumber} (Rs. ${quotation.total.toLocaleString("en-IN")}) to ${recipients}`,
  });

  // Mirror it on the client's / lead's own history. Best-effort: the email is
  // already out, so a logging hiccup must not turn this into an error response.
  try {
    const summary = `Emailed quotation ${quotation.quotationNumber} "${quotation.title}" (Rs. ${quotation.total.toLocaleString("en-IN")}) to ${recipients}`;
    if (quotation.recipientType === "Client" && quotation.client) {
      await Communication.create({ client: quotation.client, type: "Email", summary, loggedBy: req.user._id });
    } else if (quotation.recipientType === "Lead" && quotation.lead) {
      await Activity.create({ leadId: quotation.lead, type: "Email", content: summary, createdBy: req.user._id });
    }
  } catch (err) {
    console.error("Could not log quotation email to recipient history:", err.message);
  }

  const populated = await populateQuotation(Quotation.findById(quotation._id));
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        quotation: formatQuotation(populated),
        rejected: result.rejected,
      },
      `Quotation emailed to ${recipients}`
    )
  );
});
