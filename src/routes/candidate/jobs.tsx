import { JOBS, badgeLabel, type JobItem } from "@/lib/job-listings";
import { filterJobs, normalizeSearchText, workModeOf } from "@/lib/job-search";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { jobModerationStatus, submitCompanyApplication } from "@/services/companyMembers";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

type CandidateJobScope = "all" | "high" | "remote";

interface CandidateJobSearch {
  q?: string;
  location?: string;
  industry?: string;
  job?: string;
  scope?: CandidateJobScope;
}

/** Empty filters are dropped so a bare /candidate/jobs stays canonical. */
function cleanCandidateJobSearch(values: CandidateJobSearch): CandidateJobSearch {
  const next: CandidateJobSearch = {};
  if (values.q) next.q = values.q;
  if (values.location) next.location = values.location;
  if (values.industry) next.industry = values.industry;
  if (values.job) next.job = values.job;
  if (values.scope && values.scope !== "all") next.scope = values.scope;
  return next;
}

function readScope(value: unknown): CandidateJobScope {
  return value === "high" || value === "remote" ? value : "all";
}

export const Route = createFileRoute("/candidate/jobs")({
  validateSearch: (search: Record<string, unknown>): CandidateJobSearch =>
    cleanCandidateJobSearch({
      q: typeof search.q === "string" ? search.q : "",
      location: typeof search.location === "string" ? search.location : "",
      industry: typeof search.industry === "string" ? search.industry : "",
      job: typeof search.job === "string" ? search.job : "",
      scope: readScope(search.scope),
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

function scopeChipClass(active: boolean) {
  return `whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
    active
      ? "bg-primary text-on-primary"
      : "bg-surface-container text-charcoal-text hover:bg-charcoal-04"
  }`;
}

function CandidateJobsPage() {
  const { workspace, company, user } = useCompanyWorkspace();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [applicationError, setApplicationError] = useState("");
  const detailRef = useRef<HTMLDivElement>(null);
  const companyJobs: JobItem[] = workspace.jobs
    .filter(
      (j) =>
        j.status === "Active" && jobModerationStatus(j) === "approved" && j.visibility !== "HIDDEN",
    )
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

  const [query, setQuery] = useState(search.q ?? "");
  const [location, setLocation] = useState(search.location ?? "");
  const [industry, setIndustry] = useState(search.industry ?? "");
  const [scope, setScope] = useState<CandidateJobScope>(search.scope ?? "all");
  const [selectedId, setSelectedId] = useState(search.job ?? "");
  const [appliedList, setAppliedList] = useState<string[]>([]);

  // The URL is the durable record: a filtered list or an open job survives refresh and sharing.
  useEffect(() => {
    const next = cleanCandidateJobSearch({ q: query, location, industry, scope, job: selectedId });
    const current = cleanCandidateJobSearch(search);
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    const timer = setTimeout(() => {
      void navigate({ to: "/candidate/jobs", search: next, replace: true, resetScroll: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, location, industry, scope, selectedId, search, navigate]);

  // Back/forward and incoming links win over whatever the page was showing.
  useEffect(() => {
    setQuery(search.q ?? "");
    setLocation(search.location ?? "");
    setIndustry(search.industry ?? "");
    setScope(search.scope ?? "all");
    setSelectedId(search.job ?? "");
  }, [search.q, search.location, search.industry, search.scope, search.job]);

  useEffect(() => {
    if (!selectedId || !window.matchMedia("(max-width: 1023px)").matches) return;
    detailRef.current?.scrollIntoView({ block: "start" });
  }, [selectedId]);

  const filteredJobs = filterJobs(jobs, { q: query, location }).filter((job) => {
    if (
      industry &&
      !normalizeSearchText(`${job.industry ?? ""} ${job.department}`).includes(
        normalizeSearchText(industry),
      )
    )
      return false;
    if (scope === "high") return job.matchScore >= 95;
    if (scope === "remote") return workModeOf(job) !== "onsite";
    return true;
  });

  const activeJob = filteredJobs.find((job) => job.id === selectedId) ?? filteredJobs[0];
  // "Chưa đánh giá…" must read as unverified, never as a passed legal audit.
  const isVerified = activeJob ? !/^chưa/i.test(activeJob.statutoryBase) : false;
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
    <AdminShell title="Việc làm" role="candidate">
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
            placeholder="Vị trí, kỹ năng"
          />
        </label>
        <label>
          <Icon name="location_on" />
          <span className="sr-only">Địa điểm làm việc</span>
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="">Mọi địa điểm</option>
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
            <option value="">Mọi ngành nghề</option>
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
      </form>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="mb-1.5 text-2xl font-bold tracking-[-0.03em] text-charcoal-text md:text-3xl">
            Việc làm dành cho bạn
          </h1>
          <p className="max-w-2xl text-sm text-charcoal-83 md:text-base">
            Tìm theo vị trí, công ty và địa điểm. Mở một tin để xem mức lương, yêu cầu và ghi chú
            kiểm định trước khi ứng tuyển.
          </p>
        </div>

        <Link
          to="/candidate/copilot"
          className="inline-flex shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-lg border border-warm-border bg-paper-white px-3.5 py-2 text-sm font-medium text-charcoal-text transition-colors hover:bg-surface-container"
        >
          <Icon name="smart_toy" className="!text-lg text-primary" />
          <span>AI Legal Check</span>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warm-border bg-paper-white p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={scope === "all"}
            onClick={() => setScope("all")}
            className={scopeChipClass(scope === "all")}
          >
            Tất cả ({jobs.length})
          </button>
          <button
            type="button"
            aria-pressed={scope === "high"}
            onClick={() => setScope("high")}
            className={scopeChipClass(scope === "high")}
          >
            Phù hợp ≥95%
          </button>
          <button
            type="button"
            aria-pressed={scope === "remote"}
            onClick={() => setScope("remote")}
            className={scopeChipClass(scope === "remote")}
          >
            Từ xa / Hybrid
          </button>
        </div>
        <span aria-live="polite" className="text-xs tabular-nums text-charcoal-40">
          {filteredJobs.length} kết quả
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Job list */}
        <div
          className={`${filteredJobs.length === 0 ? "hidden" : "flex"} flex-col gap-4 lg:col-span-5`}
        >
          {filteredJobs.map((it) => {
            const isActive = it.id === activeJob?.id;
            const applied = hasApplied(it.id);

            return (
              <Link
                key={it.id}
                to="/candidate/jobs"
                search={cleanCandidateJobSearch({ ...search, job: it.id })}
                aria-current={isActive ? "true" : undefined}
                className={`block rounded-xl border bg-paper-white p-5 transition-colors ${
                  isActive ? "border-primary" : "border-warm-border hover:bg-surface-container-low"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <div className="min-w-0 flex-1 basis-[180px]">
                    <h3 className="text-lg font-semibold leading-tight text-charcoal-text">
                      {it.title}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-charcoal-83">
                      {it.company} • {it.location.split("(")[0].trim()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${badgeStyle(it.badgeTone)}`}
                  >
                    {badgeLabel(it.badge)}
                  </span>
                </div>

                <div className="mt-2 text-sm font-semibold tabular-nums text-primary">
                  {it.salaryRange}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-warm-border pt-3 text-xs text-charcoal-40">
                  {it.matchScore ? (
                    <span className="flex items-center gap-1.5 font-medium text-green-700">
                      <Icon name="verified" className="!text-[15px]" />
                      Phù hợp {it.matchScore}%
                    </span>
                  ) : (
                    <span>Chưa đánh giá độ phù hợp</span>
                  )}
                  <span className="flex items-center gap-1 tabular-nums">
                    {applied ? (
                      <span className="flex items-center gap-1 font-semibold text-green-700">
                        <Icon name="check_circle" className="!text-[14px]" /> Đã ứng tuyển
                      </span>
                    ) : (
                      <span>{it.time}</span>
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right Pane: Review & Audit Detail */}
        {activeJob ? (
          <div ref={detailRef} className="job-detail min-w-0 lg:col-span-7">
            <div className="bg-paper-white rounded-xl border border-warm-border shadow-sm h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex flex-col gap-4 border-b border-warm-border p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        isVerified
                          ? "border border-green-200 bg-green-50 text-green-700"
                          : "border border-warm-border bg-surface-container text-charcoal-83"
                      }`}
                    >
                      {isVerified ? "Đã kiểm định pháp lý" : "Chưa kiểm định pháp lý"}
                    </span>
                    <span className="text-xs tabular-nums text-charcoal-40">
                      ID: #{activeJob.id.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-charcoal-text mt-1">{activeJob.title}</h3>
                  <p className="text-sm text-charcoal-83 font-medium">
                    {activeJob.company} • {activeJob.location}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/candidate/copilot"
                    className="px-3.5 py-2 whitespace-nowrap text-charcoal-text text-sm font-medium rounded-lg border border-warm-border hover:bg-surface-container transition-colors flex items-center gap-1.5"
                  >
                    <Icon name="help" className="!text-base" />
                    <span>Hỏi Luật</span>
                  </Link>

                  {isApplied ? (
                    <span className="px-4 py-2 whitespace-nowrap bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-lg flex items-center gap-1.5">
                      <Icon name="check_circle" className="!text-base" />
                      <span>Đã nộp hồ sơ</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(activeJob.id)}
                      className="px-4 py-2 whitespace-nowrap bg-primary text-on-primary text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-1.5"
                    >
                      <Icon name="send" className="!text-base" />
                      <span>Ứng tuyển</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 p-8 overflow-y-auto space-y-8">
                {/* Salary & Match Callout */}
                <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-warm-border">
                    <span className="mb-1 block text-xs font-semibold text-charcoal-83">
                      Mức lương đề xuất
                    </span>
                    <span className="block text-lg font-bold tabular-nums text-charcoal-text text-balance">
                      {activeJob.salaryRange}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-low border border-warm-border">
                    <span className="mb-1 block text-xs font-semibold text-charcoal-83">
                      Độ phù hợp kỹ năng
                    </span>
                    {activeJob.matchScore ? (
                      <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-green-700">
                        <Icon name="auto_awesome" className="!text-lg" />
                        {activeJob.matchScore}% tương thích
                      </span>
                    ) : (
                      <span className="block text-sm font-medium text-charcoal-83">
                        Chưa đánh giá độ phù hợp
                      </span>
                    )}
                  </div>
                </div>

                {/* Legal basis */}
                <div className="bg-parchment-bg border border-warm-border p-5 rounded-lg flex gap-4">
                  <Icon name="gavel" className="text-primary mt-0.5 !text-2xl shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-charcoal-text">Căn cứ pháp lý</h4>
                    <p className="mt-0.5 text-sm font-medium text-charcoal-text">
                      {activeJob.statutoryBase}
                    </p>
                    <p className="mt-2 text-sm text-charcoal-83 leading-relaxed">
                      {activeJob.statutoryNote}
                    </p>
                    <p className="mt-2 text-xs text-charcoal-40">
                      Ghi chú kiểm định dựa trên dữ liệu minh họa.
                    </p>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-charcoal-83">
                    <Icon name="description" className="!text-[18px] text-primary" />
                    Mô tả công việc
                  </h4>
                  <p className="text-sm text-charcoal-text leading-relaxed bg-surface-container-low p-4 rounded-lg border border-warm-border">
                    {activeJob.description}
                  </p>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-charcoal-83">
                    <Icon name="checklist" className="!text-[18px] text-primary" />
                    Yêu cầu trọng tâm
                  </h4>
                  {activeJob.requirements.length > 0 ? (
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
                  ) : (
                    <p className="rounded-lg border border-warm-border bg-surface-container-low p-4 text-sm text-charcoal-83">
                      Nhà tuyển dụng chưa công bố yêu cầu cụ thể cho vị trí này.
                    </p>
                  )}
                </div>

                {/* Verification notes */}
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-charcoal-83">
                    <Icon name="verified_user" className="!text-[18px] text-primary" />
                    Ghi chú kiểm định
                  </h4>
                  <div className="bg-parchment-bg rounded-lg p-5 border border-warm-border">
                    <p className="leading-relaxed text-charcoal-text text-sm">
                      {activeJob.suggestedRevision}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="job-empty rounded-xl border border-warm-border bg-paper-white lg:col-span-12">
            <Icon name="search_off" />
            <h3>Chưa tìm thấy vị trí phù hợp</h3>
            <p>Thử từ khóa khác, mở rộng địa điểm hoặc bỏ bộ lọc ngành nghề.</p>
            <button
              onClick={() => {
                setQuery("");
                setLocation("");
                setIndustry("");
                setScope("all");
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
