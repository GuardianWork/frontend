import type { ScreeningQuestion } from "@/services/jobs";

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
