export type JobVisibility = "PUBLIC" | "HIDDEN";
export type CompliancePriority = "HIGH" | "MEDIUM";
export type ComplianceFinding = {
  label: string;
  excerpt: string;
  explanation: string;
};
export type FlaggedPublishedJob = {
  id: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  publishedAt: string;
  detectedAt: string;
  priority: CompliancePriority;
  visibility: JobVisibility;
  reviewed: boolean;
  findings: ComplianceFinding[];
  description: string;
  history: { label: string; at: string; reason?: string }[];
};

// UI fixtures only. These are not live jobs or output from an integrated AI service.
export const COMPLIANCE_SAMPLE_JOBS: FlaggedPublishedJob[] = [
  {
    id: "JD-1042",
    title: "Kế toán công nợ",
    company: "An Phúc Retail",
    industry: "Kế toán · Tài chính",
    location: "TP. Hồ Chí Minh",
    publishedAt: "2026-10-19T08:00:00+07:00",
    detectedAt: "2026-10-19T08:12:00+07:00",
    priority: "HIGH",
    visibility: "PUBLIC",
    reviewed: false,
    findings: [
      {
        label: "Yêu cầu đặt cọc",
        excerpt: "Ứng viên nộp khoản đặt cọc 2.000.000 đồng trước khi nhận việc.",
        explanation:
          "JD có yêu cầu nộp tiền trước khi nhận việc. Cần kiểm tra mục đích khoản thu và điều kiện áp dụng.",
      },
      {
        label: "Giữ giấy tờ gốc",
        excerpt: "Nộp bản gốc bằng tốt nghiệp để công ty giữ trong thời gian làm việc.",
        explanation:
          "JD đề cập việc giữ giấy tờ gốc của ứng viên. Cần đối chiếu toàn bộ yêu cầu tuyển dụng trước khi xử lý.",
      },
    ],
    description:
      "Mô tả công việc\nTheo dõi công nợ, đối chiếu số liệu với khách hàng và lập báo cáo hàng tháng.\n\nYêu cầu ứng viên\nTốt nghiệp chuyên ngành kế toán, sử dụng thành thạo bảng tính.\nỨng viên nộp khoản đặt cọc 2.000.000 đồng trước khi nhận việc.\nNộp bản gốc bằng tốt nghiệp để công ty giữ trong thời gian làm việc.\n\nQuyền lợi\nMức lương thỏa thuận theo kinh nghiệm, làm việc từ thứ Hai đến thứ Sáu.",
    history: [],
  },
  {
    id: "JD-1039",
    title: "Chuyên viên tuyển dụng",
    company: "Mộc Lan Foods",
    industry: "Nhân sự",
    location: "Hà Nội",
    publishedAt: "2026-10-18T14:30:00+07:00",
    detectedAt: "2026-10-18T14:42:00+07:00",
    priority: "MEDIUM",
    visibility: "PUBLIC",
    reviewed: false,
    findings: [
      {
        label: "Điều kiện cá nhân",
        excerpt: "Chỉ tuyển nữ chưa kết hôn, không có kế hoạch sinh con trong hai năm tới.",
        explanation:
          "Điều kiện tuyển dụng gắn với giới tính và tình trạng gia đình. Cần kiểm tra sự liên quan đến công việc và ngữ cảnh cụ thể.",
      },
    ],
    description:
      "Mô tả công việc\nTiếp nhận nhu cầu tuyển dụng, tìm kiếm ứng viên và điều phối lịch phỏng vấn.\n\nYêu cầu ứng viên\nCó ít nhất một năm kinh nghiệm tuyển dụng.\nChỉ tuyển nữ chưa kết hôn, không có kế hoạch sinh con trong hai năm tới.\n\nQuyền lợi\nĐào tạo nội bộ và thưởng theo kết quả công việc.",
    history: [],
  },
  {
    id: "JD-1027",
    title: "Nhân viên bán hàng",
    company: "Đông Dương Home",
    industry: "Bán lẻ · Kinh doanh",
    location: "Đà Nẵng",
    publishedAt: "2026-10-16T09:00:00+07:00",
    detectedAt: "2026-10-16T09:10:00+07:00",
    priority: "HIGH",
    visibility: "HIDDEN",
    reviewed: true,
    findings: [
      {
        label: "Tiền lương tăng ca",
        excerpt: "Nhân viên tăng ca khi có yêu cầu và không được trả tiền làm thêm giờ.",
        explanation:
          "JD mô tả việc tăng ca không được trả tiền. Cần đọc cùng lịch làm việc và các điều khoản liên quan.",
      },
    ],
    description:
      "Mô tả công việc\nTư vấn sản phẩm, hỗ trợ khách hàng và kiểm kê hàng hóa tại cửa hàng.\n\nThời gian làm việc\nTheo ca, có thể tăng cường vào cuối tuần.\nNhân viên tăng ca khi có yêu cầu và không được trả tiền làm thêm giờ.\n\nYêu cầu ứng viên\nGiao tiếp tốt, có khả năng làm việc theo nhóm.",
    history: [
      {
        label: "Đã ẩn tin",
        at: "2026-10-16T10:15:00+07:00",
        reason: "Tạm ẩn để kiểm tra điều kiện trả lương làm thêm giờ trong JD (dữ liệu mẫu).",
      },
    ],
  },
  {
    id: "JD-1018",
    title: "Điều phối vận tải",
    company: "Minh An Logistics",
    industry: "Vận hành · Logistics",
    location: "Bình Dương",
    publishedAt: "2026-10-15T10:00:00+07:00",
    detectedAt: "2026-10-15T10:08:00+07:00",
    priority: "MEDIUM",
    visibility: "PUBLIC",
    reviewed: true,
    findings: [
      {
        label: "Thời gian thử việc",
        excerpt: "Thử việc 3 tháng trước khi ký hợp đồng chính thức.",
        explanation:
          "Cần đối chiếu thời gian thử việc với tính chất và yêu cầu của vị trí. Dấu hiệu này chưa phải kết luận vi phạm.",
      },
    ],
    description:
      "Mô tả công việc\nSắp xếp lịch vận chuyển, theo dõi tiến độ giao hàng và phối hợp với tài xế.\n\nYêu cầu ứng viên\nCó kinh nghiệm điều phối, sử dụng được phần mềm văn phòng.\nThử việc 3 tháng trước khi ký hợp đồng chính thức.\n\nQuyền lợi\nPhụ cấp điện thoại và đào tạo quy trình vận hành.",
    history: [
      {
        label: "Đã xem xét",
        at: "2026-10-15T11:00:00+07:00",
        reason: "Đã ghi nhận dấu hiệu; giữ nguyên trạng thái công khai trong dữ liệu mẫu.",
      },
    ],
  },
];
