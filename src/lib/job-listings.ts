export type JobItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  badge:
    "100% Audited" | "Điều 98 Verified" | "High Salary" | "Công ty đã xác thực" | "Tin minh họa";
  badgeTone: "primary" | "warning" | "success";
  time: string;
  department: string;
  industry?: string;
  matchScore: number;
  description: string;
  requirements: string[];
  statutoryBase: string;
  statutoryNote: string;
  suggestedRevision: string;
};

const TECHNOLOGY_JOBS: JobItem[] = [
  {
    id: "job-1",
    title: "Kỹ sư Nền tảng Go / Kubernetes Cấp cao",
    company: "Vellum Studio",
    location: "TP. Hồ Chí Minh, Việt Nam (Quận 3)",
    salaryRange: "60.000.000 - 85.000.000 VND / tháng",
    badge: "100% Audited",
    badgeTone: "success",
    time: "Đã kiểm định 2h trước",
    department: "Kỹ thuật Hạ tầng",
    matchScore: 98,
    description:
      "Chịu trách nhiệm về tính sẵn sàng cao của hệ thống vi dịch vụ backend bằng Go phục vụ hàng triệu người dùng. Tối ưu hóa cụm Kubernetes trên hạ tầng đám mây lai.",
    requirements: [
      "Hơn 4 năm kinh nghiệm phát triển backend bằng Go.",
      "Kinh nghiệm vận hành Kubernetes, Docker và Helm trong môi trường sản xuất.",
      "Hiểu biết sâu sắc về bảo mật API REST/gRPC.",
    ],
    statutoryBase:
      "Điều 98 (Tiền lương làm thêm giờ) & Điều 25 (Thời gian thử việc tối đa 60 ngày)",
    statutoryNote:
      "Hợp đồng lao động quy định rõ ràng mức lương thử việc đạt 85% lương chính thức và cam kết thanh toán làm thêm giờ ít nhất 150% đến 300% theo Bộ luật Lao động 2019.",
    suggestedRevision:
      "Mức lương được niêm yết công khai bằng VND, kèm đóng 100% BHXH, BHYT, BHTN theo mức lương ghi trên hợp đồng chính thức.",
  },
  {
    id: "job-2",
    title: "Lập trình viên Di động React Native",
    company: "Aura Systems",
    location: "Hà Nội, Việt Nam (Cầu Giấy)",
    salaryRange: "45.000.000 - 60.000.000 VND / tháng",
    badge: "Điều 98 Verified",
    badgeTone: "primary",
    time: "Đã kiểm định 4h trước",
    department: "Kỹ thuật Di động",
    matchScore: 94,
    description:
      "Xây dựng giao diện ứng dụng ví điện tử fintech. Tinh chỉnh các hiệu ứng chuyển động mượt mà, xác thực sinh trắc học và tích hợp cổng thanh toán ZaloPay / MoMo.",
    requirements: [
      "Hơn 3 năm kinh nghiệm làm việc với React Native và TypeScript.",
      "Kinh nghiệm tích hợp cổng thanh toán MoMo, ZaloPay hoặc Stripe.",
      "Thành thạo viết native bridge và tối ưu hóa hiệu năng ứng dụng di động.",
    ],
    statutoryBase: "Điều 168 (Bảo hiểm xã hội bắt buộc) & Bảo vệ sở hữu trí tuệ cá nhân",
    statutoryNote:
      "Không có điều khoản phi thực tế về cấm làm việc sau chấm dứt hợp đồng. Quyền sở hữu trí tuệ với các dự án cá nhân ngoài giờ được bảo vệ tuyệt đối.",
    suggestedRevision:
      "Thời gian làm việc từ Thứ Hai đến Thứ Sáu, đảm bảo thời gian nghỉ ngơi tuần theo Điều 111 Bộ luật Lao động 2019.",
  },
  {
    id: "job-3",
    title: "Kiến trúc sư Giải pháp AI / Python",
    company: "Kestrel Analytics",
    location: "Đà Nẵng, Việt Nam (Từ xa / Hybrid)",
    salaryRange: "70.000.000 - 100.000.000 VND / tháng",
    badge: "High Salary",
    badgeTone: "warning",
    time: "Đã kiểm định 6h trước",
    department: "Trí tuệ Nhân tạo",
    matchScore: 91,
    description:
      "Thiết kế các luồng xử lý LLM và phân tích tài liệu tự động. Xây dựng cơ sở dữ liệu vector và mở rộng quy mô các cổng suy luận để phục vụ hàng ngàn yêu cầu đồng thời.",
    requirements: [
      "Hơn 5 năm kinh nghiệm về Python và các luồng xử lý học máy.",
      "Kinh nghiệm với LangChain, LlamaIndex và cơ sở dữ liệu Vector (Milvus, Pinecone).",
      "Kiến thức vững chắc về các mô hình thiết kế vi dịch vụ.",
    ],
    statutoryBase: "Luật Trí tuệ nhân tạo số 134/2025/QH15 & Nghị định 142/2026/NĐ-CP",
    statutoryNote:
      "Tuân thủ các tiêu chuẩn quốc gia về phát triển AI có đạo đức, bảo vệ dữ liệu người dùng và kiểm soát phiên bản mô hình an toàn.",
    suggestedRevision:
      "Hợp đồng làm việc từ xa quy định rõ trang thiết bị làm việc, phụ cấp internet và giờ làm việc linh hoạt theo thỏa ước.",
  },
  {
    id: "job-4",
    title: "Kỹ sư Frontend Trưởng Cấp cao",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh, Việt Nam (Quận 1)",
    salaryRange: "80.000.000 - 110.000.000 VND / tháng",
    badge: "100% Audited",
    badgeTone: "success",
    time: "Đã kiểm định 1d trước",
    department: "Kỹ thuật",
    matchScore: 97,
    description:
      "Xây dựng giao diện người dùng cao cấp sử dụng React và TailwindCSS. Hợp tác với đội ngũ thiết kế và sản phẩm để tinh chỉnh các tương tác vi mô và design system token.",
    requirements: [
      "Hơn 5 năm kinh nghiệm làm việc với React và TypeScript.",
      "Quen thuộc với design system token và tương tác UI.",
      "Thành tích tốt trong tối ưu hóa hiệu năng ứng dụng web.",
    ],
    statutoryBase: "Điều 25 & Điều 102 (Thưởng hiệu quả công việc minh bạch)",
    statutoryNote:
      "Chính sách thưởng cổ phiếu ESOP và tháng lương 13 được quy định công khai trong thỏa ước lao động tập thể.",
    suggestedRevision:
      "Cam kết rà soát tăng lương hàng năm và bảo hiểm sức khỏe cao cấp cho nhân viên và người thân.",
  },
  {
    id: "job-5",
    title: "Kiến trúc sư Hạ tầng & DevOps",
    company: "Momo",
    location: "Hà Nội, Việt Nam (Cầu Giấy)",
    salaryRange: "90.000.000 - 125.000.000 VND / tháng",
    badge: "Điều 98 Verified",
    badgeTone: "primary",
    time: "Đã kiểm định 1d trước",
    department: "Kỹ thuật Nền tảng",
    matchScore: 95,
    description:
      "Làm chủ kiến trúc mở rộng và bảo mật của hạ tầng đám mây lai. Điều phối vi dịch vụ, viết các provider Terraform tùy chỉnh và dẫn dắt các chu kỳ tuân thủ SOC2.",
    requirements: [
      "Hơn 8 năm kinh nghiệm về kỹ thuật hệ thống hoặc vận hành.",
      "Kinh nghiệm vững chắc về hệ thống phân tán và Docker Swarm/Kubernetes.",
      "Thành thạo các chính sách bảo mật và tự động hóa hạ tầng.",
    ],
    statutoryBase: "Quy chuẩn an toàn thông tin & Bộ luật Lao động 2019",
    statutoryNote:
      "Chế độ trực on-call ngoài giờ được tính phụ cấp đặc thù theo quy chế nội bộ đã đăng ký với Sở Lao động - Thương binh và Xã hội.",
    suggestedRevision: "Thời gian nghỉ bù 100% cho các phiên bảo trì khẩn cấp vào ban đêm.",
  },
  {
    id: "job-6",
    title: "Kỹ sư Sản phẩm Full-Stack Cấp cao",
    company: "Aura Systems",
    location: "TP. Hồ Chí Minh, Việt Nam (Trung tâm Thủ Đức)",
    salaryRange: "65.000.000 - 90.000.000 VND / tháng",
    badge: "100% Audited",
    badgeTone: "success",
    time: "Đã kiểm định 2d trước",
    department: "Kỹ thuật",
    matchScore: 96,
    description:
      "Cần một kỹ sư sản phẩm có tư duy khởi nghiệp để phát triển từ cơ sở dữ liệu đến giao diện người dùng React hoàn chỉnh. Xây dựng các bảng điều khiển tài chính.",
    requirements: [
      "Hơn 5 năm kinh nghiệm với Node.js và React.",
      "Nền tảng vững chắc về cơ sở dữ liệu quan hệ (PostgreSQL/MySQL).",
      "Gu thiết kế tốt và tư duy sản phẩm nhạy bén.",
    ],
    statutoryBase: "Điều 98 & Điều 135 (Môi trường làm việc bình đẳng)",
    statutoryNote:
      "Doanh nghiệp đã hoàn thành quy trình thẩm định KYC và ký cam kết tôn trọng quyền tác giả phần mềm độc lập của kỹ sư.",
    suggestedRevision:
      "Hợp đồng lao động không thời hạn sau khi hoàn thành 02 tháng thử việc đạt yêu cầu.",
  },
];

// Illustrative listings for the multi-industry preview; never represent live employer offers.
const INDUSTRY_SAMPLES = [
  {
    id: "sample-sales",
    title: "Chuyên viên kinh doanh",
    industry: "Kinh doanh",
    location: "TP. Hồ Chí Minh",
    salary: "12.000.000 – 20.000.000 VND / tháng",
    description:
      "Tư vấn sản phẩm, chăm sóc khách hàng và phát triển thị trường. Phối hợp với đội ngũ vận hành để theo dõi đơn hàng.",
    requirements: [
      "Kỹ năng giao tiếp và tư vấn khách hàng.",
      "Chủ động theo dõi công việc và phối hợp nhóm.",
    ],
  },
  {
    id: "sample-marketing",
    title: "Chuyên viên tiếp thị nội dung",
    industry: "Tiếp thị",
    location: "Hà Nội (Hybrid)",
    salary: "12.000.000 – 18.000.000 VND / tháng",
    description:
      "Lập kế hoạch nội dung, triển khai truyền thông thương hiệu và theo dõi hiệu quả các chiến dịch tiếp thị.",
    requirements: [
      "Kỹ năng viết và biên tập nội dung.",
      "Có kinh nghiệm quản lý kênh truyền thông.",
    ],
  },
  {
    id: "sample-accounting",
    title: "Kế toán tổng hợp",
    industry: "Kế toán · Tài chính",
    location: "TP. Hồ Chí Minh",
    salary: "15.000.000 – 22.000.000 VND / tháng",
    description:
      "Theo dõi chứng từ, đối chiếu công nợ và lập báo cáo kế toán định kỳ. Phối hợp với các bộ phận để kiểm soát chi phí.",
    requirements: [
      "Chuyên môn kế toán hoặc tài chính.",
      "Cẩn thận, có kỹ năng tổng hợp và sử dụng bảng tính.",
    ],
  },
  {
    id: "sample-hr",
    title: "Chuyên viên nhân sự",
    industry: "Nhân sự",
    location: "Đà Nẵng",
    salary: "10.000.000 – 16.000.000 VND / tháng",
    description:
      "Phụ trách tuyển dụng, tiếp nhận nhân viên mới và quản lý hồ sơ nhân sự. Hỗ trợ các hoạt động đào tạo nội bộ.",
    requirements: [
      "Kỹ năng tổ chức và giao tiếp.",
      "Có kinh nghiệm tuyển dụng hoặc hành chính nhân sự.",
    ],
  },
  {
    id: "sample-operations",
    title: "Điều phối vận hành kho",
    industry: "Vận hành · Logistics",
    location: "Bình Dương",
    salary: "11.000.000 – 17.000.000 VND / tháng",
    description:
      "Điều phối xuất nhập kho, theo dõi tồn kho và phối hợp với đơn vị vận chuyển để bảo đảm tiến độ giao hàng.",
    requirements: [
      "Kỹ năng quản lý số liệu và tổ chức công việc.",
      "Có kinh nghiệm kho vận hoặc chuỗi cung ứng.",
    ],
  },
];
const MULTI_INDUSTRY_JOBS: JobItem[] = INDUSTRY_SAMPLES.map((sample) => ({
  id: sample.id,
  title: sample.title,
  company: "Doanh nghiệp minh họa",
  location: sample.location,
  salaryRange: sample.salary,
  badge: "Tin minh họa",
  badgeTone: "primary",
  time: "Dữ liệu mẫu",
  department: sample.industry,
  industry: sample.industry,
  matchScore: 0,
  description: sample.description,
  requirements: sample.requirements,
  statutoryBase: "Chưa đánh giá điều kiện tuyển dụng",
  statutoryNote:
    "Đây là tin minh họa. Mức lương, yêu cầu và điều kiện làm việc chỉ dùng để xem thử giao diện.",
  suggestedRevision:
    "Với tin tuyển dụng thực tế, hãy trao đổi về thời gian làm việc, thử việc, bảo hiểm và quyền lợi trước khi ứng tuyển.",
}));
export const JOBS: JobItem[] = [
  ...MULTI_INDUSTRY_JOBS,
  ...TECHNOLOGY_JOBS.map((job) => ({ ...job, industry: "Công nghệ thông tin" })),
];
