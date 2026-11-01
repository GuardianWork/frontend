import { UploadIcon, CloseIcon, EvidenceIcon } from "@/components/icons";
import { useId, useState } from "react";
import { useDocumentUrl } from "@/hooks/use-document-url";

export function VerificationUpload({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const documentUrl = useDocumentUrl(value);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const readFile = (file?: File) => {
    if (!file || disabled || reading) return;
    setError("");
    if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
      setError("Vui lòng chọn tệp PDF, PNG hoặc JPG.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Dung lượng tối đa 1 MB mỗi tệp. Vui lòng giảm dung lượng và thử lại.");
      return;
    }
    const reader = new FileReader();
    setReading(true);
    reader.onload = () => {
      onChange(String(reader.result));
      setFileName(file.name);
      setReading(false);
    };
    reader.onerror = () => {
      setError("Không đọc được tệp. Vui lòng thử lại.");
      setReading(false);
    };
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          readFile(e.dataTransfer.files[0]);
        }}
        className={`rounded-lg border border-dashed border-warm-border bg-surface-container-low p-6 text-center ${disabled ? "opacity-60" : "hover:border-primary"}`}
      >
        <UploadIcon className="mx-auto mb-3 text-primary" size={30} />
        <p className="text-sm font-medium">Chọn hoặc kéo thả tệp vào đây</p>
        <p className="mt-1 text-xs text-charcoal-83">PDF, PNG, JPG · Tối đa 1 MB / tệp</p>
        <input
          id={id}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          disabled={disabled || reading}
          className="mt-4 max-w-full text-xs file:mr-3 file:rounded-md file:border file:border-warm-border file:bg-paper-white file:px-3 file:py-2 file:font-semibold file:text-primary"
          onChange={(e) => {
            readFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {reading && (
        <p role="status" className="mt-2 text-xs text-charcoal-83">
          Đang đọc tệp…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
      {value && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-rule bg-surface-container p-3 text-xs text-ink">
          <EvidenceIcon size={20} />
          <span className="min-w-0 flex-1 truncate">{fileName || "Tài liệu đã lưu"}</span>
          <a
            href={documentUrl || undefined}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            Xem tệp
          </a>
          {!disabled && (
            <button
              type="button"
              aria-label={`Xóa ${label}`}
              onClick={() => {
                onChange("");
                setFileName("");
              }}
              className="p-1"
            >
              <CloseIcon size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
