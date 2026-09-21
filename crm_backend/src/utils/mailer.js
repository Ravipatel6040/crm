import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

/**
 * Outgoing email over SMTP. Configure in crm_backend/.env:
 *
 *   SMTP_HOST=smtp.gmail.com        (or smtp.zoho.in, email-smtp.<region>.amazonaws.com, ...)
 *   SMTP_PORT=587                   (465 for implicit TLS)
 *   SMTP_SECURE=false               (true when using port 465)
 *   SMTP_USER=quotes@yourdomain.com
 *   SMTP_PASS=<app password>
 *   SMTP_FROM=quotes@yourdomain.com (optional; defaults to SMTP_USER)
 *
 * Mail is sent FROM the company mailbox and Reply-To the sender's own address,
 * so a client's reply lands with the salesperson.
 */

export const isMailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

export const getFromAddress = () => process.env.SMTP_FROM || process.env.SMTP_USER || "";

const createTransport = () => {
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });
};

// Display names go inside quotes in a header — keep them to plain text.
const cleanName = (name) => String(name || "").replace(/["<>\r\n]/g, "").trim();

/**
 * Sends one message. Throws an ApiError with a message the UI can show as-is
 * (never containing credentials) when delivery fails.
 */
export const sendMail = async ({ to, cc = [], subject, text, html, attachments = [], replyTo, fromName }) => {
  if (!isMailConfigured()) {
    throw new ApiError(
      503,
      "Email isn't set up on the server yet. Add the SMTP_HOST, SMTP_USER and SMTP_PASS settings to the backend and restart it."
    );
  }

  const address = getFromAddress();
  const from = fromName ? `"${cleanName(fromName)}" <${address}>` : address;

  try {
    const info = await createTransport().sendMail({
      from,
      to,
      cc: cc.length ? cc : undefined,
      replyTo: replyTo || undefined,
      subject: String(subject || "").replace(/[\r\n]+/g, " ").trim(),
      text,
      html,
      attachments,
    });
    return { messageId: info.messageId, accepted: info.accepted || [], rejected: info.rejected || [] };
  } catch (err) {
    if (err.code === "EAUTH") {
      throw new ApiError(502, "The mail server rejected the login. Check SMTP_USER and SMTP_PASS.");
    }
    if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNREFUSED", "EDNS", "ENOTFOUND"].includes(err.code)) {
      throw new ApiError(502, "Couldn't reach the mail server. Check SMTP_HOST and SMTP_PORT.");
    }
    if (err.code === "EENVELOPE") {
      throw new ApiError(400, "One of the email addresses was rejected. Check the recipients and try again.");
    }
    throw new ApiError(502, `The email couldn't be sent: ${String(err.response || err.message).slice(0, 160)}`);
  }
};
