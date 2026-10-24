import { COMPLIANCE_SAMPLE_JOBS, type FlaggedPublishedJob } from "./admin-compliance";

export type ManagedJob = Omit<
  FlaggedPublishedJob,
  "visibility" | "priority" | "publishedAt" | "detectedAt"
> & {
  visibility: "PENDING" | "PUBLIC" | "HIDDEN" | "REJECTED";
  priority: "HIGH" | "MEDIUM" | "NONE";
  submittedAt?: string;
  publishedAt: string | null;
  detectedAt: string | null;
};

export const JOB_SAMPLE_RECORDS: ManagedJob[] = [
  {
    id: "JD-1050",
    title: "Chuyên viên chăm sóc khách hàng",
    company: "Bình Minh Retail",
    industry: "Dịch vụ khách hàng",
    location: "TP. Hồ Chí Minh",
    submittedAt: "2026-10-24T08:00:00+07:00",
    publishedAt: null,
    detectedAt: null,
    priority: "NONE",
    visibility: "PENDING",
    reviewed: false,
    findings: [],
    history: [],
    description:
      "Mô tả công việc\nTiếp nhận và giải đáp yêu cầu của khách hàng, phối hợp xử lý phản hồi.\n\nYêu cầu ứng viên\nGiao tiếp rõ ràng, có kinh nghiệm chăm sóc khách hàng.\n\nQuyền lợi\nMức lương 9–12 triệu đồng/tháng. Làm việc giờ hành chính từ thứ Hai đến thứ Sáu. Đây là nội dung tin minh họa.",
  },
  {
    id: "JD-1049",
    title: "Chuyên viên marketing",
    company: "Hòa Bình Foods",
    industry: "Marketing",
    location: "Hà Nội",
    submittedAt: "2026-10-24T07:30:00+07:00",
    publishedAt: null,
    detectedAt: null,
    priority: "NONE",
    visibility: "PENDING",
    reviewed: false,
    findings: [],
    history: [],
    description:
      "Mô tả công việc\nXây dựng nội dung và theo dõi hiệu quả chiến dịch truyền thông.\n\nYêu cầu ứng viên\nCó kinh nghiệm marketing, phối hợp nhóm tốt.\n\nQuyền lợi\nMức lương 12–16 triệu đồng/tháng. Làm việc giờ hành chính từ thứ Hai đến thứ Sáu. Đây là nội dung tin minh họa.",
  },
  {
    id: "JD-1048",
    title: "Nhân viên nhập liệu",
    company: "Nam Việt Services",
    industry: "Hành chính",
    location: "Chưa cung cấp",
    submittedAt: "2026-10-23T09:00:00+07:00",
    publishedAt: null,
    detectedAt: null,
    priority: "NONE",
    visibility: "REJECTED",
    reviewed: false,
    findings: [],
    description: "Nội dung tin\nChưa có nội dung JD trong dữ liệu mẫu.",
    history: [
      {
        label: "Đã từ chối đăng tin",
        at: "2026-10-23T10:00:00+07:00",
        reason: "Tin chưa cung cấp địa điểm làm việc và nội dung công việc cụ thể (mẫu).",
      },
    ],
  },
  ...COMPLIANCE_SAMPLE_JOBS,
];
