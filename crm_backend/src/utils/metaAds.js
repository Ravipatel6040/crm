import { ApiError } from "./ApiError.js";

/**
 * Meta (Facebook/Instagram) Marketing API client for the Campaigns module.
 *
 * Configure in crm_backend/.env:
 *   META_APP_ID, META_APP_SECRET   — the Meta App the token was issued for
 *   META_ACCESS_TOKEN              — a user, page or (ideally) System User token
 *   META_AD_ACCOUNT_ID             — numeric ad account id, with or without "act_"
 *   META_API_VERSION               — defaults to v21.0
 *
 * A normal user access token expires in a couple of hours; for a server
 * integration, generate a System User access token in Business Manager
 * (Business Settings → System Users), assign it the ad account with at
 * least "Ads reporting" access, and grant it the `ads_read` permission
 * (`ads_management` if the CRM should also be able to pause/edit ads later).
 * That token doesn't expire on its own.
 */

const VERSION = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${VERSION}`;

export const isMetaConfigured = () =>
  Boolean(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID);

// Ad account ids are addressed as "act_<id>" everywhere except when they're
// already given with that prefix.
export const adAccountId = () => {
  const raw = String(process.env.META_AD_ACCOUNT_ID || "").trim();
  return raw.startsWith("act_") ? raw : `act_${raw}`;
};

const FRIENDLY_ERRORS = {
  190: "Meta rejected the access token — it may have expired. Generate a new one (a System User token doesn't expire) and update META_ACCESS_TOKEN.",
  200: "That access token doesn't have permission for this. It needs the 'ads_read' permission (or 'ads_management') on this ad account.",
  100: "Meta rejected the request — check the ad account id in the backend's .env.",
  17: "Meta's API rate limit was hit — try again in a few minutes.",
};

async function metaFetch(path, params = {}) {
  if (!isMetaConfigured()) {
    throw new ApiError(503, "Meta Ads isn't configured on the server. Add META_ACCESS_TOKEN and META_AD_ACCOUNT_ID to the backend and restart it.");
  }
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN);

  let res, body;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    body = await res.json();
  } catch (err) {
    throw new ApiError(502, `Couldn't reach Meta's API: ${err.message}`);
  }

  if (!res.ok || body.error) {
    const code = body.error?.code;
    const friendly = FRIENDLY_ERRORS[code];
    throw new ApiError(
      code === 190 ? 401 : code === 200 ? 403 : 502,
      friendly || `Meta API error: ${body.error?.message || res.statusText}`
    );
  }
  return body;
}

/** Basic reachability + which permissions the configured token actually has. */
export const getTokenInfo = async () => {
  const [permsResult, accountResult] = await Promise.allSettled([
    metaFetch("/me/permissions"),
    metaFetch(`/${adAccountId()}`, { fields: "id,name,account_status,currency,amount_spent,balance" }),
  ]);

  const scopes = permsResult.status === "fulfilled"
    ? (permsResult.value.data || []).filter((p) => p.status === "granted").map((p) => p.permission)
    : [];
  const requiredAny = ["ads_read", "ads_management"];
  const hasAdsAccess = requiredAny.some((s) => scopes.includes(s));

  return {
    tokenValid: permsResult.status === "fulfilled",
    scopes,
    hasAdsAccess,
    missingPermission: hasAdsAccess ? null : "ads_read",
    account: accountResult.status === "fulfilled" ? accountResult.value : null,
    accountError: accountResult.status === "rejected" ? accountResult.reason.message : null,
    permissionsError: permsResult.status === "rejected" ? permsResult.reason.message : null,
  };
};

/** Campaigns currently in the ad account (Meta's side), not yet filtered against what's imported. */
export const listAdAccountCampaigns = async () => {
  const body = await metaFetch(`/${adAccountId()}/campaigns`, {
    fields: "id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time",
    limit: 100,
  });
  return body.data || [];
};

/** Spend/impressions/clicks for one campaign, lifetime by default. */
export const getCampaignInsights = async (campaignId, { since, until } = {}) => {
  const params = { fields: "spend,impressions,clicks,reach,actions" };
  if (since && until) params.time_range = JSON.stringify({ since, until });
  else params.date_preset = "maximum";
  const body = await metaFetch(`/${campaignId}/insights`, params);
  const row = body.data?.[0] || {};
  const leadAction = (row.actions || []).find((a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped");
  return {
    spend: Number(row.spend) || 0,
    impressions: Number(row.impressions) || 0,
    clicks: Number(row.clicks) || 0,
    reach: Number(row.reach) || 0,
    leads: leadAction ? Number(leadAction.value) || 0 : 0,
  };
};

export const getCampaign = async (campaignId) => {
  const body = await metaFetch(`/${campaignId}`, {
    fields: "id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time",
  });
  return body;
};

// Meta's effective_status is much finer-grained than the CRM's three states.
export const mapStatus = (effectiveStatus) => {
  if (effectiveStatus === "ACTIVE") return "Active";
  if (["PAUSED", "CAMPAIGN_PAUSED", "ADSET_PAUSED", "IN_PROCESS", "WITH_ISSUES"].includes(effectiveStatus)) return "Paused";
  return "Completed"; // DELETED, ARCHIVED, or anything else
};

// Meta gives budgets in the account's smallest currency unit as a string.
export const centsToAmount = (v) => (v ? Number(v) / 100 : 0);
