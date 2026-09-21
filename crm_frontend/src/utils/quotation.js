export const QUOTATION_STATUSES = ["Draft", "Sent", "Accepted", "Rejected", "Expired"];

export const QUOTATION_STATUS_TONE = {
  Draft: "slate",
  Sent: "blue",
  Accepted: "green",
  Rejected: "red",
  Expired: "amber",
};

/**
 * "Expired" isn't stored — a quotation is stored as Sent and simply stops
 * being valid once its 'valid until' date passes. Deriving it here means the
 * database never needs a job to flip statuses over, and re-dating a quotation
 * brings it straight back to Sent.
 */
export function displayStatus(q) {
  if (q?.status === "Sent" && q.validUntil) {
    const endOfValidDay = new Date(q.validUntil);
    endOfValidDay.setHours(23, 59, 59, 999);
    if (endOfValidDay < new Date()) return "Expired";
  }
  return q?.status || "Draft";
}

export const DEFAULT_QUOTATION_TERMS = [
  "1. Prices are valid until the date shown on this quotation.",
  "2. Payment terms: 50% advance on acceptance, balance on delivery.",
  "3. Taxes are charged as applicable at the rate shown above.",
  "4. Timelines start once the advance payment and required inputs are received.",
].join("\n");
