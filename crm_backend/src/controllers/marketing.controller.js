import mongoose from "mongoose";
import { Campaign } from "../models/campaign.model.js";
import { Lead } from "../models/lead.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit } from "../utils/audit.js";
import {
  isMetaConfigured,
  getTokenInfo,
  listAdAccountCampaigns,
  getCampaign,
  getCampaignInsights,
  mapStatus,
  centsToAmount,
} from "../utils/metaAds.js";

const formatCampaign = (c) => ({
  id: c._id.toString(),
  name: c.name,
  platform: c.platform || "Google Ads",
  status: c.status || "Active",
  spend: c.spend || 0,
  budget: c.budget || 0,
  leads: c.leads || 0,
  qualified: c.qualified || 0,
  proposals: c.proposals || 0,
  won: c.won || 0,
  revenue: c.revenue || 0,
  startDate: c.startDate,
  endDate: c.endDate,
  utm: {
    source:     c.utm?.source     || "",
    medium:     c.utm?.medium     || "",
    campaign:   c.utm?.campaign   || "",
    landingUrl: c.utm?.landingUrl || "",
  },
  owner: c.owner,
  imageUrl: c.imageUrl || "",
  videoUrl: c.videoUrl || "",
  source: c.source || "Manual",
  externalId: c.externalId || "",
  lastSyncedAt: c.lastSyncedAt || null,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const validateCampaignData = (data) => {
  const l = data.leads !== undefined ? Number(data.leads) : undefined;
  const q = data.qualified !== undefined ? Number(data.qualified) : undefined;
  const p = data.proposals !== undefined ? Number(data.proposals) : undefined;
  const w = data.won !== undefined ? Number(data.won) : undefined;

  if (q !== undefined && l !== undefined && q > l) throw new ApiError(400, "Qualified leads cannot exceed total leads");
  if (p !== undefined && q !== undefined && p > q) throw new ApiError(400, "Proposals cannot exceed qualified leads");
  if (w !== undefined && p !== undefined && w > p) throw new ApiError(400, "Won deals cannot exceed proposals");

  if (
    (data.budget !== undefined && Number(data.budget) < 0) ||
    (data.spend !== undefined && Number(data.spend) < 0) ||
    (l !== undefined && l < 0) ||
    (q !== undefined && q < 0) ||
    (p !== undefined && p < 0) ||
    (w !== undefined && w < 0) ||
    (data.revenue !== undefined && Number(data.revenue) < 0)
  ) {
    throw new ApiError(400, "Metrics cannot be negative");
  }

  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new ApiError(400, "End date cannot be before start date");
    }
  }
};

// ─── GET /api/v1/marketing/campaigns ──────────────────────────────────────────
export const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 });
  return res.status(200).json(
    new ApiResponse(200, campaigns.map(formatCampaign), "Campaigns fetched successfully")
  );
});

// ─── POST /api/v1/marketing/campaigns ─────────────────────────────────────────
export const createCampaign = asyncHandler(async (req, res) => {
  const {
    name,
    platform,
    budget,
    spend,
    leads,
    qualified,
    proposals,
    won,
    revenue,
    startDate,
    endDate,
    status,
    utm,
    imageUrl,
    videoUrl,
  } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Campaign name is required");
  }

  validateCampaignData(req.body);

  const campaign = await Campaign.create({
    name: name.trim(),
    platform: platform || "Google Ads",
    budget: Number(budget) || 0,
    spend: Number(spend) || 0,
    leads: Number(leads) || 0,
    qualified: Number(qualified) || 0,
    proposals: Number(proposals) || 0,
    won: Number(won) || 0,
    revenue: Number(revenue) || 0,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : null,
    status: status || "Active",
    utm: {
      source:     utm?.source     || "",
      medium:     utm?.medium     || "",
      campaign:   utm?.campaign   || "",
      landingUrl: utm?.landingUrl || "",
    },
    imageUrl: imageUrl || "",
    videoUrl: videoUrl || "",
    owner: req.user?._id || null,
  });

  return res.status(201).json(
    new ApiResponse(201, formatCampaign(campaign), "Campaign created successfully")
  );
});

// ─── PATCH /api/v1/marketing/campaigns/:id ────────────────────────────────────
export const updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid campaign ID");
  }

  const updateData = { ...req.body };
  // `source`/`externalId`/`lastSyncedAt` are only ever set by the Meta import
  // and sync endpoints below — never by hand, so a manual edit can't
  // accidentally relink (or unlink) a row from a real Meta campaign.
  delete updateData.source;
  delete updateData.externalId;
  delete updateData.lastSyncedAt;
  if (updateData.name) updateData.name = updateData.name.trim();
  if (updateData.budget !== undefined) updateData.budget = Number(updateData.budget) || 0;
  if (updateData.spend !== undefined) updateData.spend = Number(updateData.spend) || 0;
  if (updateData.leads !== undefined) updateData.leads = Number(updateData.leads) || 0;
  if (updateData.qualified !== undefined) updateData.qualified = Number(updateData.qualified) || 0;
  if (updateData.proposals !== undefined) updateData.proposals = Number(updateData.proposals) || 0;
  if (updateData.won !== undefined) updateData.won = Number(updateData.won) || 0;
  if (updateData.revenue !== undefined) updateData.revenue = Number(updateData.revenue) || 0;
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
  if (updateData.imageUrl !== undefined) updateData.imageUrl = updateData.imageUrl;
  if (updateData.videoUrl !== undefined) updateData.videoUrl = updateData.videoUrl;
  // Keep utm as a nested object — Mongoose handles partial sub-doc updates
  if (updateData.utm && typeof updateData.utm === "object") {
    updateData["utm.source"]     = updateData.utm.source     ?? "";
    updateData["utm.medium"]     = updateData.utm.medium     ?? "";
    updateData["utm.campaign"]   = updateData.utm.campaign   ?? "";
    updateData["utm.landingUrl"] = updateData.utm.landingUrl ?? "";
    delete updateData.utm;
  }

  validateCampaignData(req.body);

  const campaign = await Campaign.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  return res.status(200).json(
    new ApiResponse(200, formatCampaign(campaign), "Campaign updated successfully")
  );
});

// ─── DELETE /api/v1/marketing/campaigns/:id ───────────────────────────────────
export const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid campaign ID");
  }

  const campaign = await Campaign.findByIdAndDelete(id);
  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { id }, "Campaign deleted successfully")
  );
});

// ─── GET /api/v1/marketing/lead-sources ────────────────────────────────────────
export const getMarketingLeadSources = asyncHandler(async (req, res) => {
  const sourceAggregation = await Lead.aggregate([
    {
      $group: {
        _id: "$source",
        total: { $sum: 1 },
        won: { $sum: { $cond: [{ $eq: ["$status", "Won"] }, 1, 0] } }
      }
    }
  ]);

  const defaultSources = ["Website", "Referral", "LinkedIn", "Facebook", "Instagram", "Google", "Cold Call", "Other"];
  const sourceMap = {};
  sourceAggregation.forEach((s) => {
    if (s._id) sourceMap[s._id] = { total: s.total, won: s.won };
  });

  const formatted = defaultSources.map((name) => {
    const data = sourceMap[name] || { total: 0, won: 0 };
    return {
      name,
      total: data.total,
      won: data.won,
      conversion: data.total ? Math.round((data.won / data.total) * 100) : 0,
    };
  });

  return res.status(200).json(
    new ApiResponse(200, formatted, "Lead sources fetched successfully")
  );
});

// ─── GET /api/v1/marketing/analytics/trend ────────────────────────────────────
// Real 8-month window, grouped by each campaign's startDate — no fixture data.
export const getMarketingTrend = asyncHandler(async (req, res) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 7, 1);

  const monthsList = [];
  const monthsMap = new Map();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const entry = { month: monthNames[d.getMonth()], leads: 0, conversions: 0, spend: 0 };
    monthsMap.set(key, entry);
    monthsList.push(entry);
  }

  const campaigns = await Campaign.find({ startDate: { $gte: windowStart } })
    .select("startDate leads won spend")
    .lean();

  campaigns.forEach((c) => {
    const d = new Date(c.startDate);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const entry = monthsMap.get(key);
    if (!entry) return;
    entry.leads += c.leads || 0;
    entry.conversions += c.won || 0;
    entry.spend += c.spend || 0;
  });

  return res.status(200).json(
    new ApiResponse(200, monthsList, "Marketing trend analytics fetched")
  );
});

// ─── GET /api/v1/marketing/analytics/channel-effectiveness ────────────────────
// Real per-platform rollup from Campaign records — no fixture data.
export const getChannelEffectiveness = asyncHandler(async (req, res) => {
  const rows = await Campaign.aggregate([
    {
      $group: {
        _id: "$platform",
        spend: { $sum: "$spend" },
        revenue: { $sum: "$revenue" },
        leads: { $sum: "$leads" },
      },
    },
    { $sort: { spend: -1 } },
  ]);

  const channels = rows.map((r) => ({
    channel: r._id || "Other",
    leads: r.leads,
    spend: r.spend,
    revenue: r.revenue,
    roi: r.spend > 0 ? Math.round(((r.revenue - r.spend) / r.spend) * 100) : 0,
    cpa: r.leads > 0 ? Math.round(r.spend / r.leads) : 0,
  }));

  return res.status(200).json(
    new ApiResponse(200, channels, "Channel effectiveness fetched")
  );
});

// ─── Meta (Facebook/Instagram) Ads integration ────────────────────────────────

// ─── GET /api/v1/marketing/meta/status ────────────────────────────────────────
// Health check the frontend polls before offering the import/sync UI. Never
// throws — a partial failure (e.g. an expired token) is diagnostic info, not
// an error response, since the page still has manual campaigns to show.
export const getMetaStatus = asyncHandler(async (req, res) => {
  if (!isMetaConfigured()) {
    return res.status(200).json(
      new ApiResponse(200, { configured: false }, "Meta Ads is not configured")
    );
  }

  const info = await getTokenInfo();
  const importedCount = await Campaign.countDocuments({ source: "Meta" });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        configured: true,
        tokenValid: info.tokenValid,
        hasAdsAccess: info.hasAdsAccess,
        missingPermission: info.missingPermission,
        scopes: info.scopes,
        account: info.account
          ? {
              id: info.account.id,
              name: info.account.name,
              currency: info.account.currency,
              status: info.account.account_status,
              amountSpent: centsToAmount(info.account.amount_spent),
            }
          : null,
        accountError: info.accountError,
        permissionsError: info.permissionsError,
        importedCount,
      },
      "Meta Ads status"
    )
  );
});

// ─── GET /api/v1/marketing/meta/campaigns ─────────────────────────────────────
// Live campaigns from the ad account, each flagged with whether it's already
// linked to a local Campaign row.
export const listMetaCampaigns = asyncHandler(async (req, res) => {
  const [remote, imported] = await Promise.all([
    listAdAccountCampaigns(),
    Campaign.find({ source: "Meta" }, "externalId"),
  ]);
  const importedIds = new Set(imported.map((c) => c.externalId));

  const campaigns = remote.map((c) => ({
    externalId: c.id,
    name: c.name,
    status: mapStatus(c.effective_status),
    objective: c.objective || "",
    dailyBudget: centsToAmount(c.daily_budget),
    lifetimeBudget: centsToAmount(c.lifetime_budget),
    startDate: c.start_time || null,
    endDate: c.stop_time || null,
    imported: importedIds.has(c.id),
  }));

  return res.status(200).json(new ApiResponse(200, campaigns, "Meta campaigns fetched"));
});

// Builds the fields synced from Meta — used by both import and re-sync so
// the two never drift apart.
const pullMetaCampaignData = async (externalId) => {
  const [remote, insights] = await Promise.all([
    getCampaign(externalId),
    getCampaignInsights(externalId),
  ]);
  const budget = centsToAmount(remote.daily_budget)
    ? centsToAmount(remote.daily_budget) * 30
    : centsToAmount(remote.lifetime_budget);

  return {
    name: remote.name,
    status: mapStatus(remote.effective_status),
    budget,
    spend: insights.spend,
    startDate: remote.start_time ? new Date(remote.start_time) : new Date(),
    endDate: remote.stop_time ? new Date(remote.stop_time) : null,
  };
};

// ─── POST /api/v1/marketing/meta/campaigns/:externalId/import ────────────────
// Creates (or re-links) a local Campaign row from a Meta campaign. Lead-funnel
// numbers (leads/qualified/proposals/won/revenue) are the CRM's own and are
// left at 0 / untouched — only ad-side facts (name/status/budget/spend) come
// from Meta.
export const importMetaCampaign = asyncHandler(async (req, res) => {
  const { externalId } = req.params;
  const existing = await Campaign.findOne({ source: "Meta", externalId });
  const data = await pullMetaCampaignData(externalId);

  let campaign;
  if (existing) {
    Object.assign(existing, data, { lastSyncedAt: new Date() });
    campaign = await existing.save();
  } else {
    campaign = await Campaign.create({
      ...data,
      platform: "Meta Ads",
      source: "Meta",
      externalId,
      owner: req.user?._id || null,
      lastSyncedAt: new Date(),
    });
    await logAudit(req, {
      entityType: "Campaign",
      entityId: campaign._id,
      entityLabel: campaign.name,
      action: "CREATE",
      content: `Imported Meta Ads campaign "${campaign.name}" (${externalId})`,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, formatCampaign(campaign), existing ? "Campaign re-linked" : "Campaign imported")
  );
});

// ─── POST /api/v1/marketing/meta/sync ─────────────────────────────────────────
// Refreshes every already-imported Meta campaign's spend/status/budget in one
// go. Tolerant of per-campaign failures (e.g. one campaign was deleted on
// Meta's side) — those are reported, not thrown, so the rest still sync.
export const syncMetaCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find({ source: "Meta" });
  if (campaigns.length === 0) {
    return res.status(200).json(new ApiResponse(200, { synced: 0, failed: [] }, "No Meta campaigns to sync"));
  }

  const failed = [];
  let synced = 0;
  for (const campaign of campaigns) {
    try {
      const data = await pullMetaCampaignData(campaign.externalId);
      Object.assign(campaign, data, { lastSyncedAt: new Date() });
      await campaign.save();
      synced += 1;
    } catch (err) {
      failed.push({ id: campaign._id.toString(), name: campaign.name, error: err.message });
    }
  }

  await logAudit(req, {
    entityType: "Campaign",
    entityLabel: "Meta Ads",
    action: "UPDATE",
    content: `Synced ${synced} of ${campaigns.length} Meta Ads campaign${campaigns.length === 1 ? "" : "s"}${failed.length ? ` (${failed.length} failed)` : ""}`,
  });

  return res.status(200).json(new ApiResponse(200, { synced, failed }, "Meta campaigns synced"));
});
