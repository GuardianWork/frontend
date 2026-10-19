import { JOBS, type JobItem } from "@/lib/job-listings";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { submitCompanyApplication } from "@/services/companyMembers";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/candidate/jobs")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { q?: string; location?: string; job?: string } => ({
    q: typeof search.q === "string" ? search.q : "",
    location: typeof search.location === "string" ? search.location : "",
    job: typeof search.job === "string" ? search.job : "",
  }),
  head: () => ({
    meta: [
      { title: "Việc làm dành cho bạn — GuardianWork Candidate" },
      {
        name: "description",
        content:
          "Khám phá việc làm đa ngành, thông tin doanh nghiệp và điều kiện tuyển dụng trên GuardianWork.",
      },
    ],
  }),
  component: CandidateJobsPage,
});

function badgeStyle(tone: JobItem["badgeTone"]) {
  if (tone === "success") return "bg-green-50 text-green-700 border border-green-200";
  if (tone === "warning") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-surface-container text-charcoal-text border border-warm-border";
}

function CandidateJobsPage() {
  const { workspace, company, user } = useCompanyWorkspace();
  const [applicationError, setApplicationError] = useState("");
  const detailRef = useRef<HTMLDivElement>(null);
  const [showDetail, setShowDetail] = useState(false);
  const companyJobs: JobItem[] = workspace.jobs
    .filter((j) => j.status === "Active")
    .map((j) => ({
      id: j.id,
      title: j.title,
      company: company?.name || "",
      location: j.location,
      salaryRange: j.salary,
      badge: "Công ty đã xác thực",
      badgeTone: "primary",
      time: new Date(j.created).toLocaleDateString("vi-VN"),
      department: j.department,
      matchScore: 0,
      description: `Vị trí ${j.title} thuộc phòng ban ${j.department}.`,
      requirements: [],
      statutoryBase: "Chưa đánh giá tin tuyển dụng",
      statutoryNote:
        "Công ty đã xác thực thông tin doanh nghiệp. Vui lòng liên hệ nhà tuyển dụng để nhận mô tả công việc chi tiết.",
      suggestedRevision: "Trao đổi trực tiếp với nhà tuyển dụng về điều kiện làm việc.",
    }));
  const jobs = [...companyJobs, ...JOBS];
  const search = Route.useSearch();
  const [query, setQuery] = useState(search.q || "");
  const [location, setLocation] = useState(search.location || "");
  const [industry, setIndustry] = useState("");
  const [selectedId, setSelectedId] = useState(search.job || JOBS[0].id);
  const [filter, setFilter] = useState<"all" | "high" | "remote">("all");
  const [appliedList, setAppliedList] = useState<string[]>([]);

  const normalize = (value: string) =>
    value
      .toLocaleLowerCase("vi")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const selectJob = (id: string) => {
    setSelectedId(id);
    setShowDetail(true);
  };
  useEffect(() => {
    if ((showDetail || search.job) && window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ block: "start" });
    }
  }, [selectedId, showDetail, search.job]);
  const filteredJobs = jobs.filter((j) => {
    if (
      !normalize(
        `${j.title} ${j.company} ${j.department} ${j.industry || ""} ${j.description}`,
      ).includes(normalize(query.trim()))
    )
      return false;
    if (location && !normalize(j.location).includes(normalize(location))) return false;
    if (industry && !normalize(`${j.industry || ""} ${j.department}`).includes(normalize(industry)))
      return false;
    if (filter === "high") return j.matchScore >= 95;
    if (filter === "remote") return j.location.includes("Từ xa") || j.location.includes("Hybrid");
    return true;
  });

  const activeJob = filteredJobs.find((j) => j.id === selectedId) || filteredJobs[0];
  const hasApplied = (id: string) =>
    appliedList.includes(id) ||
    workspace.applications.some((a) => a.jobId === id && a.email === user?.email.toLowerCase());
  const isApplied = activeJob ? hasApplied(activeJob.id) : false;

  const handleApply = (id: string) => {
    setApplicationError("");
    if (companyJobs.some((j) => j.id === id)) {
      try {
        submitCompanyApplication(id);
      } catch (e) {
        setApplicationError(e instanceof Error ? e.message : "Không thể nộp đơn.");
      }
      return;
    }
    if (!appliedList.includes(id)) {
      setAppliedList((prev) => [...prev, id]);
    }
  };

  return (
    <AdminShell title="Việc làm dành cho bạn" role="candidate">
      {applicationError && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 p-4 text-red-700">
          {applicationError}
        </p>
      )}
      <form className="workspace-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label>
          <Icon name="search" />
          <span className="sr-only">Vị trí, kỹ năng hoặc công ty</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Vị trí, kỹ năng hoặc công ty"
          />
        </label>
        <label>
          <Icon name="location_on" />
          <span className="sr-only">Địa điểm làm việc</span>
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="">Tất cả địa điểm</option>
            <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="Từ xa">Làm việc từ xa</option>
          </select>
        </label>
        <label>
          <Icon name="work" />
          <span className="sr-only">Ngành nghề</span>
          <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
            <option value="">Tất cả ngành nghề</option>
            {[
              "Kinh doanh",
              "Tiếp thị",
              "Kế toán",
              "Nhân sự",
              "Vận hành",
              "Công nghệ thông tin",
            ].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <span aria-live="polite">{filteredJobs.length} vị trí</span>
      </form>
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
            Việc làm dành cho bạn
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Khám phá việc làm đa ngành. Xem mức lương, yêu cầu chuyên môn và điều kiện làm việc
            trước khi ứng tuyển.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/candidate/copilot"
            className="px-4 py-2 bg-paper-white border border-warm-border rounded-lg text-sm font-medium text-charcoal-text hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="smart_toy" className="!text-lg text-primary" />
            <span>AI Legal Check</span>
          </Link>
          <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>6/6 JD Hợp chuẩn 100%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Job list */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-paper-white p-3 rounded-xl border border-warm-border">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === "all"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text hover:bg-charcoal-04"
                }`}
              >
                Tất cả ({jobs.length})
              </button>
              <button
                onClick={() => setFilter("high")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === "high"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text hover:bg-charcoal-04"
                }`}
              >
                Phù hợp cao (&gt;95%)
              </button>
              <button
                onClick={() => setFilter("remote")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === "remote"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-charcoal-text hover:bg-charcoal-04"
                }`}
              >
                Từ xa / Hybrid
              </button>
            </div>
            <button className="text-charcoal-83 hover:text-charcoal-text flex items-center gap-1 text-sm font-medium">
              <Icon name="filter_list" className="!text-base" /> Lọc
            </button>
          </div>

          {filteredJobs.map((it) => {
            const isActive = it.id === activeJob?.id;
            const applied = hasApplied(it.id);

            return (
              <div
                key={it.id}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectJob(it.id);
                  }
                }}
                onClick={() => selectJob(it.id)}
                className={
                  isActive
                    ? "bg-paper-white p-5 rounded-xl border border-primary shadow-sm cursor-pointer transition-all"
                    : "bg-paper-white p-5 rounded-xl border border-warm-border hover:shadow-sm transition-shadow cursor-pointer opacity-85 hover:opacity-100"
                }
              >
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight text-charcoal-text">
                      {it.title}
                    </h3>
                    <p className="text-sm text-charcoal-83 mt-0.5 font-medium">
                      {it.company} • {it.location.split("(")[0].trim()}
                    </p>
                  </div>
                  <span
                    className={`font-semibold text-[10px] uppercase tracking-wider px-2 py-1 rounded shrink-0 ${badgeStyle(it.badgeTone)}`}
                  >
                    {it.badge}
                  </span>
                </div>

                <div className="font-mono text-xs font-semibold text-primary mt-2">
                  {it.salaryRange}
                </div>

                <div className="mt-3 pt-3 border-t border-warm-border flex items-center justify-between text-xs text-charcoal-40">
                  <div className="flex items-center gap-1.5 font-medium text-green-700">
                    <Icon name="verified" className="!text-[15px]" />
                    <span>
                      {it.matchScore ? `Match: ${it.matchScore}%` : "Chưa đánh giá độ phù hợp"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    {applied ? (
                      <span className="text-green-700 font-semibold flex items-center gap-1">
                        <Icon name="check_circle" className="!text-[14px]" /> Đã ứng tuyển
                      </span>
                    ) : (
                      <span>{it.time}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Pane: Review & Audit Detail */}
        {activeJob ? (
          <div ref={detailRef} className="job-detail min-w-0 lg:col-span-7">
            <div className="bg-paper-white rounded-xl border border-warm-border shadow-sm h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-warm-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-50 text-green-700 border border-green-200">
                      ĐÃ KIỂM ĐỊNH PHÁP LÝ
                    </span>
                    <span className="text-xs font-mono text-charcoal-40">
                      ID: #{activeJob.id.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-charcoal-text mt-1">{activeJob.title}</h3>
                  <p className="text-sm text-charcoal-83 font-medium">
                    {activeJob.company} • {activeJob.location}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/candidate/copilot"
                    className="px-3.5 py-2 text-charcoal-text text-xs font-semibold rounded-lg border border-warm-border hover:bg-surface-container transition-colors flex items-center gap-1.5"
                  >
                    <Icon name="help" className="!text-base" />
                    <span>Hỏi Luật</span>
                  </Link>

                  {isApplied ? (
                    <span className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1.5">
                      <Icon name="check_circle" className="!text-base" />
                      <span>Đã nộp hồ sơ</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(activeJob.id)}
                      className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Icon name="send" className="!text-base" />
                      <span>Ứng tuyển (Bảo vệ Luật định)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 p-8 overflow-y-auto space-y-8">
                {/* Salary & Match Callout */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-warm-border">
                    <span className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                      Mức lương đề xuất
                    </span>
                    <span className="text-lg font-bold text-charcoal-text block font-mono">
                      {activeJob.salaryRange}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low border border-warm-border">
                    <span className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                      Độ phù hợp kỹ năng
                    </span>
                    <span className="text-lg font-bold text-green-700 block flex items-center gap-1 font-mono">
                      <Icon name="auto_awesome" className="!text-lg" />
                      {activeJob.matchScore
                        ? `${activeJob.matchScore}% tương thích`
                        : "Chưa đánh giá độ phù hợp"}
                    </span>
                  </div>
                </div>

                {/* Statutory Base Note */}
                <div className="bg-parchment-bg border border-warm-border p-5 rounded-lg flex gap-4">
                  <Icon name="gavel" className="text-primary mt-0.5 !text-2xl shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal-text mb-1">
                      Căn cứ Pháp lý Kiểm toán: {activeJob.statutoryBase}
                    </h4>
                    <p className="text-sm text-charcoal-83 leading-relaxed mb-2">
                      {activeJob.statutoryNote}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-semibold text-primary">
                      <span className="flex items-center gap-1">
                        <Icon name="check" className="!text-sm text-green-600" /> Không giữ văn bằng
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="check" className="!text-sm text-green-600" /> Thử việc tối đa 60
                        ngày
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="check" className="!text-sm text-green-600" /> Điều 98 làm thêm
                        giờ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Icon name="description" className="!text-[18px]" />
                    Mô tả Công việc
                  </h4>
                  <p className="text-sm text-charcoal-text leading-relaxed bg-surface-container-low p-4 rounded-lg border border-warm-border">
                    {activeJob.description}
                  </p>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Icon name="checklist" className="!text-[18px]" />
                    Yêu cầu Trọng tâm
                  </h4>
                  <ul className="space-y-2 text-sm text-charcoal-text">
                    {activeJob.requirements.map((r, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 bg-paper-white p-3 rounded-lg border border-warm-border"
                      >
                        <Icon
                          name="check_circle"
                          className="!text-base text-primary shrink-0 mt-0.5"
                        />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Revision Box */}
                <div>
                  <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Icon name="verified_user" className="!text-[18px] text-primary" />
                    Quy định Bảo vệ Hợp đồng Thực thi
                  </h4>
                  <div className="bg-parchment-bg rounded-lg p-5 border border-warm-border">
                    <p className="leading-relaxed text-charcoal-text text-sm font-mono">
                      {activeJob.suggestedRevision}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="job-empty lg:col-span-7">
            <Icon name="search_off" />
            <h3>Chưa tìm thấy vị trí phù hợp</h3>
            <p>Thử từ khóa khác hoặc mở rộng địa điểm tìm kiếm.</p>
            <button
              onClick={() => {
                setQuery("");
                setLocation("");
                setFilter("all");
              }}
              className="recruiter-primary"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
