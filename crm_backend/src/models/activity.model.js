import mongoose from "mongoose";

/**
 * Activity doubles as (a) the lead timeline and (b) the system-wide audit
 * trail. Timeline entries carry `leadId` + a human `type` (Call/Note/...);
 * audit entries carry `entityType`/`entityId`/`action` and type "Audit".
 */
const activitySchema = new mongoose.Schema(
  {
    // Lead timeline entries only. Audit rows leave this null.
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },

    // What the entry is about. Timeline entries default to "Lead".
    entityType: {
      type: String,
      default: "Lead",
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    // Readable name of the record at the time of the action, so the audit
    // log still makes sense after the record itself is deleted.
    entityLabel: {
      type: String,
      trim: true,
      default: "",
    },

    // CREATE | UPDATE | DELETE | LOGIN | LOGOUT | FORCE_LOGOUT | ...
    // Only set on audit rows.
    action: {
      type: String,
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: ["Call", "Email", "Meeting", "Note", "System", "Audit"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Captured on audit rows for accountability.
    actorName: { type: String, trim: true, default: "" },
    actorRole: { type: String, trim: true, default: "" },
    ip: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// The audit log is always read newest-first, usually filtered by entity.
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ entityType: 1, createdAt: -1 });

export const Activity = mongoose.model("Activity", activitySchema);
