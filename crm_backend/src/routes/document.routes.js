import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { getDocuments, uploadDocument, deleteDocument } from "../controllers/document.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getDocuments);
router.post("/", upload.single("file"), uploadDocument);
router.delete("/:id", deleteDocument);

export { router as documentRoutes };
