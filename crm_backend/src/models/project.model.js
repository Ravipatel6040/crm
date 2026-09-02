import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    clientName: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Planning", "Requirements", "Development", "Testing", "Client Review", "Completed", "Active", "Pending", "Delayed"],
      default: "Planning",
    },
    stage: {
      type: String,
      enum: ["Planning", "Requirements", "Development", "Testing", "Client Review", "Completed"],
      default: "Planning",
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    documents: [
      {
        name: { type: String, trim: true },
        url: { type: String, default: "" },
        type: { type: String, default: "PDF" },
        size: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model("Project", projectSchema);
