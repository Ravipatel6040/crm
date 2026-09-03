import {
  Settings,
  getSettings,
  DEFAULT_OPTIONS,
  DEFAULT_PERMISSIONS,
} from "../models/settings.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../utils/audit.js";

const serialize = (s) => ({
  organization: s.organization,
  locale: s.locale,
  options: s.options,
  permissions: s.permissions,
  preferences: s.preferences,
  updatedAt: s.updatedAt,
});

// ─── GET /api/v1/settings ─────────────────────────────────────────────────────
// Any signed-in user: the app needs currency, date format and dropdown options
// to render. Only admins can write.

export const getAppSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  return res
    .status(200)
    .json(new ApiResponse(200, serialize(settings), "Settings fetched successfully"));
});

// ─── PATCH /api/v1/settings ───────────────────────────────────────────────────

export const updateAppSettings = asyncHandler(async (req, res) => {
  const { organization, locale, options, permissions, preferences } = req.body;

  const settings = await getSettings();
  const changed = [];

  if (organization && typeof organization === "object") {
    settings.organization = { ...settings.organization.toObject?.() ?? settings.organization, ...organization };
    changed.push("organisation details");
  }

  if (locale && typeof locale === "object") {
    settings.locale = { ...settings.locale.toObject?.() ?? settings.locale, ...locale };
    changed.push("locale & formatting");
  }

  if (preferences && typeof preferences === "object") {
    settings.preferences = { ...settings.preferences.toObject?.() ?? settings.preferences, ...preferences };
    changed.push("preferences");
  }

  if (options && typeof options === "object") {
    for (const key of Object.keys(DEFAULT_OPTIONS)) {
      if (!Array.isArray(options[key])) continue;
      const cleaned = options[key]
        .map((v) => String(v).trim())
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i);
      if (cleaned.length === 0) {
        throw new ApiError(400, `${key} cannot be empty`);
      }
      settings.options[key] = cleaned;
    }
    changed.push("dropdown options");
  }

  if (permissions && typeof permissions === "object") {
    const next = { ...(settings.permissions || {}) };
    for (const role of Object.keys(DEFAULT_PERMISSIONS)) {
      if (!Array.isArray(permissions[role])) continue;
      next[role] = permissions[role].map((v) => String(v).trim()).filter(Boolean);
    }
    // An admin must never be able to lock every admin out of the panel.
    if (!next.ADMIN?.includes("*")) {
      next.ADMIN = ["*"];
    }
    settings.permissions = next;
    settings.markModified("permissions");
    changed.push("role permissions");
  }

  settings.updatedBy = req.user?._id || null;
  await settings.save();

  await logAudit(req, {
    entityType: "Settings",
    entityId: settings._id,
    entityLabel: "Global settings",
    action: "UPDATE",
    content: `Updated ${changed.join(", ") || "settings"}`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, serialize(settings), "Settings updated successfully"));
});

// ─── POST /api/v1/settings/reset ──────────────────────────────────────────────

export const resetAppSettings = asyncHandler(async (req, res) => {
  await Settings.deleteOne({ key: "GLOBAL" });
  const settings = await getSettings();

  await logAudit(req, {
    entityType: "Settings",
    entityId: settings._id,
    entityLabel: "Global settings",
    action: "UPDATE",
    content: "Reset all settings to defaults",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, serialize(settings), "Settings reset to defaults"));
});
