import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { jobEditorIssues } from "@/lib/job-content-validation";
import type { JobContent } from "@/services/jobs";
import { JobContentEditor } from "./JobContentEditor";

export function JobReviewSectionDialog({
  content,
  step,
  title,
  onClose,
  onSave,
  onDirtyChange,
  returnFocus,
  focusField,
}: {
  content: JobContent;
  step: number;
  title: string;
  onClose: () => void;
  onSave: (content: JobContent) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  returnFocus: HTMLElement | null;
  focusField?: string;
}) {
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  const save = async () => {
    if (savingRef.current) return;
    const issue = jobEditorIssues(draft, step)[0];
    if (issue) {
      setInvalidField(issue.field);
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>(`[data-job-field="${CSS.escape(issue.field)}"]`)
          ?.focus(),
      );
      return;
    }
    if (!formRef.current?.reportValidity()) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể lưu thay đổi. Vui lòng thử lại.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !savingRef.current) onClose();
      }}
    >
      <DialogContent
        className="jp-page jp-review-dialog"
        onOpenAutoFocus={(event) => {
          if (!focusField) return;
          event.preventDefault();
          requestAnimationFrame(() =>
            formRef.current
              ?.querySelector<HTMLElement>(`[data-job-field="${CSS.escape(focusField)}"]`)
              ?.focus(),
          );
        }}
        onEscapeKeyDown={(event) => {
          if (saving) event.preventDefault();
        }}
        onPointerDownOutside={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus?.focus();
        }}
      >
        <DialogTitle>Chỉnh sửa {title.toLocaleLowerCase("vi")}</DialogTitle>
        <DialogDescription>Lưu thay đổi để cập nhật bản xem trước.</DialogDescription>
        <form
          ref={formRef}
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="jp-review-dialog-body">
            {error && (
              <div className="jp-feedback jp-error" role="alert">
                {error}
              </div>
            )}
            <JobContentEditor
              content={draft}
              step={step}
              disabled={saving}
              invalidField={invalidField}
              onChange={(next) => {
                setDraft(next);
                onDirtyChange(JSON.stringify(next) !== JSON.stringify(content));
                setError("");
              }}
            />
          </div>
          <div className="jp-review-dialog-actions">
            <button type="button" className="jp-button" disabled={saving} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="jp-button jp-primary" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
