import mongoose from "mongoose";

const communicationSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["Call", "Email", "Message", "Note"],
      default: "Call",
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const Communication = mongoose.model("Communication", communicationSchema);
