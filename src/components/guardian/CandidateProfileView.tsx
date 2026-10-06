import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import { useCandidate } from "@/context/CandidateContext";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {
  Fingerprint,
  Globe,
  Link2,
  FileText,
  Quote,
  Code2,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  Download,
  Mail,
  Edit3,
} from "lucide-react";

export function CandidateProfileView() {
  const { dict } = useLanguage();
  const { profile, setProfile } = useCandidate();
  const [isEditing, setIsEditing] = useState(false);
  const [salaryInput, setSalaryInput] = useState(profile.salaryExpectation);
  const [roleInput, setRoleInput] = useState(profile.role);

  const handleSave = () => {
    setProfile((prev) => ({
      ...prev,
      salaryExpectation: salaryInput,
      role: roleInput,
    }));
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink transition-colors selection:bg-accent selection:text-accent-ink">
      <Header variant="workbench" />

      {/* Sub-nav */}
      <div className="border-b border-rule bg-paper-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <Link
              to="/jobs"
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold bg-paper text-ink-2 hover:text-ink hover:bg-paper-3 border border-rule transition-colors flex items-center gap-1.5"
            >
              <span>01</span>
              <span>{dict.navWorkbench.jobs}</span>
            </Link>
            <Link
              to="/profile"
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold bg-accent text-accent-ink flex items-center gap-1.5 shadow-2xs"
            >
              <span>03</span>
              <span>{dict.navWorkbench.profile}</span>
            </Link>
            <Link
              to="/copilot"
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold bg-paper text-ink-2 hover:text-ink hover:bg-paper-3 border border-rule transition-colors flex items-center gap-1.5"
            >
              <span>04</span>
              <span>{dict.navWorkbench.legalChat}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-3">
            <span className="w-2 h-2 rounded-full bg-emerald" />
            <span>Xác thực: 100% Hồ sơ chuẩn Pháp lý VN</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <header className="mb-14 pb-10 border-b border-rule flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 md:items-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-rule shadow-sm bg-paper-3 shrink-0">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div>
              <div className="font-mono text-xs text-ink-3 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <span>Hồ sơ Ứng viên //</span>
                <span className="text-emerald flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã kiểm định
                </span>
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight">
                {profile.name}
              </h1>
              <div className="text-ink-2 mt-2 font-mono text-sm uppercase tracking-wider font-semibold">
                {profile.role}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2.5 rounded-full border border-rule bg-paper-2 hover:bg-paper-3 text-ink text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </button>
            <a
              href={`mailto:${profile.email}`}
              className="btn px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Liên hệ Ứng viên</span>
            </a>
          </div>
        </header>

        {/* Edit Panel (if open) */}
        {isEditing && (
          <div className="mb-10 p-6 rounded-2xl bg-paper-2 border border-rule flex flex-col gap-4">
            <h3 className="font-bold text-sm text-ink">Chỉnh sửa thông tin hồ sơ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-ink-3 uppercase block mb-1">
                  Chức danh
                </label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-rule text-xs font-body text-ink"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-ink-3 uppercase block mb-1">
                  Lương mong muốn
                </label>
                <input
                  type="text"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-paper border border-rule text-xs font-body text-ink"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 rounded-lg border border-rule text-xs text-ink hover:bg-paper"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-1.5 rounded-lg bg-accent text-accent-ink font-bold text-xs shadow-sm hover:bg-accent-hover"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-10">
            {/* Personal Info */}
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-ink flex items-center gap-2 font-bold mb-5 pb-2 border-b border-rule">
                <Fingerprint className="w-4 h-4 text-accent" />
                <span>Thông tin Cá nhân</span>
              </h2>
              <div className="flex flex-col gap-3 font-body text-xs">
                <div className="border-b border-rule pb-2.5">
                  <span className="text-ink-3 font-mono text-[10px] uppercase block">
                    Lương Mong muốn
                  </span>
                  <span className="text-ink font-semibold mt-0.5 block">
                    {profile.salaryExpectation}
                  </span>
                </div>
                <div className="border-b border-rule pb-2.5">
                  <span className="text-ink-3 font-mono text-[10px] uppercase block">
                    Kinh nghiệm
                  </span>
                  <span className="text-ink font-semibold mt-0.5 block">
                    {profile.experienceYears} Năm
                  </span>
                </div>
                <div className="border-b border-rule pb-2.5">
                  <span className="text-ink-3 font-mono text-[10px] uppercase block">Địa điểm</span>
                  <span className="text-ink font-semibold mt-0.5 block">{profile.location}</span>
                </div>
                <div className="border-b border-rule pb-2.5">
                  <span className="text-ink-3 font-mono text-[10px] uppercase block">Email</span>
                  <span className="text-ink font-semibold mt-0.5 block break-all">
                    {profile.email}
                  </span>
                </div>
                <div className="border-b border-rule pb-2.5">
                  <span className="text-ink-3 font-mono text-[10px] uppercase block">
                    Số điện thoại
                  </span>
                  <span className="text-ink font-semibold mt-0.5 block">{profile.phone}</span>
                </div>
                <div className="border-b border-rule pb-2.5">
                  <span className="text-ink-3 font-mono text-[10px] uppercase block">
                    Giới tính / Ngày sinh
                  </span>
                  <span className="text-ink font-semibold mt-0.5 block">
                    {profile.gender} · {profile.birthDate}
                  </span>
                </div>
              </div>
            </section>

            {/* Languages */}
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-ink flex items-center gap-2 font-bold mb-4 pb-2 border-b border-rule">
                <Globe className="w-4 h-4 text-accent" />
                <span>Ngoại ngữ</span>
              </h2>
              <div className="flex flex-col gap-2 font-body text-xs">
                <div className="flex justify-between items-center p-3 border border-rule bg-paper-2 rounded-lg">
                  <span className="font-semibold text-ink">English</span>
                  <span className="font-mono text-[10px] text-ink-3 uppercase font-bold">
                    IELTS 7.5
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border border-rule bg-paper-2 rounded-lg">
                  <span className="font-semibold text-ink">Vietnamese</span>
                  <span className="font-mono text-[10px] text-ink-3 uppercase font-bold">
                    Native
                  </span>
                </div>
              </div>
            </section>

            {/* Links */}
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-ink flex items-center gap-2 font-bold mb-4 pb-2 border-b border-rule">
                <Link2 className="w-4 h-4 text-accent" />
                <span>Liên kết</span>
              </h2>
              <div className="flex flex-col gap-2 font-body text-xs">
                <a
                  href="https://github.com/alex-dev"
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center p-3 border border-rule bg-paper-2 hover:border-ink rounded-lg transition-colors group"
                >
                  <span className="font-semibold text-ink group-hover:text-accent">GitHub</span>
                  <span className="font-mono text-[10px] text-ink-3">github.com/alex-dev ↗</span>
                </a>
                <a
                  href="https://linkedin.com/in/alex-dev"
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center p-3 border border-rule bg-paper-2 hover:border-ink rounded-lg transition-colors group"
                >
                  <span className="font-semibold text-ink group-hover:text-accent">LinkedIn</span>
                  <span className="font-mono text-[10px] text-ink-3">
                    linkedin.com/in/alex-dev ↗
                  </span>
                </a>
                <a
                  href="https://alex-dev.io"
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center p-3 border border-rule bg-paper-2 hover:border-ink rounded-lg transition-colors group"
                >
                  <span className="font-semibold text-ink group-hover:text-accent">Portfolio</span>
                  <span className="font-mono text-[10px] text-ink-3">alex-dev.io ↗</span>
                </a>
              </div>
            </section>

            {/* Resume File */}
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-ink flex items-center gap-2 font-bold mb-4 pb-2 border-b border-rule">
                <FileText className="w-4 h-4 text-accent" />
                <span>Hồ sơ đính kèm</span>
              </h2>
              <div className="p-4 bg-paper-2 border border-rule rounded-xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="font-mono text-xs font-bold text-ink truncate mr-2">
                    {profile.cvFileName}
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-paper border border-rule px-1.5 py-0.5 rounded font-bold">
                    PDF
                  </span>
                </div>
                <p className="text-[10px] font-mono text-ink-3">Cập nhật: {profile.cvStatus}</p>
                <button className="w-full py-2 rounded-lg bg-paper border border-rule hover:border-ink text-xs font-semibold text-ink transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải CV</span>
                </button>
              </div>
            </section>
          </div>

          {/* Right Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            {/* Bio */}
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-ink flex items-center gap-2 font-bold mb-4 pb-2 border-b border-rule">
                <Quote className="w-4 h-4 text-accent" />
                <span>Giới thiệu bản thân</span>
              </h2>
              <p className="font-body text-base text-ink-2 leading-relaxed">
                Tôi là kỹ sư hệ thống và kỹ sư sản phẩm với hơn 8 năm kinh nghiệm xây dựng các kiến
                trúc phân tán chịu tải cao và giao diện người dùng mượt mà. Tôi kết nối hạ tầng
                DevOps với ứng dụng web, tập trung vào khả năng mở rộng, trải nghiệm nhà phát triển
                và tuân thủ bảo mật cấp doanh nghiệp.
              </p>
            </section>

            {/* Skills */}
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-ink flex items-center gap-2 font-bold mb-4 pb-2 border-b border-rule">
                <Code2 className="w-4 h-4 text-accent" />
                <span>Kỹ năng Trọng tâm</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  "TypeScript",
                  "React / Next.js",
                  "Distributed Systems",
                  "PostgreSQL",
                  "Go",
                  "Tailwind CSS",
                  "Kubernetes & Docker",
                  "SOC2 Security",
                  "REST & gRPC APIs",
                ].map((s) => (
                  <span
                    key={s}
                    className="font-mono text-xs bg-paper-2 border border-rule px-3 py-1.5 text-ink rounded-lg font-medium hover:bg-ink hover:text-paper transition-colors"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Work Experience */}
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-ink flex items-center gap-2 font-bold mb-4 pb-2 border-b border-rule">
                <Briefcase className="w-4 h-4 text-accent" />
                <span>Kinh nghiệm Làm việc</span>
              </h2>
              <div className="flex flex-col divide-y divide-rule">
                <div className="py-6 flex flex-col sm:flex-row justify-between gap-2">
                  <div className="sm:w-1/4 font-mono text-xs text-ink-3 font-semibold">
                    2023 – Hiện tại
                  </div>
                  <div className="sm:w-3/4">
                    <h3 className="font-display text-xl font-bold text-ink">
                      Senior Tech Lead & Systems Engineer
                    </h3>
                    <div className="font-mono text-xs text-accent font-semibold mt-1">
                      GuardianWork VN · TP. Hồ Chí Minh
                    </div>
                    <p className="text-xs text-ink-2 font-body mt-2 leading-relaxed">
                      Dẫn dắt kiến trúc bảo mật tuân thủ Bộ luật Lao động 2019, điều phối vi dịch vụ
                      và triển khai hệ thống xác thực tức thì cho các kỹ sư công nghệ.
                    </p>
                  </div>
                </div>

                <div className="py-6 flex flex-col sm:flex-row justify-between gap-2">
                  <div className="sm:w-1/4 font-mono text-xs text-ink-3 font-semibold">
                    2020 – 2023
                  </div>
                  <div className="sm:w-3/4">
                    <h3 className="font-display text-xl font-bold text-ink">
                      Lead Frontend Systems Architect
                    </h3>
                    <div className="font-mono text-xs text-accent font-semibold mt-1">
                      Apex Cloud Services · Remote APAC
                    </div>
                    <p className="text-xs text-ink-2 font-body mt-2 leading-relaxed">
                      Thiết kế design system token và tối ưu hóa thời gian tải ứng dụng web xuống
                      dưới 0.8s cho hơn 50.000 người dùng hàng ngày.
                    </p>
                  </div>
                </div>

                <div className="py-6 flex flex-col sm:flex-row justify-between gap-2">
                  <div className="sm:w-1/4 font-mono text-xs text-ink-3 font-semibold">
                    2018 – 2020
                  </div>
                  <div className="sm:w-3/4">
                    <h3 className="font-display text-xl font-bold text-ink">
                      Software Engineer II
                    </h3>
                    <div className="font-mono text-xs text-accent font-semibold mt-1">
                      Chronicle Analytics · San Francisco, CA
                    </div>
                    <p className="text-xs text-ink-2 font-body mt-2 leading-relaxed">
                      Phát triển các pipeline xử lý dữ liệu và bảng điều khiển tài chính thời gian
                      thực sử dụng Node.js và React.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Education & Certifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Education */}
              <section>
                <h2 className="font-mono text-xs uppercase tracking-widest text-ink flex items-center gap-2 font-bold mb-4 pb-2 border-b border-rule">
                  <GraduationCap className="w-4 h-4 text-accent" />
                  <span>Học vấn</span>
                </h2>
                <div className="space-y-4 text-xs font-body">
                  <div>
                    <span className="font-mono text-[10px] text-ink-3 font-bold">2018</span>
                    <h4 className="font-bold text-sm text-ink mt-0.5">Cử nhân Khoa học Máy tính</h4>
                    <p className="text-ink-2">Đại học Quốc gia TP.HCM</p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-ink-3 font-bold">2021</span>
                    <h4 className="font-bold text-sm text-ink mt-0.5">
                      Agile Certified Practitioner
                    </h4>
                    <p className="text-ink-2">Scrum Alliance</p>
                  </div>
                </div>
              </section>

              {/* Certifications */}
              <section>
                <h2 className="font-mono text-xs uppercase tracking-widest text-ink flex items-center gap-2 font-bold mb-4 pb-2 border-b border-rule">
                  <Award className="w-4 h-4 text-accent" />
                  <span>Chứng chỉ Quốc tế</span>
                </h2>
                <div className="space-y-4 text-xs font-body">
                  <div>
                    <span className="font-mono text-[10px] text-ink-3 font-bold">2022</span>
                    <h4 className="font-bold text-sm text-ink mt-0.5">
                      AWS Solutions Architect Professional
                    </h4>
                    <p className="text-ink-2">Amazon Web Services</p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-ink-3 font-bold">2023</span>
                    <h4 className="font-bold text-sm text-ink mt-0.5">
                      Certified Kubernetes Administrator (CKA)
                    </h4>
                    <p className="text-ink-2">Cloud Native Computing Foundation</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
