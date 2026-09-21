import { useEffect, useState } from "react";
import { Send, Paperclip, Eye, AlertTriangle, Info } from "lucide-react";
import { Modal, Button, Field, Input, Textarea, LoadingState, useToast } from "../common";
import { formatCurrency, formatDate } from "../../utils/format";
import { displayStatus } from "../../utils/quotation";
import { previewQuotationPdf } from "../../utils/quotationPdf";
import { useGetQuotationEmailDraftQuery, useSendQuotationMutation } from "../../store/api/apiSlice";

const EMAIL_RE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/;
const splitEmails = (value) => value.split(/[,;\s]+/).map((v) => v.trim()).filter(Boolean);

function Notice({ tone = "amber", icon: Icon = Info, children }) {
  const tones = {
    amber: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50",
    blue: "bg-primary-50 text-primary-800 border-primary-200 dark:bg-primary-950/30 dark:text-primary-200 dark:border-primary-900/50",
  };
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${tones[tone]}`}>
      <Icon size={15} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/**
 * "Email quotation" dialog. The server sends the message with the quotation
 * PDF attached; this only collects who to send it to and what to say.
 */
export default function SendQuotationModal({ quotation, open, onClose, isAdmin = false }) {
  const toast = useToast();
  const q = quotation;

  const { data, isFetching, isError, refetch } = useGetQuotationEmailDraftQuery(q?.id, {
    skip: !open || !q,
    refetchOnMountOrArgChange: true,
  });
  const [sendQuotation, { isLoading: sending }] = useSendQuotationMutation();

  const draft = data?.data;
  const [form, setForm] = useState({ to: "", cc: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!draft) return;
    setForm({ to: draft.to || "", cc: "", subject: draft.subject, message: draft.message });
    setErrors({});
  }, [draft]);

  if (!open || !q) return null;

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    const to = splitEmails(form.to);
    const cc = splitEmails(form.cc);
    if (to.length === 0) next.to = "Add at least one recipient";
    else if (to.some((a) => !EMAIL_RE.test(a))) next.to = `"${to.find((a) => !EMAIL_RE.test(a))}" isn't a valid email`;
    if (cc.some((a) => !EMAIL_RE.test(a))) next.cc = `"${cc.find((a) => !EMAIL_RE.test(a))}" isn't a valid email`;
    if (to.length + cc.length > 10) next.to = "At most 10 addresses at once";
    if (!form.subject.trim()) next.subject = "Subject is required";
    if (!form.message.trim()) next.message = "Write a short message";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    try {
      const res = await sendQuotation({
        id: q.id,
        to: splitEmails(form.to),
        cc: splitEmails(form.cc),
        subject: form.subject.trim(),
        message: form.message.trim(),
      }).unwrap();
      const rejected = res?.data?.rejected || [];
      toast?.push(
        rejected.length
          ? `Sent, but ${rejected.join(", ")} didn't accept it`
          : res?.message || "Quotation emailed",
        rejected.length ? "info" : "success"
      );
      onClose();
    } catch (err) {
      toast?.push(err?.data?.message || "Could not send the email", "error");
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      await previewQuotationPdf(q);
    } catch (err) {
      toast?.push(err.message, "error");
    } finally {
      setPreviewing(false);
    }
  };

  const lastEmail = q.emails?.length ? q.emails[q.emails.length - 1] : null;
  const isDraft = q.status === "Draft";
  const expired = displayStatus(q) === "Expired";
  const notConfigured = draft && !draft.configured;

  return (
    <Modal
      open={open}
      onClose={sending ? undefined : onClose}
      title="Email quotation"
      subtitle={`${q.quotationNumber} · ${formatCurrency(q.total)}`}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button
            icon={Send}
            onClick={handleSend}
            loading={sending}
            disabled={isFetching || isError || notConfigured}
          >
            Send with PDF
          </Button>
        </div>
      }
    >
      {isFetching && !draft ? (
        <LoadingState label="Preparing the email..." />
      ) : isError ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Couldn't prepare the email.{" "}
          <button onClick={refetch} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Try again</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notConfigured && (
            <Notice icon={AlertTriangle}>
              <p className="font-semibold">Email isn't set up on the server yet.</p>
              <p>
                {isAdmin
                  ? "Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to the backend's .env file and restart it, then come back here."
                  : "Ask an admin to connect the company mailbox. Until then you can still download the PDF and send it yourself."}
              </p>
            </Notice>
          )}

          {!notConfigured && isDraft && (
            <Notice tone="blue">
              This quotation is still a draft. Sending it will mark it as <b>Sent</b> by you.
            </Notice>
          )}
          {expired && (
            <Notice icon={AlertTriangle}>
              This quotation's validity ended on {formatDate(q.validUntil)}. Consider extending the date before sending.
            </Notice>
          )}
          {lastEmail && (
            <Notice>
              Already emailed to {lastEmail.to.join(", ")} on {formatDate(lastEmail.sentAt)}
              {lastEmail.sentBy ? ` by ${lastEmail.sentBy.name}` : ""}. This will send another copy.
            </Notice>
          )}

          <Field label="To" required error={errors.to} hint={!q.recipientEmail && !errors.to ? "No email is saved for this recipient — type one in." : "Separate several addresses with commas."}>
            <Input value={form.to} onChange={(e) => set("to", e.target.value)} placeholder="client@company.com" error={!!errors.to} />
          </Field>

          <Field label="CC" error={errors.cc}>
            <Input value={form.cc} onChange={(e) => set("cc", e.target.value)} placeholder="Optional — e.g. a colleague" error={!!errors.cc} />
          </Field>

          <Field label="Subject" required error={errors.subject}>
            <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} error={!!errors.subject} maxLength={200} />
          </Field>

          <Field label="Message" required error={errors.message}>
            <Textarea rows={9} value={form.message} onChange={(e) => set("message", e.target.value)} error={!!errors.message} maxLength={5000} />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0 text-xs">
              <Paperclip size={15} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{draft?.filename}</span>
              <span className="text-slate-400 shrink-0">PDF attached automatically</span>
            </div>
            <Button size="sm" variant="outline" icon={Eye} onClick={handlePreview} loading={previewing}>
              Preview
            </Button>
          </div>

          {draft && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Sent from <b>{draft.from || "the company mailbox"}</b>
              {draft.replyTo ? <> — replies go to <b>{draft.replyTo}</b></> : null}. A copy is logged on the {q.recipientType.toLowerCase()}'s history.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
