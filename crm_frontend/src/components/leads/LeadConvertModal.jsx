import { useState, useEffect } from "react";
import { Modal, Button, Field, Input } from "../common";
import { Check, UserPlus } from "lucide-react";

export default function LeadConvertModal({ open, onClose, onConfirm, lead, isConverting }) {
  const [createProject, setCreateProject] = useState(true);
  const [projectName, setProjectName] = useState("");

  // Update default project name when lead changes
  useEffect(() => {
    if (lead) {
      setProjectName(`${lead.company || lead.name} - Project`);
    }
  }, [lead]);

  if (!lead) return null;

  const handleConfirm = () => {
    onConfirm({
      createProject,
      projectName: createProject ? projectName : undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={isConverting ? undefined : onClose}
      title="Convert to Client"
      subtitle={`Convert ${lead.name} to an active client?`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isConverting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={handleConfirm}
            loading={isConverting}
          >
            Convert Lead
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <p>
          This will automatically create a new Client record using the lead's data and archive this lead to keep your pipeline clean.
        </p>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={createProject}
                onChange={(e) => setCreateProject(e.target.checked)}
                className="peer sr-only"
                disabled={isConverting}
              />
              <div className="w-5 h-5 border-2 rounded border-slate-300 dark:border-slate-600 peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-colors" />
              <Check
                size={14}
                className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                strokeWidth={3}
              />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              Also create a new project
            </span>
          </label>
        </div>

        {createProject && (
          <div className="pl-8 pt-1 animate-fadeIn">
            <Field label="Project Name" required>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Website Redesign"
                disabled={isConverting}
              />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
