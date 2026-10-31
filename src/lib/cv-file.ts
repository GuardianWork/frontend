import { MAX_CV_SIZE_BYTES, type CandidateCvFormat } from "@/context/CandidateContext";

export const CV_MIME_BY_FORMAT: Record<CandidateCvFormat, string> = {
  PDF: "application/pdf",
  DOC: "application/msword",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const SIGNATURES: Record<CandidateCvFormat, number[]> = {
  PDF: [0x25, 0x50, 0x44, 0x46, 0x2d],
  DOC: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  DOCX: [0x50, 0x4b, 0x03, 0x04],
};

const ALLOWED_MIME = new Set([...Object.values(CV_MIME_BY_FORMAT), "application/octet-stream"]);

export const CV_ACCEPT_ATTRIBUTE =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function detectCvFormat(fileName: string): CandidateCvFormat | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "PDF";
  if (extension === "doc") return "DOC";
  if (extension === "docx") return "DOCX";
  return null;
}

async function matchesSignature(file: File, format: CandidateCvFormat) {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return SIGNATURES[format].every((byte, index) => bytes[index] === byte);
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    const megabytes = bytes / (1024 * 1024);
    return `${megabytes.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function formatCvDate(isoDate: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function deriveCvLabel(fileName: string) {
  const label = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .slice(0, 60);
  return label || "Hồ sơ chưa đặt tên";
}

export type CvFileCheck = { ok: true; format: CandidateCvFormat } | { ok: false; message: string };

/**
 * Extension, declared MIME, size and the actual file signature all have to agree
 * before a CV leaves the device (EC-CAN-CV-01).
 */
export async function validateCvFile(file: File): Promise<CvFileCheck> {
  const format = detectCvFormat(file.name);
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!format || !["pdf", "doc", "docx"].includes(extension)) {
    return { ok: false, message: "Chỉ hỗ trợ tệp PDF, DOC hoặc DOCX." };
  }
  if (file.type) {
    const expected = new Map([
      ["application/pdf", "pdf"],
      ["application/msword", "doc"],
      ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
    ]).get(file.type);
    if (!expected || expected !== extension) {
      return { ok: false, message: "Định dạng tệp không khớp với phần mở rộng." };
    }
  }
  if (file.size <= 0 || file.size > MAX_CV_SIZE_BYTES) {
    return { ok: false, message: "Tệp phải lớn hơn 0 và không vượt quá 10 MB." };
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return { ok: false, message: "Kiểu tệp không hợp lệ. Hệ thống chỉ nhận PDF, DOC hoặc DOCX." };
  }
  try {
    if (!(await matchesSignature(file, format))) {
      return {
        ok: false,
        message: `Nội dung tệp không khớp định dạng .${format.toLowerCase()}. Hãy chọn đúng tệp gốc thay vì đổi phần mở rộng.`,
      };
    }
  } catch {
    return { ok: false, message: "Không thể đọc tệp này. Hãy thử chọn lại tệp." };
  }
  return { ok: true, format };
}
