import type { ScreeningQuestion } from "@/services/jobs";
import type { ScanFinding, ScanReport } from "@/services/jobScans";

export const scanOutcomeLabels: Record<ScanReport["outcome"], string> = {
  POTENTIAL_RISKS: "Phát hiện dấu hiệu rủi ro",
  NEEDS_REVIEW: "Cần kiểm tra thêm",
  NO_RISKS_DETECTED: "Chưa phát hiện rủi ro trong phạm vi kiểm tra",
  OUT_OF_SCOPE: "Ngoài phạm vi hỗ trợ",
};
export const scanSeverityLabels: Record<ScanFinding["severity"], string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

export const textSections = [["description", "Mô tả công việc", 10000]] as const;
export const employmentTypes: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  TEMPORARY: "Thời vụ",
};
export const workArrangements: Record<string, string> = {
  ONSITE: "Tại văn phòng",
  HYBRID: "Kết hợp",
  REMOTE: "Từ xa",
};
export const payPeriods: Record<string, string> = {
  HOUR: "giờ",
  DAY: "ngày",
  MONTH: "tháng",
  YEAR: "năm",
};
export const questionTypes: Record<ScreeningQuestion["type"], string> = {
  SHORT_TEXT: "Trả lời ngắn",
  SINGLE_CHOICE: "Chọn một đáp án",
  YES_NO: "Có / Không",
  NUMERIC: "Số",
};
export function formatJobDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa đặt hạn";
}
