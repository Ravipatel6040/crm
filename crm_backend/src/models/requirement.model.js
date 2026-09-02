import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Requirement title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    projectName: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      enum: ["Feature", "Security", "Integration", "UI/UX", "Reporting", "General"],
      default: "Feature",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "High",
    },
    status: {
      type: String,
      enum: ["Approved", "In Progress", "Pending Review", "Rejected"],
      default: "In Progress",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const Requirement = mongoose.model("Requirement", requirementSchema);
