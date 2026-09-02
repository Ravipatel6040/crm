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
  owner: c.owner,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

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
    status
  } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Campaign name is required");
  }

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
export const getMarketingTrend = asyncHandler(async (req, res) => {
  const trendData = [
    { month: "Jan", leads: 45, conversions: 12, spend: 25000 },
    { month: "Feb", leads: 58, conversions: 18, spend: 32000 },
    { month: "Mar", leads: 72, conversions: 24, spend: 40000 },
    { month: "Apr", leads: 64, conversions: 21, spend: 35000 },
    { month: "May", leads: 88, conversions: 31, spend: 48000 },
    { month: "Jun", leads: 95, conversions: 38, spend: 52000 },
    { month: "Jul", leads: 110, conversions: 44, spend: 60000 },
    { month: "Aug", leads: 125, conversions: 50, spend: 68000 },
  ];

  return res.status(200).json(
    new ApiResponse(200, trendData, "Marketing trend analytics fetched")
  );
});

// ─── GET /api/v1/marketing/analytics/channel-effectiveness ────────────────────
export const getChannelEffectiveness = asyncHandler(async (req, res) => {
  const channels = [
    { channel: "Google Ads", roi: 340, cpa: 450, volume: "High" },
    { channel: "LinkedIn", roi: 410, cpa: 680, volume: "Medium" },
    { channel: "Instagram", roi: 260, cpa: 320, volume: "High" },
    { channel: "Email Outbound", roi: 520, cpa: 150, volume: "Medium" },
    { channel: "Referral", roi: 780, cpa: 50, volume: "Low" },
  ];

  return res.status(200).json(
    new ApiResponse(200, channels, "Channel effectiveness fetched")
  );
});
