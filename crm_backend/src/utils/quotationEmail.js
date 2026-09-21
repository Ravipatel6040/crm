const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const inr = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

export const defaultSubject = (q, orgName) =>
  `Quotation ${q.quotationNumber} - ${q.title}${orgName ? ` | ${orgName}` : ""}`;

export const defaultMessage = (q, sender, orgName) =>
  [
    `Dear ${q.recipientName || "Sir/Madam"},`,
    "",
    `Thank you for your interest. Please find attached our quotation ${q.quotationNumber} for "${q.title}".`,
    q.validUntil ? `The quotation is valid until ${day(q.validUntil)}.` : "",
    "",
    "Please let us know if you have any questions or would like any changes. We look forward to working with you.",
    "",
    "Warm regards,",
    sender?.name || "",
    orgName || "",
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n")
    .trim();

/**
 * Builds the HTML and plain-text bodies. The salesperson's message is
 * user-supplied, so it is escaped and only newlines are turned into <br>.
 */
export const buildQuotationEmail = ({ quotation: q, message, sender, org = {} }) => {
  const orgName = org.name || "CRM Gangatara";
  const bodyHtml = escapeHtml(message).replace(/\r?\n/g, "<br>");

  const contact = [org.email, org.phone, org.website].filter(Boolean).map(escapeHtml).join(" &nbsp;|&nbsp; ");
  const signature = [sender?.name, sender?.designation, sender?.phone]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" &middot; ");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1b2130;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #dde1ec;border-radius:10px;overflow:hidden;">
        <tr><td style="background:#34509e;padding:18px 24px;color:#ffffff;">
          <div style="font-size:18px;font-weight:bold;">${escapeHtml(orgName)}</div>
          <div style="font-size:12px;opacity:.85;margin-top:2px;">Quotation ${escapeHtml(q.quotationNumber)}</div>
        </td></tr>
        <tr><td style="padding:24px;font-size:14px;line-height:1.6;">${bodyHtml}</td></tr>
        <tr><td style="padding:0 24px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fc;border:1px solid #dde1ec;border-radius:8px;">
            <tr><td style="padding:14px 16px;font-size:13px;line-height:1.7;">
              <div><span style="color:#6e768c;">Quotation no.</span> &nbsp;<b>${escapeHtml(q.quotationNumber)}</b></div>
              <div><span style="color:#6e768c;">For</span> &nbsp;<b>${escapeHtml(q.title)}</b></div>
              <div><span style="color:#6e768c;">Total</span> &nbsp;<b>${escapeHtml(inr(q.total))}</b></div>
              ${q.validUntil ? `<div><span style="color:#6e768c;">Valid until</span> &nbsp;<b>${escapeHtml(day(q.validUntil))}</b></div>` : ""}
            </td></tr>
          </table>
          <p style="font-size:12px;color:#6e768c;margin:12px 0 0;">The full quotation is attached as a PDF.</p>
        </td></tr>
        <tr><td style="border-top:1px solid #dde1ec;padding:14px 24px;font-size:11px;color:#6e768c;line-height:1.6;">
          ${signature ? `<div>${signature}</div>` : ""}
          ${contact ? `<div>${contact}</div>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    message,
    "",
    "---",
    `Quotation no.: ${q.quotationNumber}`,
    `For: ${q.title}`,
    `Total: ${inr(q.total)}`,
    q.validUntil ? `Valid until: ${day(q.validUntil)}` : "",
    "The full quotation is attached as a PDF.",
    "",
    [sender?.name, sender?.designation, sender?.phone].filter(Boolean).join(" | "),
    [org.email, org.phone, org.website].filter(Boolean).join(" | "),
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n")
    .trim();

  return { html, text };
};
