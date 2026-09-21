// Builds the downloadable PDF for a quotation. jsPDF is imported on demand so
// it stays out of the main bundle until someone actually clicks Download.

const money = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "-";

export async function downloadQuotationPdf(q, org = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40; // page margin
  const RIGHT = W - M;
  const INK = [27, 33, 48];
  const MUTED = [110, 118, 140];
  const RULE = [219, 223, 234];
  const ACCENT = [52, 80, 158];

  const text = (str, x, y, opts = {}) => doc.text(String(str ?? ""), x, y, opts);
  const setInk = (rgb = INK) => doc.setTextColor(...rgb);
  const wrap = (str, width) => doc.splitTextToSize(String(str ?? ""), width);

  let y = M;

  // Starts a new page when the next block wouldn't fit above the footer.
  const ensureSpace = (needed) => {
    if (y + needed > H - 60) {
      doc.addPage();
      y = M;
    }
  };

  // ── Header: organisation on the left, document title on the right ─────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setInk();
  text(org.name || "CRM Gangatara", M, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setInk(MUTED);
  let orgY = y + 28;
  [
    org.address,
    [org.email, org.phone].filter(Boolean).join("  |  "),
    org.website,
    org.taxId ? `GSTIN: ${org.taxId}` : "",
  ]
    .filter(Boolean)
    .forEach((line) => {
      wrap(line, 260).forEach((l) => {
        text(l, M, orgY);
        orgY += 12;
      });
    });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setInk(ACCENT);
  text("QUOTATION", RIGHT, y + 14, { align: "right" });

  doc.setFontSize(10);
  setInk();
  text(q.quotationNumber, RIGHT, y + 32, { align: "right" });
  doc.setFont("helvetica", "normal");
  setInk(MUTED);
  text(`Date: ${fmtDate(q.issueDate)}`, RIGHT, y + 46, { align: "right" });
  text(`Valid until: ${q.validUntil ? fmtDate(q.validUntil) : "-"}`, RIGHT, y + 59, { align: "right" });

  y = Math.max(orgY, y + 68) + 10;
  doc.setDrawColor(...RULE);
  doc.line(M, y, RIGHT, y);
  y += 24;

  // ── Recipient + subject ───────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setInk(MUTED);
  text("QUOTATION FOR", M, y);
  text("SUBJECT", W / 2 + 10, y);
  y += 14;

  doc.setFontSize(11);
  setInk();
  const forLines = [q.recipientCompany || q.recipientName];
  doc.setFont("helvetica", "bold");
  text(forLines[0] || "-", M, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setInk(MUTED);
  let forY = y + 13;
  [
    q.recipientCompany && q.recipientName ? `Attn: ${q.recipientName}` : "",
    q.recipientEmail,
    q.recipientPhone,
  ]
    .filter(Boolean)
    .forEach((line) => {
      text(line, M, forY);
      forY += 12;
    });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setInk();
  let subjY = y;
  wrap(q.title, W / 2 - M - 10).forEach((l) => {
    text(l, W / 2 + 10, subjY);
    subjY += 14;
  });

  y = Math.max(forY, subjY) + 18;

  // ── Items table ───────────────────────────────────────────────────────────
  const col = { no: M + 8, desc: M + 34, qty: RIGHT - 190, rate: RIGHT - 100, amt: RIGHT - 8 };
  const descWidth = col.qty - col.desc - 24;

  const drawTableHead = () => {
    doc.setFillColor(241, 243, 249);
    doc.rect(M, y, RIGHT - M, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setInk(MUTED);
    text("#", col.no, y + 14);
    text("DESCRIPTION", col.desc, y + 14);
    text("QTY", col.qty, y + 14, { align: "right" });
    text("RATE", col.rate, y + 14, { align: "right" });
    text("AMOUNT", col.amt, y + 14, { align: "right" });
    y += 22;
  };

  drawTableHead();
  doc.setFontSize(9.5);

  (q.items || []).forEach((item, i) => {
    const lines = wrap(item.description, descWidth);
    const rowH = lines.length * 12 + 12;
    if (y + rowH > H - 60) {
      doc.addPage();
      y = M;
      drawTableHead();
    }

    doc.setFont("helvetica", "normal");
    setInk(MUTED);
    text(i + 1, col.no, y + 15);
    setInk();
    lines.forEach((l, li) => text(l, col.desc, y + 15 + li * 12));
    text(item.quantity, col.qty, y + 15, { align: "right" });
    text(money(item.rate), col.rate, y + 15, { align: "right" });
    doc.setFont("helvetica", "bold");
    text(money(item.amount), col.amt, y + 15, { align: "right" });

    y += rowH;
    doc.setDrawColor(...RULE);
    doc.line(M, y, RIGHT, y);
  });

  y += 18;

  // ── Totals ────────────────────────────────────────────────────────────────
  ensureSpace(110);
  const labelX = RIGHT - 190;
  const totalRows = [["Subtotal", money(q.subtotal)]];
  if (q.discount > 0) totalRows.push(["Discount", `- ${money(q.discount)}`]);
  if (q.taxRate > 0) totalRows.push([`GST (${q.taxRate}%)`, money(q.tax)]);

  doc.setFontSize(9.5);
  totalRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    setInk(MUTED);
    text(label, labelX, y);
    setInk();
    text(value, RIGHT - 8, y, { align: "right" });
    y += 16;
  });

  doc.setDrawColor(...INK);
  doc.line(labelX, y - 4, RIGHT, y - 4);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setInk();
  text("Total", labelX, y);
  setInk(ACCENT);
  text(money(q.total), RIGHT - 8, y, { align: "right" });
  y += 30;

  // ── Terms / notes ─────────────────────────────────────────────────────────
  const block = (heading, body) => {
    if (!body?.trim()) return;
    const lines = wrap(body, RIGHT - M);
    ensureSpace(26 + Math.min(lines.length, 3) * 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setInk(MUTED);
    text(heading, M, y);
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setInk();
    lines.forEach((l) => {
      ensureSpace(14);
      text(l, M, y);
      y += 12;
    });
    y += 10;
  };

  block("NOTES", q.notes);
  block("TERMS & CONDITIONS", q.terms);

  // ── Prepared by ───────────────────────────────────────────────────────────
  const preparer = q.sentBy || q.createdBy;
  if (preparer) {
    ensureSpace(80);
    y += 6;
    doc.setDrawColor(...RULE);
    doc.line(M, y, RIGHT, y);
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setInk(MUTED);
    text(q.sentBy ? "SENT BY" : "PREPARED BY", M, y);
    y += 14;
    doc.setFontSize(11);
    setInk();
    text(preparer.name || "-", M, y);
    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setInk(MUTED);
    [preparer.designation, preparer.email, preparer.phone].filter(Boolean).forEach((line) => {
      text(line, M, y);
      y += 12;
    });
    if (q.sentAt) text(`Sent on ${fmtDate(q.sentAt)}`, M, y);
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setInk(MUTED);
    text(`${q.quotationNumber}  |  ${org.name || "CRM Gangatara"}`, M, H - 28);
    text(`Page ${p} of ${pages}`, RIGHT, H - 28, { align: "right" });
  }

  doc.save(`${q.quotationNumber}.pdf`);
}
