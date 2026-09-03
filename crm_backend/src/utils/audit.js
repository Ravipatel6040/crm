import { Activity } from "../models/activity.model.js";

/**
 * Writes one row to the audit trail. Never throws — an audit failure must
 * not take down the request that triggered it.
 *
 * logAudit(req, { entityType: "User", entityId, entityLabel, action, content })
 *
 * Pass `actor` when req.user isn't populated yet — sign-in happens before the
 * authenticate middleware runs, so the login row has no req.user to read.
 */
export const logAudit = async (req, { entityType, entityId = null, entityLabel = "", action, content, actor = null }) => {
  try {
    if (!entityType || !action || !content) return null;

    const who = actor || req?.user || null;

    return await Activity.create({
      leadId: null,
      entityType,
      entityId,
      entityLabel,
      action,
      type: "Audit",
      content,
      createdBy: who?._id || null,
      actorName: who?.name || "System",
      actorRole: who?.role || "",
      ip:
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req?.socket?.remoteAddress ||
        null,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
    return null;
  }
};

/**
 * Builds a short "field: old → new" summary for UPDATE audit rows so the log
 * says what actually changed rather than just "updated".
 */
export const diffSummary = (before, after, fields) => {
  const changes = [];
  for (const field of fields) {
    const oldValue = before?.[field];
    const newValue = after?.[field];
    if (newValue === undefined) continue;
    if (String(oldValue ?? "") === String(newValue ?? "")) continue;
    changes.push(`${field}: "${oldValue ?? "—"}" → "${newValue ?? "—"}"`);
  }
  return changes.join(", ");
};
