import api from "../services/api";

/**
 * The quotation PDF is rendered by the server (the same file that gets
 * emailed to the client), so downloading and previewing both just fetch it.
 */

const fallbackName = (q) => `Quotation-${q.quotationNumber}.pdf`;

// With responseType "blob" an error body arrives as a Blob too — read the
// server's message out of it.
async function messageFromError(err) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed?.message) return parsed.message;
    } catch {
      /* not JSON */
    }
  }
  return err?.response?.data?.message || err?.message || "Could not load the PDF";
}

async function fetchQuotationPdf(q) {
  try {
    const res = await api.get(`/quotations/${q.id}/pdf`, { responseType: "blob" });
    const match = /filename="?([^";]+)"?/i.exec(res.headers?.["content-disposition"] || "");
    return { blob: res.data, filename: match?.[1] || fallbackName(q) };
  } catch (err) {
    throw new Error(await messageFromError(err));
  }
}

export async function downloadQuotationPdf(q) {
  const { blob, filename } = await fetchQuotationPdf(q);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Opens the PDF in a new tab. The tab is opened before the request so the
// browser treats it as a direct result of the click (popup blockers allow it).
export async function previewQuotationPdf(q) {
  const tab = window.open("", "_blank");
  try {
    const { blob } = await fetchQuotationPdf(q);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    if (tab) tab.location.href = url;
    else window.location.assign(url);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    tab?.close();
    throw err;
  }
}
