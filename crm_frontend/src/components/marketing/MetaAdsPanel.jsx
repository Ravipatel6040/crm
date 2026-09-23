import { useState } from "react";
import {
  PlugZap, RefreshCw, ShieldAlert, ShieldCheck, Download, CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, Badge, Button, useToast, LoadingState } from "../common";
import { formatCurrency, formatCompactCurrency } from "../../utils/format";
import {
  useGetMetaStatusQuery,
  useGetMetaCampaignsQuery,
  useImportMetaCampaignMutation,
  useSyncMetaCampaignsMutation,
} from "../../store/api/apiSlice";

/**
 * Connects the Campaigns page to Meta (Facebook/Instagram) Ads: shows whether
 * the server can reach the ad account, lists live Meta campaigns and lets a
 * marketing user import one as a Campaign row, or re-sync ones already
 * imported. Ad-side facts (spend, budget, status) come from Meta; the CRM's
 * own funnel numbers (leads/qualified/proposals/won/revenue) stay editable
 * here as usual.
 */
export default function MetaAdsPanel({ isAdmin = false }) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched] = useState(false);

  const { data: statusData, isLoading: statusLoading } = useGetMetaStatusQuery();
  const status = statusData?.data;
  const {
    data: liveData, isFetching: liveLoading, isError: liveError, error: liveErrorObj, refetch,
  } = useGetMetaCampaignsQuery(undefined, { skip: !fetched });
  const live = liveData?.data ?? [];
  const [importCampaign, { isLoading: importing }] = useImportMetaCampaignMutation();
  const [syncAll, { isLoading: syncing }] = useSyncMetaCampaignsMutation();
  const [importingId, setImportingId] = useState(null);

  if (statusLoading) return null;
  if (!status?.configured) {
    return (
      <Card className="mb-6 !bg-slate-50 dark:!bg-slate-800/40">
        <div className="flex items-start gap-3">
          <span className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <PlugZap size={18} />
          </span>
          <div className="text-sm">
            <p className="font-semibold text-slate-700 dark:text-slate-200">Meta Ads isn't connected</p>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin
                ? "Add META_ACCESS_TOKEN and META_AD_ACCOUNT_ID to the backend's .env and restart it to pull campaigns from Facebook/Instagram Ads here."
                : "Ask an admin to connect the Meta Ads account. Until then, add campaigns manually below."}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleFetch = () => {
    setExpanded(true);
    if (fetched) refetch();
    else setFetched(true);
  };

  const handleImport = async (externalId) => {
    setImportingId(externalId);
    try {
      await importCampaign(externalId).unwrap();
      toast?.push("Campaign imported from Meta", "success");
    } catch (err) {
      toast?.push(err?.data?.message || "Could not import this campaign", "error");
    } finally {
      setImportingId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      const res = await syncAll().unwrap();
      const { synced, failed } = res.data;
      toast?.push(
        failed.length ? `Synced ${synced}, ${failed.length} failed — see console for details` : `Synced ${synced} campaign${synced === 1 ? "" : "s"}`,
        failed.length ? "info" : "success"
      );
      if (failed.length) console.warn("Meta sync failures:", failed);
    } catch (err) {
      toast?.push(err?.data?.message || "Sync failed", "error");
    }
  };

  const blocked = status.tokenValid && !status.hasAdsAccess;

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            blocked || !status.tokenValid
              ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
              : "bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300"
          }`}>
            <PlugZap size={18} />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Meta Ads
              {status.tokenValid && status.hasAdsAccess && (
                <Badge tone="green"><ShieldCheck size={11} className="inline mr-1 -mt-0.5" />Connected</Badge>
              )}
              {status.tokenValid && !status.hasAdsAccess && (
                <Badge tone="amber"><ShieldAlert size={11} className="inline mr-1 -mt-0.5" />Permission needed</Badge>
              )}
              {!status.tokenValid && <Badge tone="red">Token invalid</Badge>}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {status.account
                ? `${status.account.name || "Ad account"} · ${status.account.currency || ""} · ${status.importedCount} imported`
                : `${status.importedCount} campaign${status.importedCount === 1 ? "" : "s"} imported from Meta`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status.importedCount > 0 && (
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={handleSyncAll} loading={syncing}>
              Sync all
            </Button>
          )}
          <Button size="sm" variant="outline" icon={Download} onClick={handleFetch} loading={liveLoading && !expanded}>
            Fetch from Meta
          </Button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {blocked && (
            <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs px-3.5 py-3 leading-relaxed">
              <p className="font-semibold">This access token can't read ad account data.</p>
              <p className="mt-1">
                It currently only has: <code className="font-mono">{status.scopes?.join(", ") || "no ads permissions"}</code>.
                {isAdmin
                  ? " Generate a new token with the 'ads_read' permission — ideally a System User access token from Business Manager (Business Settings → System Users), assigned to this ad account, since those don't expire like a personal token does — then update META_ACCESS_TOKEN and restart the server."
                  : " Ask whoever manages the Meta Business account to generate one with the 'ads_read' permission."}
              </p>
            </div>
          )}

          {!fetched ? null : liveLoading ? (
            <LoadingState label="Fetching campaigns from Meta..." />
          ) : liveError ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {liveErrorObj?.data?.message || "Couldn't fetch campaigns from Meta."}
            </p>
          ) : live.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No campaigns found in this ad account.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {live.map((c) => (
                <li
                  key={c.externalId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-0.5">
                      <Badge tone={c.status === "Active" ? "green" : c.status === "Paused" ? "amber" : "slate"}>{c.status}</Badge>
                      {(c.dailyBudget || c.lifetimeBudget) && (
                        <span>{c.dailyBudget ? `${formatCurrency(c.dailyBudget)}/day` : formatCompactCurrency(c.lifetimeBudget)}</span>
                      )}
                    </p>
                  </div>
                  {c.imported ? (
                    <Badge tone="green"><CheckCircle2 size={11} className="inline mr-1 -mt-0.5" />Imported</Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleImport(c.externalId)}
                      loading={importing && importingId === c.externalId}
                    >
                      Import
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
