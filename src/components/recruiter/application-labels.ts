import type { ApplicationStatus, RejectionReason } from "@/services/recruiterApplications";
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: "Đã ứng tuyển",
  UNDER_REVIEW: "Đang xem xét",
  SHORTLISTED: "Tiềm năng",
  REJECTED: "Đã từ chối",
  WITHDRAWN: "Đã rút",
};
export const REJECTION_LABELS: Record<RejectionReason, string> = {
  QUALIFICATIONS_MISMATCH: "Chuyên môn chưa phù hợp",
  EXPERIENCE_MISMATCH: "Kinh nghiệm chưa phù hợp",
  POSITION_FILLED: "Vị trí đã tuyển đủ",
  OTHER: "Lý do khác",
};
export function applicationDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}
