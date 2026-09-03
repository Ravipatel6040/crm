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

    source: {
      type: String,
      enum: [
        "Website",
        "Referral",
        "LinkedIn",
        "Facebook",
        "Instagram",
        "Google",
        "Cold Call",
        "Email",
        "Other",
      ],
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

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Follow-up",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost",
      ],
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