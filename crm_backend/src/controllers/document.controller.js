import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Document } from "../models/document.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const formatDocument = (d) => ({
  id: d._id.toString(),
  name: d.name,
  client: d.client?.toString ? d.client.toString() : d.client,
  project: d.project?.toString ? d.project.toString() : d.project,
  type: d.type,
  url: d.url,
  mimeType: d.mimeType,
  size: d.size,
  uploadedBy: d.uploadedBy,
  createdAt: d.createdAt,
});

// ─── GET /api/v1/documents?client=&project= ───────────────────────────────────
export const getDocuments = asyncHandler(async (req, res) => {
  const { client, project } = req.query;
  const filter = {};
  if (client && mongoose.Types.ObjectId.isValid(client)) filter.client = client;
  if (project && mongoose.Types.ObjectId.isValid(project)) filter.project = project;

  const documents = await Document.find(filter)
    .populate("uploadedBy", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, documents.map(formatDocument), "Documents fetched successfully"));
});

// ─── POST /api/v1/documents ────────────────────────────────────────────────────
// multipart/form-data: file (required), client (required), project, type, name
export const uploadDocument = asyncHandler(async (req, res) => {
  const { client, project, type, name } = req.body;

  if (!req.file) {
    throw new ApiError(400, "A file is required");
  }
  if (!client || !mongoose.Types.ObjectId.isValid(client)) {
    // Clean up the file multer already wrote to disk since we're rejecting the request.
    fs.unlink(req.file.path, () => {});
    throw new ApiError(400, "A valid client is required");
  }

  const document = await Document.create({
    name: name?.trim() || req.file.originalname,
    client,
    project: project && mongoose.Types.ObjectId.isValid(project) ? project : null,
    type: type || "Other",
    url: `/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user?._id || null,
  });

  return res.status(201).json(new ApiResponse(201, formatDocument(document), "Document uploaded successfully"));
});

// ─── DELETE /api/v1/documents/:id ──────────────────────────────────────────────
export const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const document = await Document.findByIdAndDelete(id);

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  const filePath = path.join(process.cwd(), "public", document.url);
  fs.unlink(filePath, () => {}); // best-effort; missing file shouldn't fail the request

  return res.status(200).json(new ApiResponse(200, null, "Document deleted successfully"));
});
