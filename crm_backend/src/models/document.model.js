import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Every document belongs to a client; project is optional (a document
    // can be filed against the client generally, or a specific project).
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    type: {
      type: String,
      trim: true,
      default: "Other",
    },
    // Path under /uploads, e.g. "/uploads/1699999999-contract.pdf" — served
    // statically by express.static("public") in app.js.
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const Document = mongoose.model("Document", documentSchema);
