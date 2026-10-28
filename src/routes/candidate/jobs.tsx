import { JOBS, badgeLabel, type JobItem } from "@/lib/job-listings";
import {
  EXPERIENCE_BANDS,
  SALARY_BANDS,
  WORK_MODES,
  filterJobs,
  hasActiveFilters,
  industryOptions,
  normalizeSearchText,
  workModeOf,
} from "@/lib/job-search";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { jobModerationStatus, submitCompanyApplication } from "@/services/companyMembers";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  FileText,
  ListChecks,
  MapPin,
  Scale,
  Search,
  SearchX,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";

interface CandidateJobSearch {
  q?: string;
  location?: string;
  industry?: string;
  salary?: string;
  mode?: string;
  experience?: string;
  job?: string;
}

const WORK_MODE_LABELS: Record<ReturnType<typeof workModeOf>, string> = {
  onsite: "Tại văn phòng",
  hybrid: "Hybrid",
  remote: "Từ xa",
};

const POPULAR_QUERIES = ["Kinh doanh", "Kế toán", "Tiếp thị", "Nhân sự"];

/** Empty filters are dropped so a bare /candidate/jobs stays canonical. */
function cleanCandidateJobSearch(values: CandidateJobSearch): CandidateJobSearch {
  const next: CandidateJobSearch = {};
  if (values.q) next.q = values.q;
  if (values.location) next.location = values.location;
  if (values.industry) next.industry = values.industry;
  if (values.salary) next.salary = values.salary;
  if (values.mode) next.mode = values.mode;
  if (values.experience) next.experience = values.experience;
  if (values.job) next.job = values.job;
  return next;
}

function companyInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function shortLocation(location: string) {
  return location.split("(")[0].trim();
}

function badgeChipClass(tone: JobItem["badgeTone"]) {
  if (tone === "success") return "border-mint/30 bg-mint/10 text-mint";
  if (tone === "warning") return "border-accent-2/30 bg-accent-2/10 text-ink-2";
  return "border-rule bg-paper-2 text-ink-2";
}

export const Route = createFileRoute("/candidate/jobs")({
  validateSearch: (search: Record<string, unknown>): CandidateJobSearch =>
    cleanCandidateJobSearch({
      q: typeof search.q === "string" ? search.q : "",
      location: typeof search.location === "string" ? search.location : "",
      industry: typeof search.industry === "string" ? search.industry : "",
      salary: typeof search.salary === "string" ? search.salary : "",
      mode: typeof search.mode === "string" ? search.mode : "",
      experience: typeof search.experience === "string" ? search.experience : "",
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

  const [draftQuery, setDraftQuery] = useState(search.q ?? "");
  const [draftLocation, setDraftLocation] = useState(search.location ?? "");
  const [appliedList, setAppliedList] = useState<string[]>([]);

  // The URL is the durable record; the two search fields submit explicitly, like the public page.
  useEffect(() => {
    setDraftQuery(search.q ?? "");
    setDraftLocation(search.location ?? "");
  }, [search.q, search.location]);

  const update = (patch: CandidateJobSearch) => {
    void navigate({
      to: "/candidate/jobs",
      search: cleanCandidateJobSearch({ ...search, ...patch }),
      replace: true,
      resetScroll: false,
    });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update({ q: draftQuery.trim(), location: draftLocation, job: "" });
  };

  const resetFilters = () => {
    setDraftQuery("");
    setDraftLocation("");
    update({ q: "", location: "", industry: "", salary: "", mode: "", experience: "", job: "" });
  };

  useEffect(() => {
    if (!search.job || !window.matchMedia("(max-width: 1023px)").matches) return;
    detailRef.current?.scrollIntoView({ block: "start" });
  }, [search.job]);

  const filteredJobs = filterJobs(jobs, {
    q: search.q,
    location: search.location,
    salary: search.salary,
    mode: search.mode,
    experience: search.experience,
  }).filter((job) => {
    if (!search.industry) return true;
    return normalizeSearchText(`${job.industry ?? ""} ${job.department}`).includes(
      normalizeSearchText(search.industry),
    );
  });

  const activeJob = filteredJobs.find((job) => job.id === search.job) ?? filteredJobs[0];
  const filtersActive = hasActiveFilters(search);
  const industries = industryOptions(jobs);
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

  /** Arrow keys walk the stack without leaving the keyboard on the first card. */
  const moveSelection = (delta: number) => {
    if (filteredJobs.length === 0) return false;
    const currentIndex = filteredJobs.findIndex((job) => job.id === activeJob?.id);
    const nextIndex = Math.min(Math.max(currentIndex + delta, 0), filteredJobs.length - 1);
    const next = filteredJobs[nextIndex];
    if (!next || next.id === activeJob?.id) return false;
    update({ job: next.id });
    requestAnimationFrame(() => document.getElementById(`job-option-${next.id}`)?.focus());
    return true;
  };

  return (
    <AdminShell title="Việc làm" role="candidate">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.035em] text-ink">
              Việc làm dành cho bạn
            </h1>
            <p className="mt-2 max-w-[62ch] text-sm leading-6 text-ink-2 md:text-base">
              Tìm theo vị trí, công ty và địa điểm. Mở một tin để xem mức lương, yêu cầu và ghi chú
              kiểm định trước khi ứng tuyển.
            </p>
          </div>

          <Link
            to="/candidate/copilot"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start whitespace-nowrap rounded-lg border border-rule bg-paper px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-paper-2"
          >
            <Scale size={16} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
            <span>Trợ lý pháp lý</span>
          </Link>
        </header>

        {applicationError && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-error/25 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
          >
            {applicationError}
          </p>
        )}

        <div className="candidate-search-band rounded-2xl border border-rule bg-accent-subtle px-4 py-6 md:px-6 md:py-7">
          <form className="career-search" role="search" onSubmit={submitSearch}>
            <label className="career-search__keyword">
              <Search size={23} aria-hidden="true" />
              <span className="sr-only">Vị trí, kỹ năng hoặc công ty</span>
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                placeholder="Vị trí, kỹ năng hoặc công ty"
              />
            </label>
            <label className="career-search__location">
              <MapPin size={22} aria-hidden="true" />
              <span className="sr-only">Địa điểm làm việc</span>
              <select
                value={draftLocation}
                onChange={(event) => setDraftLocation(event.target.value)}
              >
                <option value="">Mọi địa điểm</option>
                <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Bình Dương">Bình Dương</option>
                <option value="Từ xa">Làm việc từ xa</option>
              </select>
            </label>
            <button className="career-button" type="submit">
              <Search size={19} aria-hidden="true" />
              Tìm việc ngay
            </button>
          </form>

          <div className="career-popular">
            <span>Tìm kiếm phổ biến:</span>
            {POPULAR_QUERIES.map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => {
                  setDraftQuery(query);
                  update({ q: query, job: "" });
                }}
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        <div className="career-discovery__filters" role="group" aria-label="Bộ lọc việc làm">
          <span className="career-discovery__filters-label">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Lọc
          </span>
          <label className="career-filter">
            <span>Ngành nghề</span>
            <select
              value={search.industry ?? ""}
              onChange={(event) => update({ industry: event.target.value, job: "" })}
            >
              <option value="">Mọi ngành nghề</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </label>
          <label className="career-filter">
            <span>Mức lương</span>
            <select
              value={search.salary ?? ""}
              onChange={(event) => update({ salary: event.target.value, job: "" })}
            >
              {SALARY_BANDS.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                </option>
              ))}
            </select>
          </label>
          <label className="career-filter">
            <span>Hình thức</span>
            <select
              value={search.mode ?? ""}
              onChange={(event) => update({ mode: event.target.value, job: "" })}
            >
              {WORK_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <label className="career-filter">
            <span>Kinh nghiệm</span>
            <select
              value={search.experience ?? ""}
              onChange={(event) => update({ experience: event.target.value, job: "" })}
            >
              {EXPERIENCE_BANDS.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                </option>
              ))}
            </select>
          </label>
          {filtersActive && filteredJobs.length > 0 && (
            <button type="button" className="career-filter__reset" onClick={resetFilters}>
              Xóa bộ lọc
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="career-results-meta">
          <p className="career-results-count" aria-live="polite">
            {filteredJobs.length} tin tuyển dụng
            {filtersActive ? " phù hợp với bộ lọc" : " đang hoạt động"}
          </p>
          {filteredJobs.length > 0 && (
            <p className="career-data-note">Huy hiệu kiểm định là dữ liệu minh họa.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left pane: the stack to scan */}
          {filteredJobs.length > 0 && (
            <ul
              aria-label="Danh sách việc làm"
              onKeyDown={(event) => {
                if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                if (moveSelection(event.key === "ArrowDown" ? 1 : -1)) event.preventDefault();
              }}
              className="flex flex-col gap-3 lg:col-span-5"
            >
              {filteredJobs.map((it) => {
                const isActive = it.id === activeJob?.id;
                const applied = hasApplied(it.id);

                return (
                  <li key={it.id}>
                    <Link
                      id={`job-option-${it.id}`}
                      to="/candidate/jobs"
                      search={cleanCandidateJobSearch({ ...search, job: it.id })}
                      aria-current={isActive ? "true" : undefined}
                      className={`block rounded-xl border p-4 transition-colors ${
                        isActive
                          ? "border-accent bg-accent-subtle/50"
                          : "border-rule bg-paper hover:border-rule-2 hover:bg-paper-2"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper-3 text-sm font-extrabold text-ink-2"
                        >
                          {companyInitial(it.company)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h2 className="text-base font-bold leading-snug text-ink">
                              {it.title}
                            </h2>
                            {isActive && (
                              <span className="shrink-0 rounded-md border border-accent/25 bg-accent-subtle px-1.5 py-0.5 text-xs font-bold tracking-wide text-accent-deep">
                                Đang xem
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-sm text-ink-2">{it.company}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} strokeWidth={1.75} aria-hidden="true" />
                              {shortLocation(it.location)}
                            </span>
                            <span>{WORK_MODE_LABELS[workModeOf(it)]}</span>
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <span className="text-sm font-bold leading-snug tabular-nums text-accent-deep">
                              {it.salaryRange}
                            </span>
                            <span className="flex items-center gap-2">
                              {applied && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-mint/10 px-1.5 py-0.5 text-xs font-semibold text-mint">
                                  <CheckCircle2 size={12} strokeWidth={1.75} aria-hidden="true" />
                                  Đã ứng tuyển
                                </span>
                              )}
                              {it.matchScore > 0 && (
                                <span className="text-xs font-semibold tabular-nums text-mint">
                                  Phù hợp {it.matchScore}%
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-rule pt-2 text-xs text-ink-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-semibold ${badgeChipClass(it.badgeTone)}`}
                            >
                              {badgeLabel(it.badge)}
                            </span>
                            <span className="tabular-nums">{it.time}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Right pane: read one listing without losing the stack */}
          {activeJob ? (
            <div ref={detailRef} className="min-w-0 lg:col-span-7">
              <article className="overflow-hidden rounded-xl border border-rule bg-paper lg:sticky lg:top-0 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
                <header className="px-5 py-5 sm:px-6">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper-3 text-lg font-extrabold text-ink-2"
                    >
                      {companyInitial(activeJob.company)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${
                            isVerified
                              ? "border-mint/30 bg-mint/10 text-mint"
                              : "border-rule bg-paper-2 text-ink-2"
                          }`}
                        >
                          {isVerified ? (
                            <BadgeCheck size={12} strokeWidth={1.75} aria-hidden="true" />
                          ) : (
                            <ShieldCheck size={12} strokeWidth={1.75} aria-hidden="true" />
                          )}
                          {isVerified ? "Đã kiểm định pháp lý" : "Chưa kiểm định pháp lý"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${badgeChipClass(activeJob.badgeTone)}`}
                        >
                          {badgeLabel(activeJob.badge)}
                        </span>
                        <span className="text-xs tabular-nums text-ink-3">
                          #{activeJob.id.toUpperCase()}
                        </span>
                      </div>
                      <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-ink">
                        {activeJob.title}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-ink-2">
                        {activeJob.company} · {activeJob.location}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {isApplied ? (
                      <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-mint/25 bg-mint/10 px-4 text-sm font-bold text-mint">
                        <CheckCircle2 size={16} strokeWidth={1.75} aria-hidden="true" />
                        Đã nộp hồ sơ
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApply(activeJob.id)}
                        className="btn whitespace-nowrap"
                      >
                        <Send size={16} strokeWidth={1.75} aria-hidden="true" />
                        Ứng tuyển
                      </button>
                    )}
                    <Link to="/candidate/copilot" className="btn btn--secondary whitespace-nowrap">
                      <Scale size={16} strokeWidth={1.75} aria-hidden="true" />
                      Hỏi luật
                    </Link>
                  </div>
                </header>

                <dl className="grid grid-cols-1 gap-4 border-y border-rule bg-paper-2 px-5 py-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-rule sm:px-0">
                  <div className="sm:px-5">
                    <dt className="text-xs font-semibold text-ink-3">Mức lương đề xuất</dt>
                    <dd className="mt-1 text-sm font-bold leading-snug tabular-nums text-ink">
                      {activeJob.salaryRange}
                    </dd>
                  </div>
                  <div className="sm:px-5">
                    <dt className="text-xs font-semibold text-ink-3">Độ phù hợp kỹ năng</dt>
                    <dd
                      className={`mt-1 text-sm font-bold tabular-nums ${activeJob.matchScore > 0 ? "text-mint" : "font-medium text-ink-2"}`}
                    >
                      {activeJob.matchScore > 0
                        ? `${activeJob.matchScore}% tương thích`
                        : "Chưa đánh giá"}
                    </dd>
                  </div>
                  <div className="sm:px-5">
                    <dt className="text-xs font-semibold text-ink-3">Hình thức làm việc</dt>
                    <dd className="mt-1 text-sm font-bold text-ink">
                      {WORK_MODE_LABELS[workModeOf(activeJob)]}
                    </dd>
                  </div>
                </dl>

                <div className="divide-y divide-rule">
                  <section className="px-5 py-5 sm:px-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                      <FileText
                        size={15}
                        strokeWidth={1.75}
                        className="text-accent"
                        aria-hidden="true"
                      />
                      Mô tả công việc
                    </h3>
                    <p className="mt-2 max-w-[70ch] text-sm leading-6 text-ink-2">
                      {activeJob.description}
                    </p>
                  </section>

                  <section className="px-5 py-5 sm:px-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                      <ListChecks
                        size={15}
                        strokeWidth={1.75}
                        className="text-accent"
                        aria-hidden="true"
                      />
                      Yêu cầu trọng tâm
                    </h3>
                    {activeJob.requirements.length > 0 ? (
                      <ul className="mt-2.5 space-y-2">
                        {activeJob.requirements.map((requirement) => (
                          <li
                            key={requirement}
                            className="flex gap-2.5 text-sm leading-6 text-ink-2"
                          >
                            <Check
                              size={15}
                              strokeWidth={2}
                              className="mt-1 shrink-0 text-mint"
                              aria-hidden="true"
                            />
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-ink-2">
                        Nhà tuyển dụng chưa công bố yêu cầu cụ thể cho vị trí này.
                      </p>
                    )}
                  </section>

                  <section className="px-5 py-5 sm:px-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                      <Scale
                        size={15}
                        strokeWidth={1.75}
                        className="text-accent"
                        aria-hidden="true"
                      />
                      Căn cứ pháp lý
                    </h3>
                    <div className="mt-2.5 rounded-lg bg-accent-subtle px-4 py-3.5">
                      <p className="text-sm font-semibold leading-6 text-ink">
                        {activeJob.statutoryBase}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-ink-2">
                        {activeJob.statutoryNote}
                      </p>
                      <p className="mt-2 text-xs text-ink-3">
                        Ghi chú kiểm định dựa trên dữ liệu minh họa.
                      </p>
                    </div>
                  </section>

                  <section className="px-5 py-5 sm:px-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                      <ShieldCheck
                        size={15}
                        strokeWidth={1.75}
                        className="text-accent"
                        aria-hidden="true"
                      />
                      Ghi chú kiểm định
                    </h3>
                    <p className="mt-2.5 rounded-lg bg-paper-2 px-4 py-3.5 text-sm leading-6 text-ink-2">
                      {activeJob.suggestedRevision}
                    </p>
                  </section>
                </div>
              </article>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rule-2 bg-paper px-5 py-14 text-center lg:col-span-12">
              <SearchX size={30} strokeWidth={1.5} className="text-ink-3" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-bold text-ink">Chưa tìm thấy vị trí phù hợp</h2>
              <p className="mt-1 max-w-[46ch] text-sm leading-6 text-ink-2">
                Thử từ khóa khác, mở rộng địa điểm hoặc bỏ bộ lọc ngành nghề.
              </p>
              <button type="button" onClick={resetFilters} className="btn btn--secondary mt-4">
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
