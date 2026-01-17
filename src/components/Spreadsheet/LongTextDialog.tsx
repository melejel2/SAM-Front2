import React, { useEffect, useState } from "react";

interface LongTextDialogProps {
  open: boolean;
  title?: string;
  value: string;
  editable?: boolean;
  onClose: () => void;
  onSave?: (next: string) => void;
}

const LongTextDialog: React.FC<LongTextDialogProps> = ({ open, title, value, editable = false, onClose, onSave }) => {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  if (!open) return null;

  const handleSave = () => {
    if (editable && onSave) {
      onSave(draft);
    }
    onClose();
  };

  return (
    <div className="spreadsheet-dialog-backdrop" role="dialog" aria-modal="true" aria-label={title || "View cell value"}>
      <div className="spreadsheet-dialog">
        <div className="spreadsheet-dialog-header">
          <div className="spreadsheet-dialog-title">{title || "Cell value"}</div>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="spreadsheet-dialog-body">
          {editable ? (
            <textarea
              className="textarea textarea-bordered w-full"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              autoFocus
            />
          ) : (
            <pre className="spreadsheet-dialog-text">{value || "-"}</pre>
          )}
        </div>
        <div className="spreadsheet-dialog-footer">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
          {editable && onSave && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LongTextDialog;
