import mongoose from "mongoose";
import { Campaign } from "../models/campaign.model.js";
import { Lead } from "../models/lead.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
