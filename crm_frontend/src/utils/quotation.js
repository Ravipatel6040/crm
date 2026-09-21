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

// Amount in words, Indian numbering (lakh / crore) — matches the PDF.
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const belowHundred = (n) =>
  n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");

const belowThousand = (n) => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [
    hundreds ? `${ONES[hundreds]} Hundred` : "",
    rest ? `${hundreds ? "and " : ""}${belowHundred(rest)}` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

export const amountInWords = (amount) => {
  const total = Math.round((Number(amount) || 0) * 100) / 100;
  let rupees = Math.floor(total);
  let paise = Math.round((total - rupees) * 100);
  if (paise === 100) {
    rupees += 1;
    paise = 0;
  }

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  const parts = [
    crore ? `${belowThousand(crore)} Crore` : "",
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    rest ? belowThousand(rest) : "",
  ].filter(Boolean);

  const rupeeWords = parts.length ? parts.join(" ") : "Zero";
  return `Rupees ${rupeeWords}${paise ? ` and ${belowHundred(paise)} Paise` : ""} Only`;
};
