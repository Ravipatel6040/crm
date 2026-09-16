import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Lead name is required"],
      trim: true,
    },

    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },

    // Valid values come from Settings.options.leadSources (configurable by an
    // admin), enforced in lead.controller.js — not a schema enum, since that
    // would need a deploy every time the list changes.
    source: {
      type: String,
      trim: true,
      default: "Website",
    },

    interestedIn: {
      type: String,
      trim: true,
      default: "",
    },

    budget: {
      type: Number,
      default: 0,
      min: 0,
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Valid values come from Settings.options.pipelineStages, enforced in
    // lead.controller.js. "Won" and "Lost" are also referenced directly by
    // convertLead() and the dashboard aggregations below, so removing those
    // two from Settings would silently break conversion — not schema-enforced.
    status: {
      type: String,
      trim: true,
      default: "New",
    },

    nextFollowUp: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    lostReason: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Lead = mongoose.model("Lead", leadSchema);