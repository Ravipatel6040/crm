import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      default: "Google Ads",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Completed"],
      default: "Active",
    },
    spend: {
      type: Number,
      default: 0,
      min: 0,
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    leads: {
      type: Number,
      default: 0,
      min: 0,
    },
    qualified: {
      type: Number,
      default: 0,
      min: 0,
    },
    proposals: {
      type: Number,
      default: 0,
      min: 0,
    },
    won: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);
