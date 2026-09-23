import { Router } from "express";
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getMarketingLeadSources,
  getMarketingTrend,
  getChannelEffectiveness,
  getMetaStatus,
  listMetaCampaigns,
  importMetaCampaign,
  syncMetaCampaigns,
} from "../controllers/marketing.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all marketing routes for ADMIN, MARKETING, and BD_SALES (read access)
router.use(authenticate);

// Campaigns CRUD
router.get("/campaigns", authorizeRoles("ADMIN", "MARKETING", "BD_SALES"), getCampaigns);
router.post("/campaigns", authorizeRoles("ADMIN", "MARKETING"), createCampaign);
router.patch("/campaigns/:id", authorizeRoles("ADMIN", "MARKETING"), updateCampaign);
router.delete("/campaigns/:id", authorizeRoles("ADMIN", "MARKETING"), deleteCampaign);

// Lead sources
router.get("/lead-sources", authorizeRoles("ADMIN", "MARKETING"), getMarketingLeadSources);

// Analytics
router.get("/analytics/trend", authorizeRoles("ADMIN", "MARKETING"), getMarketingTrend);
router.get("/analytics/channel-effectiveness", authorizeRoles("ADMIN", "MARKETING"), getChannelEffectiveness);

// Meta (Facebook/Instagram) Ads — read-only status/listing, write only to
// import or re-sync a linked row (never to edit ad spend by hand).
router.get("/meta/status", authorizeRoles("ADMIN", "MARKETING"), getMetaStatus);
router.get("/meta/campaigns", authorizeRoles("ADMIN", "MARKETING"), listMetaCampaigns);
router.post("/meta/campaigns/:externalId/import", authorizeRoles("ADMIN", "MARKETING"), importMetaCampaign);
router.post("/meta/sync", authorizeRoles("ADMIN", "MARKETING"), syncMetaCampaigns);

export { router as marketingRoutes };
