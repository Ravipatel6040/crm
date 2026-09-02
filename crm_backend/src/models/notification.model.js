import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["LEAD_ASSIGNED", "LEAD_CREATED", "FOLLOW_UP_DUE", "STATUS_CHANGED", "DEAL_WON", "SYSTEM", "GENERAL"],
      default: "GENERAL",
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
