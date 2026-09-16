import fs from "fs";
import path from "path";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Kept deliberately narrow — this is a file-upload endpoint reachable by any
// authenticated user, so only well-known document/image/archive types are
// accepted. Anything else (scripts, executables, ...) is rejected outright.
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/zip",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Strip the extension out separately so a name like "../../evil.pdf"
    // can't escape the uploads directory or collide with path traversal.
    const ext = path.extname(file.originalname).slice(0, 10);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 60);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});
