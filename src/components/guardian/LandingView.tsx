import {
  ArrowRightIcon,
  SearchIcon,
  LocationIcon,
  UploadIcon,
  CheckIcon,
  CloseIcon,
} from "@/components/icons";
import { GuardianIllustration } from "@/components/GuardianIllustration";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useHydrated, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  BriefcaseBusiness,
  Code2,
  Megaphone,
  Calculator,
  Users,
  Truck,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { JOBS } from "@/lib/job-listings";
import { jobSearch } from "@/lib/job-search";
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
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const items = root.current?.querySelectorAll("[data-reveal]");
    if (!items || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
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
    void navigate({ to: "/jobs", search: jobSearch({ q: query.trim(), location }) });
  };
  return (
    <div ref={root} className="career-site guardian-discovery">
      <a className="skip-link" href="#main-content">
        {en ? "Skip to content" : "Đến nội dung chính"}
      </a>
      <Header variant="landing" />
      <main id="main-content">
        <section className="career-hero">
          <div className="career-container">
            <div className="career-hero__intro">
              <div className="career-hero__copy">
                <h1 data-reveal>{en ? "Your next opportunity" : "Công việc tiếp theo"}</h1>
                <p data-reveal className="career-hero__description">
                  {en
                    ? "Explore jobs across Vietnam, prepare your profile and connect with employers."
                    : "Tìm việc đa ngành tại Việt Nam, chuẩn bị hồ sơ và kết nối với nhà tuyển dụng."}
                </p>
              </div>
              <GuardianIllustration name="careers" className="guardian-art--landing" />
            </div>
            <form data-reveal className="career-search" role="search" onSubmit={search}>
              <label className="career-search__keyword">
                <SearchIcon size={23} aria-hidden="true" />
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
                <LocationIcon size={22} aria-hidden="true" />
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
                <SearchIcon size={19} />
                {en ? "Find jobs" : "Tìm việc ngay"}
              </button>
            </form>
            <nav data-reveal className="career-popular" aria-label={en ? "Popular searches" : "Tìm kiếm phổ biến"}>
              <span>{en ? "Popular searches:" : "Tìm kiếm phổ biến:"}</span>
              {["Kinh doanh", "Kế toán", "Tiếp thị", "Nhân sự"].map((q) => (
                <Link key={q} to="/jobs" search={jobSearch({ q })}>
                  {q}
                </Link>
              ))}
            </nav>
          </div>
        </section>
        <section className="career-container career-jobs" aria-labelledby="opportunities-title">
          <div data-reveal className="career-section-heading">
            <div>
              <h2 id="opportunities-title">
                {en ? "Explore your next opportunity" : "Cơ hội việc làm"}
              </h2>
              <p>
                {en
                  ? "Opportunities across industries, with salary and company information in one place."
                  : "Việc làm đa ngành, mức lương và thông tin doanh nghiệp trong một nơi."}
              </p>
            </div>
            <Link to="/jobs" search={jobSearch({})} className="career-text-link">
              {en ? "View all jobs" : "Xem tất cả việc làm"}
              <ArrowRightIcon size={18} />
            </Link>
          </div>
          <p className="career-demo-note">
            {en
              ? "Sample job listings from the current product."
              : "Các tin tuyển dụng mẫu trong sản phẩm hiện tại."}
          </p>
          <div className="career-job-grid landing-job-list">
            {JOBS.slice(0, 6).map((job) => (
              <Link
                key={job.id}
                to="/jobs"
                search={jobSearch({ job: job.id })}
                data-reveal
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
                </div>
                <h3>{job.title}</h3>
                <p className="career-job__salary">{job.salaryRange}</p>
                <p className="career-job__location">
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
            <div data-reveal className="career-section-heading">
              <h2 id="fields-title">{en ? "Find your field" : "Khám phá theo ngành nghề"}</h2>
            </div>
            <div className="career-field-grid">
              {categories.map(({ label, en: englishLabel, query: q, detail, detailEn }) => (
                <Link
                  key={label}
                  to="/jobs"
                  search={jobSearch({ q })}
                  data-reveal
                  className="career-field"
                >
                  <h3>{en ? englishLabel : label}</h3>
                  <p>{en ? detailEn : detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="career-container career-paths">
          <div data-reveal className="career-cv">
            <GuardianIllustration name="discovery" className="guardian-art--path" />
            <div>
              <h2>{en ? "Prepare your profile" : "Chuẩn bị hồ sơ"}</h2>
              <p>
                {en
                  ? "Keep your experience, skills and CV together for your next application."
                  : "Tập hợp kinh nghiệm, kỹ năng và CV cho lần ứng tuyển tiếp theo."}
              </p>
            </div>
            <div className="career-upload">
              <UploadIcon size={28} aria-hidden="true" />
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
                <CheckIcon size={17} />
                <span>{uploadedCv}</span>
                <button
                  aria-label={en ? "Remove selected file" : "Bỏ chọn tệp"}
                  onClick={() => {
                    setUploadedCv("");
                    const input = document.getElementById("career-cv") as HTMLInputElement;
                    input.value = "";
                  }}
                >
                  <CloseIcon size={16} />
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
              <ArrowRightIcon size={17} />
            </Link>
          </div>
          <div data-reveal className="career-employer">
            <GuardianIllustration name="posting" className="guardian-art--path" />
            <h2>
              {dict.landing.findNextHire}
              {dict.landing.findNextHireAccent}
            </h2>
            <p>
              {en
                ? "Set up your company, submit verification documents and prepare your job listings."
                : "Thiết lập công ty, gửi hồ sơ xác minh và chuẩn bị tin tuyển dụng trong cùng một không gian."}
            </p>
            <Link className="career-button" to="/register" search={{ role: "recruiter" }}>
              {dict.landing.startHiring}
              <ArrowRightIcon size={18} />
            </Link>
            <Link className="career-employer__secondary" to="/recruit">
              {en ? "Explore the recruiter workspace" : "Khám phá không gian nhà tuyển dụng"}
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </section>
        <section id="how-it-works" className="career-steps">
          <div className="career-container">
            <h2 data-reveal>
              {en ? "From discovery to application" : "Từ tìm việc đến ứng tuyển"}
            </h2>
            <GuardianIllustration name="review" className="guardian-art--process" />
            <ol>
              {[
                [
                  en ? "Find a role" : "Tìm vị trí phù hợp",
                  en
                    ? "Search by title, industry or location. Read the salary, requirements and company information."
                    : "Tìm theo vị trí, ngành nghề hoặc địa điểm. Đọc mức lương, yêu cầu và thông tin doanh nghiệp.",
                ],
                [
                  en ? "Prepare your application" : "Chuẩn bị hồ sơ ứng tuyển",
                  en
                    ? "Update your profile and choose the CV for the role."
                    : "Cập nhật hồ sơ cá nhân và chọn CV phù hợp với vị trí.",
                ],
                [
                  en ? "Review before sending" : "Kiểm tra trước khi gửi",
                  en
                    ? "Review the job and your contact details before submitting an application."
                    : "Kiểm tra tin tuyển dụng và thông tin liên hệ trước khi gửi đơn.",
                ],
              ].map(([title, body]) => (
                <li data-reveal key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
            <Link data-reveal to="/copilot" className="career-law-link">
              <ShieldCheck size={23} />
              <span>
                {en
                  ? "Questions about employment terms? Explore Legal Copilot."
                  : "Có câu hỏi về điều kiện lao động? Khám phá Legal Copilot."}
              </span>
              <ArrowRightIcon size={19} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
