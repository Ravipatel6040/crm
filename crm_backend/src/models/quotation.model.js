import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // What the quotation is for, e.g. "E-commerce website redevelopment".
    title: {
      type: String,
      required: [true, "Quotation title is required"],
      trim: true,
    },

    // Quotations usually go out at the proposal stage — before the lead has
    // become a client — so the recipient is either a Client or a Lead.
    recipientType: {
      type: String,
      enum: ["Client", "Lead"],
      default: "Client",
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },

    // Snapshot of who it was addressed to, taken when the quotation is
    // created. The document we sent must stay exactly as sent even if the
    // client/lead is later edited, converted or deleted.
    recipientName: { type: String, trim: true, default: "" },
    recipientCompany: { type: String, trim: true, default: "" },
    recipientEmail: { type: String, trim: true, lowercase: true, default: "" },
    recipientPhone: { type: String, trim: true, default: "" },

    issueDate: { type: Date, default: Date.now },
    validUntil: { type: Date, default: null },

    items: [
      {
        description: { type: String, trim: true, default: "" },
        quantity: { type: Number, default: 1, min: 0 },
        rate: { type: Number, default: 0, min: 0 },
        amount: { type: Number, default: 0, min: 0 },
      },
    ],

    // Always computed server-side from `items` — never trusted from the client.
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    terms: { type: String, default: "" },
    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Draft", "Sent", "Accepted", "Rejected"],
      default: "Draft",
      index: true,
    },

    // Who actually sent it, and when. Set by the server the first time the
    // status becomes "Sent" — not something the client can supply.
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sentAt: { type: Date, default: null },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const Quotation = mongoose.model("Quotation", quotationSchema);
