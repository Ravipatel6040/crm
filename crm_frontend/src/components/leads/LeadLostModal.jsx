import { useState, useEffect } from "react";
import { Modal, Button, Field, Select, Textarea } from "../common";
import { ArchiveX } from "lucide-react";

const lossReasons = [
  "Price Too High",
  "Went with Competitor",
  "Unresponsive",
  "Timing / Not Ready",
  "Bad Fit",
  "Other"
];

export default function LeadLostModal({ open, onClose, onConfirm, lead, isUpdating }) {
  const [reason, setReason] = useState(lossReasons[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setReason(lossReasons[0]);
      setNotes("");
    }
  }, [open]);

  if (!lead) return null;

  const handleConfirm = () => {
    let finalReason = reason;
    if (notes.trim()) {
      finalReason = `${reason} - ${notes.trim()}`;
    }
    onConfirm(finalReason);
  };

  return (
    <Modal
      open={open}
      onClose={isUpdating ? undefined : onClose}
      title="Mark Lead as Lost"
      subtitle={`Why did we lose ${lead.name}?`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            variant="danger"
            icon={ArchiveX}
            onClick={handleConfirm}
            loading={isUpdating}
          >
            Mark as Lost
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tracking why leads are lost helps us improve our sales strategy. Please select the primary reason.
        </p>

        <Field label="Reason for Loss" required>
          <Select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isUpdating}
          >
            {lossReasons.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>

        <Field label="Additional Notes (Optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific feedback from the lead?"
            disabled={isUpdating}
            rows={3}
          />
        </Field>
      </div>
    </Modal>
  );
}
