import type { JobStatus } from "@/services/jobs";

export const staffJobStatusLabels: Record<JobStatus, string> = {
  DRAFT: "Chưa đăng tuyển",
  PUBLISHED: "Đang tuyển",
  PAUSED: "Đã tạm dừng tuyển",
  SUSPENDED: "Đã đình chỉ",
  CLOSED: "Đã đóng tin",
  EXPIRED: "Đã hết hạn",
};

export const staffPostingEventLabels: Record<string, string> = {
  JOB_PUBLISHED: "Đã đăng tin tuyển dụng",
  JOB_PAUSED: "Đã tạm dừng tuyển dụng",
  JOB_RESUMED: "Đã tiếp tục tuyển dụng",
  JOB_SUSPENDED: "Đã ẩn tin tuyển dụng",
  JOB_RESTORED: "Đã khôi phục tin tuyển dụng",
  JOB_CLOSED: "Đã đóng tin tuyển dụng",
  JOB_EXPIRED: "Tin tuyển dụng đã hết hạn",
};

const fieldLabels: Record<string, string> = {
  title: "Chức danh công việc",
  description: "Mô tả công việc",
  responsibilities: "Trách nhiệm công việc",
  requirements: "Yêu cầu ứng viên",
  benefits: "Quyền lợi",
  location: "Địa điểm làm việc",
  employmentType: "Loại công việc",
  workArrangement: "Hình thức làm việc",
  deadline: "Hạn ứng tuyển",
  headcount: "Số lượng tuyển",
  compensation: "Mức lương",
  responsibility: "Người phụ trách",
  company: "Thông tin công ty",
  job: "Trạng thái tin",
  screeningQuestions: "Câu hỏi sàng lọc",
};

export function staffJobIssueLabel(field: string, code: string) {
  const key = field.replace(/^content\./, "").split(/[.[]/)[0];
  const label = fieldLabels[key] ?? "Nội dung tin";
  const reasons: Record<string, string> = {
    REQUIRED: `${label}: còn thiếu thông tin.`,
    DEADLINE_PASSED: "Hạn ứng tuyển đã qua. Công ty cần cập nhật hạn mới.",
    RANGE_INVALID: "Khoảng lương chưa hợp lệ. Cần kiểm tra mức tối thiểu và tối đa.",
    WHOLE_NUMBER_REQUIRED: "Mức lương bằng VND phải là số nguyên.",
    NOT_ALLOWED: `${label}: có thông tin không phù hợp với lựa chọn hiện tại.`,
    AT_LEAST_TWO_OPTIONS: "Câu hỏi sàng lọc cần có ít nhất hai đáp án.",
    COMPANY_NOT_VERIFIED: "Công ty chưa được xác minh.",
    COMPANY_SUSPENDED: "Công ty đang bị đình chỉ.",
    RESPONSIBILITY_REQUIRED: "Tin chưa có người phụ trách hợp lệ. Công ty cần phân công lại.",
    TERMINAL_STATE: "Tin đã đóng hoặc hết hạn nên không thể phê duyệt.",
  };
  return reasons[code] ?? `${label}: cần kiểm tra lại trước khi duyệt.`;
}
