import type { JobItem } from "@/lib/job-listings";
import type { PublicJobSearchResult } from "@/services/publicJobs";

export function employmentTypeLabel(value?: string) {
  switch (value) {
    case "FULL_TIME":
      return "Toàn thời gian";
    case "PART_TIME":
      return "Bán thời gian";
    case "CONTRACT":
      return "Hợp đồng";
    case "INTERNSHIP":
      return "Thực tập";
    case "TEMPORARY":
      return "Thời vụ";
    default:
      return value ?? "Việc làm";
  }
}

export function toPublicJobItem(job: PublicJobSearchResult): JobItem {
  const content = job.content ?? {};
  const compensation = content.compensation;
  const hasSalary =
    Boolean(compensation?.disclosed) &&
    typeof compensation?.minimum === "number" &&
    typeof compensation?.maximum === "number";
  const salaryRange = hasSalary
    ? `${Math.round(compensation!.minimum!).toLocaleString("vi-VN").replace(/,/g, ".")} - ${Math.round(compensation!.maximum!).toLocaleString("vi-VN").replace(/,/g, ".")} ${compensation!.currency ?? "VND"} / ${(compensation!.payPeriod ?? "MONTH").toLowerCase()}`
    : "Thỏa thuận";
  return {
    id: String(job.id),
    title: content.title ?? "Tin tuyển dụng",
    company: job.company?.name ?? "Doanh nghiệp",
    companyId: typeof job.company?.id === "number" ? job.company.id : undefined,
    location: content.location ?? "Chưa cập nhật",
    salaryRange,
    badge: "Công ty đã xác thực",
    badgeTone: "success",
    time: "Đang tuyển",
    department: employmentTypeLabel(content.employmentType),
    industry: "Chưa cập nhật",
    matchScore: 0,
    description: content.description ?? "",
    requirements: [],
    statutoryBase: "Thông tin công khai từ tin tuyển dụng",
    statutoryNote: "Kiểm tra kỹ điều khoản và điều kiện làm việc trước khi ứng tuyển.",
    suggestedRevision: "Xem chi tiết để biết đầy đủ thông tin tuyển dụng.",
  };
}
