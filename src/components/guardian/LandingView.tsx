import { useState, type FormEvent } from "react";
import { Link, useHydrated, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Search,
  MapPin,
  ShieldCheck,
  FileUp,
  CheckCircle2,
  BriefcaseBusiness,
  Code2,
  Megaphone,
  Calculator,
  Users,
  Truck,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { JOBS } from "@/lib/job-listings";
import { Header } from "./Header";
import { Footer } from "./Footer";

const categories = [
  {
    label: "Kinh doanh",
    en: "Sales",
    query: "Kinh doanh",
    detail: "Bán hàng · Phát triển thị trường",
    detailEn: "Sales · Business development",
    icon: BriefcaseBusiness,
  },
  {
    label: "Tiếp thị",
    en: "Marketing",
    query: "Tiếp thị",
    detail: "Nội dung · Thương hiệu · Truyền thông",
    detailEn: "Content · Brand · Communications",
    icon: Megaphone,
  },
  {
    label: "Kế toán · Tài chính",
    en: "Accounting & Finance",
    query: "Kế toán",
    detail: "Kế toán · Kiểm toán · Tài chính",
    detailEn: "Accounting · Audit · Finance",
    icon: Calculator,
  },
  {
    label: "Nhân sự",
    en: "Human Resources",
    query: "Nhân sự",
    detail: "Tuyển dụng · Đào tạo · Hành chính",
    detailEn: "Recruitment · Training · Administration",
    icon: Users,
  },
  {
    label: "Vận hành · Logistics",
    en: "Operations & Logistics",
    query: "Vận hành",
    detail: "Kho vận · Chuỗi cung ứng",
    detailEn: "Warehouse · Supply chain",
    icon: Truck,
  },
  {
    label: "Công nghệ thông tin",
    en: "Information Technology",
    query: "Công nghệ thông tin",
    detail: "Phần mềm · Hạ tầng · Dữ liệu",
    detailEn: "Software · Infrastructure · Data",
    icon: Code2,
  },
];

export function LandingView() {
  const { dict, locale } = useLanguage();
  const en = locale === "en";
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [uploadedCv, setUploadedCv] = useState("");
  const [uploadError, setUploadError] = useState("");
  const search = (event: FormEvent) => {
    event.preventDefault();
    void navigate({ to: "/candidate/jobs", search: { q: query.trim(), location, job: "" } });
  };
  return (
    <div className="career-site">
      <a className="skip-link" href="#main-content">
        {en ? "Skip to content" : "Đến nội dung chính"}
      </a>
      <Header variant="landing" />
      <main id="main-content">
        <section className="career-hero">
          <div className="career-container">
            <h1>
              {dict.landing.title}
              <br />
              <span>{dict.landing.titleAccent}</span>
            </h1>
            <p className="career-hero__description">{dict.landing.description}</p>
            <form className="career-search" role="search" onSubmit={search}>
              <label className="career-search__keyword">
                <Search size={23} aria-hidden="true" />
                <span className="sr-only">
                  {en ? "Job title, skill or company" : "Vị trí, kỹ năng hoặc công ty"}
                </span>
                <input
                  disabled={!hydrated}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={en ? "Job title, skill or company" : "Vị trí, kỹ năng hoặc công ty"}
                />
              </label>
              <label className="career-search__location">
                <MapPin size={22} aria-hidden="true" />
                <span className="sr-only">{en ? "Location" : "Địa điểm"}</span>
                <select
                  disabled={!hydrated}
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                >
                  <option value="">{en ? "All locations" : "Tất cả địa điểm"}</option>
                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Từ xa">{en ? "Remote" : "Làm việc từ xa"}</option>
                </select>
              </label>
              <button className="career-button" type="submit" disabled={!hydrated}>
                <Search size={19} />
                {en ? "Find jobs" : "Tìm việc ngay"}
              </button>
            </form>
            <div className="career-popular">
              <span>{en ? "Popular searches:" : "Tìm kiếm phổ biến:"}</span>
              {["Kinh doanh", "Kế toán", "Tiếp thị", "Nhân sự"].map((q) => (
                <Link key={q} to="/candidate/jobs" search={{ q, location: "", job: "" }}>
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="career-container career-jobs" aria-labelledby="opportunities-title">
          <div className="career-section-heading">
            <div>
              <h2 id="opportunities-title">
                {en ? "Explore your next opportunity" : "Khám phá cơ hội dành cho bạn"}
              </h2>
              <p>
                {en
                  ? "Opportunities across industries, with salary and company information in one place."
                  : "Việc làm đa ngành, mức lương và thông tin doanh nghiệp trong một nơi."}
              </p>
            </div>
            <Link
              to="/candidate/jobs"
              search={{ q: "", location: "", job: "" }}
              className="career-text-link"
            >
              {en ? "View all jobs" : "Xem tất cả việc làm"}
              <ArrowRight size={18} />
            </Link>
          </div>
          <p className="career-demo-note">
            {en
              ? "Sample job listings from the current product."
              : "Các tin tuyển dụng mẫu trong sản phẩm hiện tại."}
          </p>
          <div className="career-job-grid">
            {JOBS.slice(0, 6).map((job) => (
              <Link
                key={job.id}
                to="/candidate/jobs"
                search={{ q: "", location: "", job: job.id }}
                className="career-job"
              >
                <div className="career-job__company">
                  <span className="career-company-mark" aria-hidden="true">
                    {job.company
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span>{job.company}</span>
                  <ArrowRight size={18} className="career-job__arrow" />
                </div>
                <h3>{job.title}</h3>
                <p className="career-job__salary">{job.salaryRange}</p>
                <p className="career-job__location">
                  <MapPin size={15} />
                  {job.location}
                </p>
                <div className="career-job__bottom">
                  <span>{job.department}</span>
                  <span>{en ? "View details" : "Xem chi tiết"}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section id="roles" className="career-fields" aria-labelledby="fields-title">
          <div className="career-container">
            <div className="career-section-heading">
              <h2 id="fields-title">{en ? "Find your field" : "Khám phá theo ngành nghề"}</h2>
            </div>
            <div className="career-field-grid">
              {categories.map(
                ({ label, en: englishLabel, query: q, detail, detailEn, icon: Icon }) => (
                  <Link
                    key={label}
                    to="/candidate/jobs"
                    search={{ q, location: "", job: "" }}
                    className="career-field"
                  >
                    <Icon size={25} />
                    <h3>{en ? englishLabel : label}</h3>
                    <p>{en ? detailEn : detail}</p>
                    <ArrowRight size={18} />
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>
        <section className="career-container career-paths">
          <div className="career-cv">
            <div>
              <h2>
                {en
                  ? "Your next job starts with your profile."
                  : "Cơ hội tiếp theo bắt đầu từ hồ sơ của bạn."}
              </h2>
              <p>{dict.landing.candidatesDesc}</p>
            </div>
            <div className="career-upload">
              <FileUp size={28} aria-hidden="true" />
              <div>
                <strong>{en ? "Try uploading your CV" : "Trải nghiệm tải CV lên"}</strong>
                <p>{en ? "PDF, DOC or DOCX · up to 15 MB" : "PDF, DOC hoặc DOCX · tối đa 15 MB"}</p>
              </div>
              <label className="career-button career-button--outline" htmlFor="career-cv">
                {en ? "Choose file" : "Chọn tệp"}
              </label>
              <input
                id="career-cv"
                className="sr-only"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setUploadedCv("");
                  if (!/\.(pdf|doc|docx)$/i.test(file.name) || file.size > 15 * 1024 * 1024) {
                    setUploadError(
                      en
                        ? "Choose a PDF, DOC or DOCX smaller than 15 MB."
                        : "Chọn tệp PDF, DOC hoặc DOCX không quá 15 MB.",
                    );
                    event.target.value = "";
                    return;
                  }
                  setUploadError("");
                  setUploadedCv(file.name);
                }}
              />
            </div>
            {uploadError && (
              <p role="alert" className="career-upload-error">
                {uploadError}
              </p>
            )}
            {uploadedCv && (
              <p className="career-upload-status" role="status">
                <CheckCircle2 size={17} />
                <span>{uploadedCv}</span>
                <button
                  aria-label={en ? "Remove selected file" : "Bỏ chọn tệp"}
                  onClick={() => {
                    setUploadedCv("");
                    const input = document.getElementById("career-cv") as HTMLInputElement;
                    input.value = "";
                  }}
                >
                  <X size={16} />
                </button>
              </p>
            )}
            <p className="career-demo-note">
              {en
                ? "This preview selects a file locally. Continue to your profile to manage your CV."
                : "Bản xem thử chọn tệp trên thiết bị. Vào hồ sơ để quản lý CV của bạn."}
            </p>
            <Link to="/candidate/profile" className="career-text-link">
              {en ? "Go to your profile" : "Đến hồ sơ của bạn"}
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="career-employer">
            <BriefcaseBusiness size={32} />
            <h2>
              {dict.landing.findNextHire}
              {dict.landing.findNextHireAccent}
            </h2>
            <p>{dict.landing.companiesDesc}</p>
            <Link className="career-button" to="/register" search={{ role: "recruiter" }}>
              {dict.landing.startHiring}
              <ArrowRight size={18} />
            </Link>
            <Link className="career-employer__secondary" to="/recruit">
              {en ? "Explore the recruiter workspace" : "Khám phá không gian nhà tuyển dụng"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <section id="how-it-works" className="career-steps">
          <div className="career-container">
            <h2>{dict.howItWorks.title}</h2>
            <ol>
              {[
                [dict.howItWorks.step1Title, dict.howItWorks.step1Body],
                [dict.howItWorks.step2Title, dict.howItWorks.step2Body],
                [dict.howItWorks.step3Title, dict.howItWorks.step3Body],
              ].map(([title, body], index) => (
                <li key={title}>
                  <span className="career-step-number">{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
            <Link to="/copilot" className="career-law-link">
              <ShieldCheck size={23} />
              <span>
                {en
                  ? "Questions about employment terms? Explore Legal Copilot."
                  : "Có câu hỏi về điều kiện lao động? Khám phá Legal Copilot."}
              </span>
              <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
