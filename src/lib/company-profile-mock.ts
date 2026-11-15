import type { CompanySummary, PublicCompany } from "@/services/publicCompanies";

export interface CompanyProfileMock {
  introduction: string[];
  headquarters: string;
  workingHours: string;
  companyScale: string;
  expertise: string[];
  /** Marks values that are demonstration content rather than company-published facts. */
  isMock: true;
}

type ProfileSeed = Omit<CompanyProfileMock, "isMock">;

/**
 * Demo company profiles for the public dossier.
 *
 * The public jobs API does not expose a company profile, headquarters, company
 * size, working hours or a skills taxonomy. These mock profiles keep the dossier
 * complete for demo review. The dossier labels them as illustrative content.
 */
const PROFILES: Record<number, ProfileSeed> = {
  201: {
    introduction: [
      "Việt Thành vận hành hệ thống kho lạnh và vận tải hàng đông lạnh tại TP. Hồ Chí Minh và Hà Nội. Doanh nghiệp phục vụ chuỗi bán lẻ, nhà phân phối và đối tác thực phẩm trên toàn quốc.",
      "Đội ngũ vận hành của công ty phụ trách điều phối ca, kiểm soát nhiệt độ, quản lý tồn kho và duy trì tiêu chuẩn an toàn thực phẩm trong suốt chuỗi cung ứng.",
    ],
    headquarters: "Lô C12, Khu công nghiệp Tân Thuận, Quận 7, TP. Hồ Chí Minh",
    workingHours: "Thứ 2 – Thứ 7, theo ca 8 giờ",
    companyScale: "200 – 500 nhân sự",
    expertise: ["Vận hành kho lạnh", "Điều phối vận tải", "Quản lý tồn kho", "An toàn thực phẩm"],
  },
  202: {
    introduction: [
      "Meadow Food & Beverage phát triển và sản xuất các sản phẩm thực phẩm đông lạnh lành mạnh cho thị trường bán lẻ Việt Nam. Nhà máy của công ty vận hành theo tiêu chuẩn HACCP và ISO 22000.",
      "Các nhóm sản phẩm, chất lượng và vận hành phối hợp từ khâu nghiên cứu công thức đến kiểm định thành phẩm trước khi phân phối ra thị trường.",
    ],
    headquarters: "Lô B4, Khu công nghiệp Tân Thới Hiệp, Quận 12, TP. Hồ Chí Minh",
    workingHours: "Thứ 2 – Thứ 6, 08:00 – 17:00",
    companyScale: "100 – 200 nhân sự",
    expertise: ["Phát triển sản phẩm", "Kiểm soát chất lượng", "Sản xuất thực phẩm", "HACCP"],
  },
  203: {
    introduction: [
      "Bản Việt là doanh nghiệp công nghệ tập trung vào hạ tầng thanh toán số và các dịch vụ vận hành dùng chung cho đội sản phẩm trong nước. Đội ngũ kỹ thuật xây dựng nền tảng ổn định cho các hệ thống phục vụ người dùng hằng ngày.",
      "Công ty làm việc theo mô hình đội sản phẩm, kết hợp kỹ thuật, kiểm thử và vận hành để đưa thay đổi ra thị trường theo từng mốc bàn giao.",
    ],
    headquarters: "Tầng 8, Tòa nhà Discovery Complex, 302 Cầu Giấy, Hà Nội",
    workingHours: "Thứ 2 – Thứ 6, 09:00 – 18:00",
    companyScale: "50 – 100 nhân sự",
    expertise: ["Go", "Cloud", "Kiểm thử tự động", "Thanh toán số", "Vận hành hệ thống"],
  },
  204: {
    introduction: [
      "TechNova Solutions là công ty phát triển phần mềm tập trung vào sản phẩm web và dịch vụ tích hợp cho doanh nghiệp. Đội ngũ làm việc theo mô hình sản phẩm, phối hợp giữa kỹ thuật, thiết kế và vận hành.",
      "Công ty xây dựng các hệ thống API, giao diện quản trị và quy trình triển khai cho khách hàng trong nhiều ngành.",
    ],
    headquarters: "Tầng 5, Tòa nhà Sailing Tower, 111 Nguyễn Du, Quận 1, TP. Hồ Chí Minh",
    workingHours: "Thứ 2 – Thứ 6, 09:00 – 18:00",
    companyScale: "20 – 50 nhân sự",
    expertise: ["TypeScript", "Node.js", "Web applications", "API integration"],
  },
  205: {
    introduction: [
      "Green Energy Corp. phát triển và tư vấn các dự án năng lượng tái tạo tại Việt Nam, tập trung vào điện mặt trời và điện gió. Công ty làm việc với chủ đầu tư, đối tác kỹ thuật và cơ quan địa phương trong suốt vòng đời dự án.",
      "Đội ngũ phân tích và kỹ thuật của công ty tham gia khảo sát, đánh giá hiệu quả đầu tư và theo dõi vận hành các công trình năng lượng.",
    ],
    headquarters: "Tầng 3, Tòa nhà Danang Software Park, 2 Quang Trung, Hải Châu, Đà Nẵng",
    workingHours: "Thứ 2 – Thứ 6, 08:30 – 17:30",
    companyScale: "50 – 100 nhân sự",
    expertise: ["Năng lượng mặt trời", "Năng lượng gió", "Phân tích dự án", "Phát triển bền vững"],
  },
  206: {
    introduction: [
      "VietHealth Pharmaceuticals hoạt động trong lĩnh vực phân phối dược phẩm và chăm sóc sức khỏe tại Việt Nam. Công ty cung cấp thuốc và sản phẩm chăm sóc sức khỏe cho hệ thống nhà thuốc, bệnh viện và đối tác phân phối.",
      "Các nhóm dược, chất lượng và vận hành của công ty phối hợp để đảm bảo hàng hóa được lưu trữ, luân chuyển và cung ứng đúng điều kiện.",
    ],
    headquarters: "Số 12 Lạch Tray, Ngô Quyền, Hải Phòng",
    workingHours: "Thứ 2 – Thứ 6, 08:00 – 17:00; Thứ 7, 08:00 – 12:00",
    companyScale: "100 – 200 nhân sự",
    expertise: ["Dược phẩm", "Phân phối", "Quản lý chất lượng", "Chăm sóc sức khỏe"],
  },
  207: {
    introduction: [
      "Urban Design Studios là studio thiết kế kiến trúc và quy hoạch đô thị, làm việc với các dự án nhà ở, không gian công cộng và cải tạo đô thị. Studio kết hợp nghiên cứu bối cảnh địa phương với quy trình thiết kế đa ngành.",
      "Đội ngũ kiến trúc sư, quy hoạch và thiết kế cảnh quan cùng tham gia từ nghiên cứu hiện trạng đến triển khai hồ sơ kỹ thuật.",
    ],
    headquarters: "Số 45 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ",
    workingHours: "Thứ 2 – Thứ 6, 08:30 – 18:00",
    companyScale: "20 – 50 nhân sự",
    expertise: ["Kiến trúc", "Quy hoạch đô thị", "Thiết kế bền vững", "Nghiên cứu bối cảnh"],
  },
};

function fallbackProfile(company: PublicCompany, summary: CompanySummary): ProfileSeed {
  const industry = summary.industries[0]?.label ?? "nhiều lĩnh vực";
  const city = summary.locations[0]?.label.split(",")[0]?.trim() ?? "Việt Nam";
  return {
    introduction: [
      `${company.name} là doanh nghiệp hoạt động trong lĩnh vực ${industry.toLowerCase()}. Công ty xây dựng đội ngũ chuyên môn và quy trình vận hành quanh lĩnh vực này.`,
      "Thông tin chi tiết về đội ngũ và quy mô của doanh nghiệp sẽ được cập nhật khi hồ sơ doanh nghiệp được công bố.",
    ],
    headquarters: city,
    workingHours: "Thứ 2 – Thứ 6, 08:30 – 17:30",
    companyScale: "50 – 100 nhân sự",
    expertise: [industry, "Quản lý dự án", "Vận hành"],
  };
}

export function mockCompanyProfile(
  company: PublicCompany,
  summary: CompanySummary,
): CompanyProfileMock {
  const seed = PROFILES[company.id] ?? fallbackProfile(company, summary);
  return { ...seed, isMock: true };
}
