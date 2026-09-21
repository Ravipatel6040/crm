import { jsPDF } from "jspdf";

/**
 * The quotation template. Rendered on the server so the PDF that is emailed to
 * a client is exactly the PDF you download — one template, one source of truth.
 *
 * buildQuotationPdf(quotation, organization, { draft }) -> Buffer
 *  - `quotation` is the shape returned by the quotations API (formatQuotation)
 *  - `organization` is Settings.organization (name, address, contact, taxId,
 *    paymentDetails)
 */

// jsPDF's built-in fonts only cover Latin-1. Map the common typographic
// characters to plain equivalents and turn anything else into "?" so a stray
// symbol never corrupts the layout.
const safe = (value) =>
  String(value ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/₹/g, "Rs.")
    .replace(/[•●]/g, "-")
    .replace(/ /g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");

const money = (n) => {
  const v = Number(n) || 0;
  return `Rs. ${v.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "-";

// ─── Amount in words (Indian numbering: lakh / crore) ────────────────────────
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

// ─── The template ────────────────────────────────────────────────────────────
export function buildQuotationPdf(q, org = {}, { draft = false } = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const RIGHT = W - M;
  const CONTENT_BOTTOM = H - 58;

  const INK = [27, 33, 48];
  const MUTED = [110, 118, 140];
  const RULE = [221, 225, 236];
  const TINT = [244, 246, 252];
  const ACCENT = [52, 80, 158];
  const WHITE = [255, 255, 255];

  const orgName = safe(org.legalName || org.name || "CRM Gangatara");
  const preparer = q.sentBy || q.createdBy || null;

  const font = (style = "normal", size = 10, color = INK) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const put = (str, x, y, opts) => doc.text(safe(str), x, y, opts);
  const wrap = (str, width) => doc.splitTextToSize(safe(str), width);
  const fill = (rgb) => doc.setFillColor(...rgb);
  const stroke = (rgb, width = 0.8) => {
    doc.setDrawColor(...rgb);
    doc.setLineWidth(width);
  };

  // A thin brand band across the top of every page.
  const decoratePage = () => {
    fill(ACCENT);
    doc.rect(0, 0, W, 7, "F");
  };
  decoratePage();

  let y = 34;

  const newPage = () => {
    doc.addPage();
    decoratePage();
    y = 36;
  };
  const ensureSpace = (needed) => {
    if (y + needed > CONTENT_BOTTOM) newPage();
  };

  const sectionLabel = (label, x, atY) => {
    font("bold", 7.5, ACCENT);
    put(label, x, atY, { charSpace: 0.9 });
  };

  // ── Header: monogram + organisation on the left, title on the right ──────
  const initials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  fill(ACCENT);
  doc.roundedRect(M, y, 38, 38, 8, 8, "F");
  font("bold", 15, WHITE);
  put(initials || "G", M + 19, y + 25, { align: "center" });

  font("bold", 15, INK);
  put(orgName, M + 50, y + 17);
  font("normal", 8.5, MUTED);
  put("Business Operating System", M + 50, y + 31);

  font("bold", 26, ACCENT);
  put("QUOTATION", RIGHT, y + 24, { align: "right", charSpace: 0.5 });

  font("normal", 8.5, MUTED);
  let leftY = y + 56;
  [org.address, org.taxId ? `GSTIN: ${org.taxId}` : ""].filter(Boolean).forEach((line) => {
    wrap(line, 290).forEach((l) => {
      put(l, M, leftY);
      leftY += 11.5;
    });
  });

  let rightY = y + 46;
  [org.email, org.phone, org.website].filter(Boolean).forEach((line) => {
    put(line, RIGHT, rightY, { align: "right" });
    rightY += 11.5;
  });

  y = Math.max(leftY, rightY, y + 62) + 4;

  // ── Meta strip ───────────────────────────────────────────────────────────
  fill(TINT);
  doc.roundedRect(M, y, RIGHT - M, 42, 8, 8, "F");
  const cells = [
    ["QUOTATION NO.", q.quotationNumber],
    ["DATE", fmtDate(q.issueDate)],
    ["VALID UNTIL", q.validUntil ? fmtDate(q.validUntil) : "-"],
    ["CURRENCY", "INR"],
  ];
  const cellW = (RIGHT - M) / cells.length;
  cells.forEach(([label, value], i) => {
    const cx = M + 16 + i * cellW;
    font("bold", 7, MUTED);
    put(label, cx, y + 16, { charSpace: 0.8 });
    font("bold", 10.5, INK);
    put(value, cx, y + 31);
  });
  y += 42 + 14;

  // ── Recipient and sender cards ───────────────────────────────────────────
  const gap = 12;
  const cardW = (RIGHT - M - gap) / 2;

  const forLines = [
    { text: q.recipientCompany || q.recipientName || "-", bold: true, size: 11 },
    q.recipientCompany && q.recipientName ? { text: `Attn: ${q.recipientName}` } : null,
    q.recipientEmail ? { text: q.recipientEmail } : null,
    q.recipientPhone ? { text: q.recipientPhone } : null,
  ].filter(Boolean);

  const fromLines = preparer
    ? [
        { text: preparer.name || "-", bold: true, size: 11 },
        preparer.designation ? { text: preparer.designation } : null,
        preparer.email ? { text: preparer.email } : null,
        preparer.phone ? { text: preparer.phone } : null,
      ].filter(Boolean)
    : [];

  const rows = Math.max(forLines.length, fromLines.length, 1);
  const cardH = 33 + (rows - 1) * 12.5 + 14;

  [
    { x: M, label: "QUOTATION FOR", lines: forLines },
    { x: M + cardW + gap, label: q.sentBy ? "SENT BY" : "PREPARED BY", lines: fromLines },
  ].forEach(({ x, label, lines }) => {
    fill(TINT);
    doc.roundedRect(x, y, cardW, cardH, 8, 8, "F");
    sectionLabel(label, x + 14, y + 17);
    let ly = y + 33;
    lines.forEach((line) => {
      font(line.bold ? "bold" : "normal", line.size || 9, line.bold ? INK : MUTED);
      put(line.text, x + 14, ly);
      ly += 12.5;
    });
  });
  y += cardH + 14;

  // ── Subject ──────────────────────────────────────────────────────────────
  sectionLabel("SUBJECT", M, y);
  y += 14;
  font("bold", 13, INK);
  wrap(q.title, RIGHT - M).forEach((l) => {
    put(l, M, y);
    y += 16;
  });
  y += 2;

  // ── Items table ──────────────────────────────────────────────────────────
  const col = { no: M + 12, desc: M + 36, qty: RIGHT - 196, rate: RIGHT - 104, amt: RIGHT - 12 };
  const descWidth = col.qty - col.desc - 26;

  const drawTableHead = () => {
    fill(ACCENT);
    doc.roundedRect(M, y, RIGHT - M, 24, 5, 5, "F");
    font("bold", 7.5, WHITE);
    put("#", col.no, y + 15, { charSpace: 0.6 });
    put("DESCRIPTION", col.desc, y + 15, { charSpace: 0.6 });
    put("QTY", col.qty, y + 15, { align: "right", charSpace: 0.6 });
    put("RATE", col.rate, y + 15, { align: "right", charSpace: 0.6 });
    put("AMOUNT", col.amt, y + 15, { align: "right", charSpace: 0.6 });
    y += 24;
  };

  drawTableHead();
  (q.items || []).forEach((item, i) => {
    font("normal", 9.5, INK);
    const lines = wrap(item.description, descWidth);
    const rowH = lines.length * 12.5 + 14;
    if (y + rowH > CONTENT_BOTTOM) {
      newPage();
      drawTableHead();
    }
    if (i % 2 === 1) {
      fill(TINT);
      doc.rect(M, y, RIGHT - M, rowH, "F");
    }
    font("normal", 9, MUTED);
    put(String(i + 1), col.no, y + 16);
    font("normal", 9.5, INK);
    lines.forEach((l, li) => put(l, col.desc, y + 16 + li * 12.5));
    put(String(item.quantity), col.qty, y + 16, { align: "right" });
    put(money(item.rate), col.rate, y + 16, { align: "right" });
    font("bold", 9.5, INK);
    put(money(item.amount), col.amt, y + 16, { align: "right" });
    y += rowH;
  });
  stroke(RULE);
  doc.line(M, y, RIGHT, y);
  y += 18;

  // ── Amount in words + totals ─────────────────────────────────────────────
  const totalRows = [["Subtotal", money(q.subtotal)]];
  if (q.discount > 0) totalRows.push(["Discount", `- ${money(q.discount)}`]);
  if (q.taxRate > 0) totalRows.push([`GST (${q.taxRate}%)`, money(q.tax)]);

  const boxW = 230;
  const boxX = RIGHT - boxW;
  const rowsH = 12 + totalRows.length * 19;
  ensureSpace(rowsH + 44 + 10);

  // left: amount in words, then payment details when set
  const leftW = boxX - M - 24;
  sectionLabel("AMOUNT IN WORDS", M, y + 8);
  font("italic", 9.5, INK);
  let wy = y + 24;
  wrap(amountInWords(q.total), leftW).forEach((l) => {
    put(l, M, wy);
    wy += 13;
  });

  if (String(org.paymentDetails || "").trim()) {
    wy += 8;
    sectionLabel("PAYMENT DETAILS", M, wy);
    wy += 14;
    font("normal", 8.5, INK);
    wrap(org.paymentDetails, leftW).forEach((l) => {
      put(l, M, wy);
      wy += 11.5;
    });
  }

  // right: figures
  fill(TINT);
  doc.roundedRect(boxX, y, boxW, rowsH, 8, 8, "F");
  let ty = y + 21;
  totalRows.forEach(([label, value]) => {
    font("normal", 9.5, MUTED);
    put(label, boxX + 14, ty);
    font("normal", 9.5, INK);
    put(value, boxX + boxW - 14, ty, { align: "right" });
    ty += 19;
  });

  const barY = y + rowsH + 6;
  fill(ACCENT);
  doc.roundedRect(boxX, barY, boxW, 34, 8, 8, "F");
  font("bold", 8, WHITE);
  put("TOTAL (INR)", boxX + 14, barY + 21, { charSpace: 0.8 });
  font("bold", 13, WHITE);
  put(money(q.total), boxX + boxW - 14, barY + 22, { align: "right" });

  y = Math.max(barY + 34, wy) + 16;

  // ── Notes / terms / payment details ──────────────────────────────────────
  const textBlock = (label, body) => {
    if (!String(body || "").trim()) return;
    font("normal", 9, INK);
    const lines = wrap(body, RIGHT - M);
    ensureSpace(26 + Math.min(lines.length, 3) * 12.5);
    sectionLabel(label, M, y);
    y += 14;
    font("normal", 9, INK);
    lines.forEach((l) => {
      ensureSpace(14);
      put(l, M, y);
      y += 12.5;
    });
    y += 9;
  };

  textBlock("NOTES", q.notes);
  textBlock("TERMS & CONDITIONS", q.terms);

  // ── Acceptance and authorised signatory ──────────────────────────────────
  const signH = 88;
  ensureSpace(signH);
  const leftBoxW = (RIGHT - M - gap) * 0.62;
  const rightBoxW = RIGHT - M - gap - leftBoxW;
  const rightBoxX = M + leftBoxW + gap;

  stroke(RULE);
  doc.roundedRect(M, y, leftBoxW, signH, 8, 8, "S");
  sectionLabel("CLIENT ACCEPTANCE", M + 14, y + 17);
  font("normal", 8, MUTED);
  put("By signing below you accept this quotation and its terms.", M + 14, y + 30);

  const fieldGap = 12;
  const fieldW = (leftBoxW - 28 - fieldGap * 2) / 3;
  ["Name", "Signature", "Date"].forEach((label, i) => {
    const fx = M + 14 + i * (fieldW + fieldGap);
    stroke(MUTED, 0.6);
    doc.line(fx, y + 66, fx + fieldW, y + 66);
    font("normal", 7.5, MUTED);
    put(label, fx, y + 77);
  });

  stroke(RULE);
  doc.roundedRect(rightBoxX, y, rightBoxW, signH, 8, 8, "S");
  const shortName = safe(org.name || orgName).toUpperCase();
  sectionLabel(`FOR ${shortName.length > 24 ? `${shortName.slice(0, 23)}...` : shortName}`, rightBoxX + 14, y + 17);
  stroke(INK, 0.6);
  doc.line(rightBoxX + 14, y + 55, rightBoxX + rightBoxW - 14, y + 55);
  font("bold", 9.5, INK);
  put(preparer?.name || "Authorised signatory", rightBoxX + 14, y + 67);
  font("normal", 8, MUTED);
  put(preparer?.designation || (preparer ? "Authorised signatory" : ""), rightBoxX + 14, y + 78);

  // ── Every page: footer, and a DRAFT watermark when not yet sent ──────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);

    stroke(RULE);
    doc.line(M, H - 44, RIGHT, H - 44);
    font("normal", 8, MUTED);
    put(`${orgName}   |   ${q.quotationNumber}`, M, H - 29);
    put(`Page ${p} of ${pages}`, RIGHT, H - 29, { align: "right" });

    if (draft) {
      doc.setGState(new doc.GState({ opacity: 0.07 }));
      font("bold", 110, INK);
      const label = "DRAFT";
      const width = doc.getTextWidth(label);
      const angle = 45;
      const rad = (angle * Math.PI) / 180;
      const cx = W / 2;
      const cy = H / 2;
      doc.text(label, cx - (width / 2) * Math.cos(rad), cy + (width / 2) * Math.sin(rad), { angle });
      doc.setGState(new doc.GState({ opacity: 1 }));
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}
