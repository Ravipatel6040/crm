import mongoose from "mongoose";
import { Communication } from "../models/communication.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const formatCommunication = (c) => ({
  id: c._id.toString(),
  client: c.client?._id?.toString() || c.client,
  clientName: c.client?.company || c.client?.name || undefined,
  type: c.type,
  summary: c.summary,
  loggedBy: c.loggedBy
    ? { id: c.loggedBy._id.toString(), name: c.loggedBy.name }
    : null,
  createdAt: c.createdAt,
});

// ─── GET /api/v1/communications?client= ───────────────────────────────────────
export const getCommunications = asyncHandler(async (req, res) => {
  const { client } = req.query;
  const filter = {};
  if (client && mongoose.Types.ObjectId.isValid(client)) filter.client = client;

  const communications = await Communication.find(filter)
    .populate("client", "name company")
    .populate("loggedBy", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, communications.map(formatCommunication), "Communications fetched successfully")
  );
});

// ─── POST /api/v1/communications ──────────────────────────────────────────────
export const createCommunication = asyncHandler(async (req, res) => {
  const { client, type = "Call", summary } = req.body;

  if (!client || !mongoose.Types.ObjectId.isValid(client)) {
    throw new ApiError(400, "A valid client is required");
  }
  if (!summary?.trim()) {
    throw new ApiError(400, "Summary is required");
  }

  const communication = await Communication.create({
    client,
    type,
    summary: summary.trim(),
    loggedBy: req.user?._id || null,
  });

  const populated = await Communication.findById(communication._id)
    .populate("client", "name company")
    .populate("loggedBy", "name email");

  return res.status(201).json(new ApiResponse(201, formatCommunication(populated), "Communication logged successfully"));
});

// ─── DELETE /api/v1/communications/:id ────────────────────────────────────────
export const deleteCommunication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const communication = await Communication.findByIdAndDelete(id);

  if (!communication) {
    throw new ApiError(404, "Communication log not found");
  }

  return res.status(200).json(new ApiResponse(200, null, "Communication log deleted"));
});
