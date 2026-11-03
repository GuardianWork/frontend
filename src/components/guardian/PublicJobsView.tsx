import { JobDescription } from "@/components/recruiter/JobDescription";
/* Hallmark · page: public job discovery · genre: modern-minimal
 * macrostructure: Workbench · tone: utilitarian · theme: GuardianWork (DESIGN.md locked)
 * anchor hue: Guardian Blue · enrichment: none (typography + functional states) · job-list focus
 * states: default · hover · focus · active · disabled · loading · error · success
 * pre-emit critique: P5 H5 E5 S5 R5 V4
 */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  ChevronDown,
  Building2,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Search,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { ApiError, apiRequest } from "@/services/api";
import { Header } from "./Header";
import { AdminShell } from "@/components/AdminShell";
import { Footer } from "./Footer";
import { searchPublicJobs } from "../../services/publicJobs";
import type { JobContent } from "@/services/jobs";
import type { PublicJobSearchResult } from "../../services/publicJobs";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { useCandidate } from "@/context/CandidateContext";
import { badgeLabel, isSampleListing, type JobItem } from "@/lib/job-listings";
import { paginateItems } from "@/lib/pagination";
import {
  EXPERIENCE_BANDS,
  SALARY_BANDS,
  WORK_MODES,
  WORK_MODE_LABELS,
  filterJobs,
  hasActiveFilters,
  industryOptions,
  jobSearch,
  similarJobs,
  workModeOf,
  type JobSearchParams,
} from "@/lib/job-search";

function useJobsPath() {
  return useRouterState({
    select: (state) =>
      state.location.pathname.startsWith("/can/") ? ("/can/jobs" as const) : ("/jobs" as const),
  });
}
const PAGE_SIZE = 6;

const POPULAR_QUERIES = ["Kinh doanh", "Kế toán", "Tiếp thị", "Nhân sự"];

function CompanyMark({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("vi");
  return (
    <span className="career-company-mark" aria-hidden="true">
      {initials}
    </span>
  );
}

function toPublicJobItem(job: PublicJobSearchResult): JobItem {
  const content = job.content ?? {};
  const compensation = content.compensation;
  const hasSalary =
    Boolean(compensation?.disclosed) &&
    typeof compensation?.minimum === "number" &&
    typeof compensation?.maximum === "number";
  const salaryRange = hasSalary
    ? `${Math.round(compensation!.minimum!).toLocaleString("vi-VN").replace(/,/g, ".")} - ${Math.round(compensation!.maximum!).toLocaleString("vi-VN").replace(/,/g, ".")} ${compensation!.currency ?? "VND"} / ${(compensation!.payPeriod ?? "MONTH").toLowerCase()}`
    : "Thỏa thuận";
  return {
    id: String(job.id),
    title: content.title ?? "Tin tuyển dụng",
    company: job.company?.name ?? "Doanh nghiệp",
    location: content.location ?? "Chưa cập nhật",
    salaryRange,
    badge: "Công ty đã xác thực",
    badgeTone: "success",
    time: "Đang tuyển",
    department: employmentTypeLabel(content.employmentType),
    industry: "Chưa cập nhật",
    matchScore: 0,
    description: content.description ?? "",
    requirements: [],
    statutoryBase: "Thông tin công khai từ tin tuyển dụng",
    statutoryNote: "Kiểm tra kỹ điều khoản và điều kiện làm việc trước khi ứng tuyển.",
    suggestedRevision: "Xem chi tiết để biết đầy đủ thông tin tuyển dụng.",
  };
}

function employmentTypeLabel(value?: string) {
  switch (value) {
    case "FULL_TIME":
      return "Toàn thời gian";
    case "PART_TIME":
      return "Bán thời gian";
    case "CONTRACT":
      return "Hợp đồng";
    case "INTERNSHIP":
      return "Thực tập";
    case "TEMPORARY":
      return "Thời vụ";
    default:
      return value ?? "Việc làm";
  }
}

function badgeClass(job: JobItem) {
  if (job.badgeTone === "success") return "career-badge career-badge--success";
  if (job.badgeTone === "warning") return "career-badge career-badge--warning";
  return "career-badge";
}

/**
 * Public, unauthenticated job discovery (UC-CAN-07, UC-CAN-08, UC-CAN-09).
 * This is the single job search for guests and candidates: the guest catalogue is
 * the default, and entering a keyword reveals the two-column reading layout.
 */
export function PublicJobsView({
  search,
  workspace: inWorkspace = false,
}: {
  search: JobSearchParams;
  workspace?: boolean;
}) {
  const navigate = useNavigate();
  const jobsPath = useJobsPath();
  const user = useAuthUser();
  const { isApplied } = useCandidate();
  const { workspace } = useCompanyWorkspace();
  const salaryBandBounds = (band?: string): { min?: number; max?: number } => {
    switch (band) {
      case "duoi-15":
        return { max: 15_000_000 };
      case "15-30":
        return { min: 15_000_000, max: 30_000_000 };
      case "30-50":
        return { min: 30_000_000, max: 50_000_000 };
      case "tren-50":
        return { min: 50_000_000 };
      default:
        return {};
    }
  };
  const salaryBounds = salaryBandBounds(search.salary);
  const publicJobSearch = useQuery({
    queryKey: [
      "public-job-search",
      user?.id ?? "anonymous",
      user?.activeMembership?.companyId ?? null,
      user?.activeMembership?.joinedAt ?? null,
      search.q ?? "",
      search.location ?? "",
      search.salaryMin ?? "",
      search.salaryMax ?? "",
      search.mode ?? "",
      search.employmentType ?? "",
      search.page ?? "",
    ],
    queryFn: () =>
      searchPublicJobs({
        keyword: search.q?.trim() || undefined,
        location: search.location?.trim() || undefined,
        employmentType: search.employmentType || undefined,
        workArrangement: (search.mode || "").toUpperCase() || undefined,
        salaryMin: search.salaryMin ? Number(search.salaryMin) : undefined,
        salaryMax: search.salaryMax ? Number(search.salaryMax) : undefined,
        page: Number.isFinite(Number(search.page)) ? Number(search.page) : 0,
        size: PAGE_SIZE,
      }),
    placeholderData: {
      content: [],
      pageNumber: 0,
      pageSize: PAGE_SIZE,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    },
  });
  const publicApiJobs =
    publicJobSearch.data?.content
      .map(toPublicJobItem)
      .filter((job): job is JobItem => Boolean(job)) ?? [];
  // UC-CAN-07: guest and candidate job search use the same backend postings.
  const jobs = publicApiJobs;

  const selectedBackendJobId = search.job && /^[1-9]\d*$/.test(search.job) ? search.job : undefined;
  const backendDetail = useQuery({
    queryKey: ["public-job", selectedBackendJobId ?? ""],
    queryFn: () =>
      apiRequest(`/jobs/${selectedBackendJobId}`, {
        cache: "no-store",
      }) as Promise<{ content: JobContent }>,
    enabled: Boolean(selectedBackendJobId),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  const backendJobItem = useMemo(() => {
    const content = backendDetail.data?.content;
    if (!selectedBackendJobId || !content) return undefined;
    const searchable = jobs.find((job) => job.id === selectedBackendJobId);
    const compensation = content.compensation;
    const hasSalary =
      Boolean(compensation?.disclosed) &&
      typeof compensation?.minimum === "number" &&
      typeof compensation?.maximum === "number";
    const salaryRange = hasSalary
      ? `${Math.round(compensation!.minimum!).toLocaleString("vi-VN").replace(/,/g, ".")} - ${Math.round(compensation!.maximum!).toLocaleString("vi-VN").replace(/,/g, ".")} ${compensation!.currency ?? "VND"} / ${(compensation!.payPeriod ?? "MONTH").toLowerCase()}`
      : (searchable?.salaryRange ?? "Thỏa thuận");
    const employmentType = employmentTypeLabel(content.employmentType);
    return {
      id: selectedBackendJobId,
      title: content.title ?? searchable?.title ?? "Tin tuyển dụng",
      company: searchable?.company ?? "Doanh nghiệp",
      location: content.location ?? searchable?.location ?? "Chưa cập nhật",
      salaryRange,
      badge: searchable?.badge ?? "Công ty đã xác thực",
      badgeTone: searchable?.badgeTone ?? "success",
      time: "Đang tuyển",
      department: employmentType,
      industry: searchable?.industry ?? "Chưa cập nhật",
      matchScore: 0,
      description: content.description ?? searchable?.description ?? "",
      requirements: [],
      statutoryBase: searchable?.statutoryBase ?? "Thông tin công khai từ tin tuyển dụng",
      statutoryNote:
        searchable?.statutoryNote ??
        "Kiểm tra kỹ điều khoản và điều kiện làm việc trước khi ứng tuyển.",
      suggestedRevision:
        searchable?.suggestedRevision ?? "Xem chi tiết để biết đầy đủ thông tin tuyển dụng.",
    };
  }, [backendDetail.data, jobs, selectedBackendJobId]);

  const [draftQuery, setDraftQuery] = useState(search.q ?? "");
  const [draftLocation, setDraftLocation] = useState(search.location ?? "");

  // The landing page links into this route with a fresh keyword; keep the form in sync.
  useEffect(() => setDraftQuery(search.q ?? ""), [search.q]);
  useEffect(() => setDraftLocation(search.location ?? ""), [search.location]);

  const update = (patch: JobSearchParams) => {
    void navigate({
      to: jobsPath,
      search: jobSearch({ ...search, ...patch }),
      replace: true,
      // Keep the visitor where they are: filtering must not throw them back to the hero.
      resetScroll: false,
    });
  };
  const resetFilters = () =>
    update({
      q: "",
      location: "",
      industry: "",
      salary: "",
      salaryMin: "",
      salaryMax: "",
      mode: "",
      page: "",
    });
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ q: draftQuery.trim(), location: draftLocation, page: "" });
  };

  const activeJob = search.job ? jobs.find((job) => job.id === search.job) : undefined;
  const jobMissing = Boolean(search.job) && !activeJob;
  const appliedFor = (jobId: string) =>
    isApplied(jobId) ||
    workspace.applications.some(
      (application) =>
        application.jobId === jobId && application.email === user?.email.toLowerCase(),
    );

  const Content = inWorkspace ? "div" : "main";
  const content = (
    <div className="career-site guardian-job-browser">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      {!inWorkspace && <Header variant="landing" />}
      <Content id="main-content">
        {selectedBackendJobId ? (
          backendDetail.isFetching ? (
            <section className="career-container career-detail">
              <p role="status">Đang tải tin tuyển dụng…</p>
            </section>
          ) : backendDetail.isError ? (
            backendDetail.error instanceof ApiError && backendDetail.error.status === 404 ? (
              <MissingJob search={search} jobs={jobs} />
            ) : (
              <section className="career-container career-detail">
                <p role="alert">Không thể tải tin tuyển dụng. Vui lòng thử lại.</p>
                <button className="career-button" onClick={() => void backendDetail.refetch()}>
                  Thử tải lại
                </button>
              </section>
            )
          ) : backendJobItem ? (
            <JobDetail
              key={selectedBackendJobId}
              job={backendJobItem}
              search={search}
              signedIn={Boolean(user)}
              applied={appliedFor(backendJobItem.id)}
              jobs={jobs}
            />
          ) : (
            <MissingJob search={search} jobs={jobs} />
          )
        ) : activeJob ? (
          <JobDetail
            job={activeJob}
            search={search}
            signedIn={Boolean(user)}
            applied={appliedFor(activeJob.id)}
            jobs={jobs}
          />
        ) : jobMissing ? (
          <MissingJob search={search} jobs={jobs} />
        ) : (
          <>
            <section className="career-discovery__head">
              <div className="career-container">
                <div className="career-discovery__intro">
                  <div>
                    <h1>Tìm việc làm</h1>
                    <p className="career-discovery__lede">
                      Tìm theo vị trí, kỹ năng, công ty, ngành nghề và địa điểm trên toàn quốc. Xem
                      đầy đủ mô tả, mức lương và điều kiện làm việc trước khi quyết định ứng tuyển.
                    </p>
                  </div>
                </div>

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
                    <span className="sr-only">Địa điểm</span>
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
                    <Search size={19} />
                    Tìm việc ngay
                  </button>
                </form>

                <div className="career-popular">
                  <span>Tìm kiếm phổ biến:</span>
                  {POPULAR_QUERIES.map((query) => (
                    <button
                      key={query}
                      type="button"
                      onClick={() => update({ q: query, job: "", page: "" })}
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {publicJobSearch.isError && jobs.length === 0 ? (
              <section className="career-empty" role="alert">
                <SearchX size={40} aria-hidden="true" />
                <h2>Không thể tải danh sách việc làm</h2>
                <p>Vui lòng kiểm tra kết nối và thử lại.</p>
                <div className="career-empty__actions">
                  <button
                    type="button"
                    className="career-button"
                    onClick={() => void publicJobSearch.refetch()}
                  >
                    Thử tải lại
                  </button>
                </div>
              </section>
            ) : (
              <Results
                search={search}
                update={update}
                resetFilters={resetFilters}
                jobs={jobs}
                signedIn={Boolean(user)}
                applied={appliedFor}
                remotePagination={
                  user
                    ? undefined
                    : {
                        pageNumber: publicJobSearch.data?.pageNumber ?? 0,
                        totalPages: publicJobSearch.data?.totalPages ?? 1,
                        totalElements: publicJobSearch.data?.totalElements ?? jobs.length,
                      }
                }
              />
            )}
          </>
        )}
      </Content>
      {!inWorkspace && <Footer />}
    </div>
  );
  return inWorkspace ? (
    <AdminShell title="Tìm việc làm" role="candidate">
      {content}
    </AdminShell>
  ) : (
    content
  );
}

/**
 * One listing item, shared by the guest catalogue and the two-column layout so the
 * job card reads identically in both. The title always opens the full detail page.
 */
function JobCard({
  job,
  search,
  active,
  onSelect,
}: {
  job: JobItem;
  search: JobSearchParams;
  active?: boolean;
  onSelect: () => void;
}) {
  const jobsPath = useJobsPath();
  return (
    <article
      className={`career-job career-job--interactive${active ? " is-active" : ""} min-w-0`}
      aria-current={active ? "true" : undefined}
      onClick={onSelect}
    >
      <div className="career-job__company min-w-0">
        <CompanyMark name={job.company} />
        <span className="min-w-0 truncate">{job.company}</span>
        <span className={`${badgeClass(job)} shrink-0`}>{badgeLabel(job.badge)}</span>
        <ArrowRight size={18} className="career-job__arrow shrink-0" aria-hidden="true" />
      </div>
      <h3 className="min-w-0">
        <Link
          to={jobsPath}
          search={jobSearch({ ...search, job: job.id })}
          className="career-job__link line-clamp-2 break-words"
          aria-label={`${job.title} — ${job.company}`}
          onClick={(event) => event.stopPropagation()}
        >
          {job.title}
        </Link>
      </h3>
      <p className="career-job__salary break-words">{job.salaryRange}</p>
      <p className="career-job__location min-w-0 break-words">
        <MapPin size={15} aria-hidden="true" className="shrink-0" />
        {job.location}
      </p>
      <div className="career-job__bottom min-w-0">
        <span className="min-w-0 truncate">
          {job.department} · {WORK_MODE_LABELS[workModeOf(job)]}
        </span>
        <span className="shrink-0" aria-hidden="true">
          Xem chi tiết
        </span>
      </div>
    </article>
  );
}

function Results({
  search,
  update,
  resetFilters,
  jobs,
  signedIn,
  applied,
  remotePagination,
}: {
  search: JobSearchParams;
  update: (patch: JobSearchParams) => void;
  resetFilters: () => void;
  jobs: JobItem[];
  signedIn: boolean;
  applied: (jobId: string) => boolean;
  remotePagination?: {
    pageNumber: number;
    totalPages: number;
    totalElements: number;
  };
}) {
  const filtered = signedIn ? filterJobs(jobs, search) : jobs;
  const requestedPage = Number.parseInt(search.page ?? "0", 10);
  const clientPagination = paginateItems(
    filtered,
    Number.isFinite(requestedPage) ? requestedPage : 0,
    PAGE_SIZE,
  );
  const pagination = remotePagination
    ? {
        page: remotePagination.pageNumber ?? 0,
        totalPages: Math.max(1, remotePagination.totalPages ?? 1),
        totalItems: remotePagination.totalElements ?? jobs.length,
        items: filtered,
        start: 0,
      }
    : clientPagination;
  const filtersActive = hasActiveFilters(search);
  const panelFiltersActive = Boolean(
    search.salaryMin || search.salaryMax || search.mode || search.employmentType || search.industry,
  );
  // Backend postings do not carry industry/experience metadata, so those sample-only filters are hidden.
  // The guest catalogue is the default; a keyword opens the list + detail layout,
  // and the filter panel only joins once there is a keyword to refine.
  const splitView = Boolean(search.q?.trim());
  const showFilters = splitView || panelFiltersActive;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const salaryFilterActive = Boolean(search.salaryMin || search.salaryMax);
  useEffect(() => {
    if (salaryFilterActive) setSalaryOpen(true);
  }, [salaryFilterActive]);

  const salaryMinMillions = Math.min(
    100,
    Math.max(0, Math.round(Number(search.salaryMin ?? 0) / 1_000_000)),
  );
  const salaryRawMax = Number(search.salaryMax ?? 0) / 1_000_000;
  const salaryUpperMillions =
    salaryRawMax <= 0 ? 100 : Math.min(100, Math.max(0, Math.round(salaryRawMax)));
  const salaryValueMin = Math.min(salaryMinMillions, salaryUpperMillions);
  const salaryValueMax = Math.max(salaryMinMillions, salaryUpperMillions);
  const salarySummary =
    salaryValueMin === 0 && salaryValueMax >= 100
      ? "Mọi mức lương"
      : salaryValueMin > 0 && salaryValueMax >= 100
        ? `Từ ${salaryValueMin} triệu trở lên`
        : salaryValueMin === 0 && salaryValueMax < 100
          ? `Đến ${salaryValueMax} triệu`
          : `${salaryValueMin} – ${salaryValueMax} triệu`;
  const detailRef = useRef<HTMLDivElement>(null);
  const activeJob = splitView
    ? (pagination.items.find((job) => job.id === selectedId) ?? pagination.items[0])
    : undefined;

  const selectJob = (jobId: string) => {
    setSelectedId(jobId);
    if (!window.matchMedia("(max-width: 950px)").matches) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "start", behavior }));
  };

  return (
    <section className="career-container career-discovery" aria-labelledby="results-title">
      <div className="career-results-head">
        <h2 id="results-title">Danh sách việc làm</h2>
        <p className="career-results-count" aria-live="polite">
          {pagination.totalItems} tin đang hoạt động
        </p>
      </div>

      {showFilters && (
        <div className="career-discovery__filters" role="group" aria-label="Bộ lọc việc làm">
          <span className="career-discovery__filters-label">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Lọc
          </span>
          <div className="career-filter career-filter--salary">
            <span>Mức lương (triệu VND)</span>
            <Popover open={salaryOpen} onOpenChange={setSalaryOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-full min-h-[44px] items-center justify-between gap-2 border border-rule rounded-[8px] bg-paper-2 px-2.5 py-2 text-[14px] text-ink transition-colors hover:border-rule-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  aria-expanded={salaryOpen}
                >
                  <span className="inline-flex items-center gap-2 text-ink-2">
                    <Banknote size={15} aria-hidden="true" className="text-accent" />
                    {salarySummary}
                  </span>
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className={`text-ink-3 transition-transform ${salaryOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={8}
                className="w-80 border-rule bg-paper p-3 shadow-lg"
              >
                <div id="salary-slider-panel" className="career-salary-range space-y-2">
                  {(() => {
                    const minMillions = Math.min(
                      100,
                      Math.max(0, Math.round(Number(search.salaryMin ?? 0) / 1_000_000)),
                    );
                    const rawMax = Number(search.salaryMax ?? 0) / 1_000_000;
                    const upperMillions =
                      rawMax <= 0 ? 100 : Math.min(100, Math.max(0, Math.round(rawMax)));
                    const valueMin = Math.min(minMillions, upperMillions);
                    const valueMax = Math.max(minMillions, upperMillions);

                    const commit = (next: number[]) => {
                      const [nextMin, nextMax] = next;
                      update({
                        salaryMin: nextMin > 0 ? String(nextMin * 1_000_000) : "",
                        salaryMax: nextMax >= 100 ? "" : String(nextMax * 1_000_000),
                        job: "",
                        page: "",
                      });
                    };

                    return (
                      <>
                        <SliderPrimitive.Root
                          className="relative flex w-full touch-none select-none items-center py-2"
                          min={0}
                          max={100}
                          step={5}
                          minStepsBetweenThumbs={1}
                          value={[valueMin, valueMax]}
                          onValueChange={commit}
                          aria-label="Mức lương theo triệu VND"
                        >
                          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-rule">
                            <SliderPrimitive.Range className="absolute h-full bg-accent" />
                          </SliderPrimitive.Track>
                          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-accent bg-paper shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper" />
                          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-accent bg-paper shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper" />
                        </SliderPrimitive.Root>
                        <div
                          className="flex justify-between text-[11px] font-medium tabular-nums text-ink-3"
                          aria-hidden="true"
                        >
                          <span>0</span>
                          <span>25</span>
                          <span>50</span>
                          <span>75</span>
                          <span>100+</span>
                        </div>
                        <div
                          className="flex items-center justify-between gap-2 text-xs font-semibold tabular-nums text-ink"
                          aria-hidden="true"
                        >
                          <span className="rounded-md border border-rule bg-paper-2 px-2 py-0.5">
                            {valueMin === 0 ? "0 tr" : `${valueMin} tr`}
                          </span>
                          <span className="text-ink-3">–</span>
                          <span className="rounded-md border border-rule bg-paper-2 px-2 py-0.5">
                            {valueMax >= 100 ? "100+ tr" : `${valueMax} tr`}
                          </span>
                        </div>
                        <output className="inline-flex items-center gap-1.5 self-start rounded-full border border-rule bg-paper-2 px-3 py-1 text-xs font-semibold text-ink transition-colors">
                          <Banknote size={13} aria-hidden="true" className="text-accent" />
                          {salarySummary}
                        </output>
                      </>
                    );
                  })()}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <label className="career-filter">
            <span>Hình thức làm việc từ xa</span>
            <select
              value={search.mode ?? ""}
              onChange={(event) => update({ mode: event.target.value, job: "", page: "" })}
            >
              {WORK_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <label className="career-filter">
            <span>Loại công việc</span>
            <select
              value={search.employmentType ?? ""}
              onChange={(event) =>
                update({ employmentType: event.target.value, job: "", page: "" })
              }
            >
              <option value="">Mọi loại</option>
              <option value="FULL_TIME">Toàn thời gian</option>
              <option value="PART_TIME">Bán thời gian</option>
              <option value="CONTRACT">Hợp đồng</option>
              <option value="INTERNSHIP">Thực tập</option>
              <option value="TEMPORARY">Tạm thời</option>
            </select>
          </label>
          {filtersActive && pagination.items.length > 0 && (
            <button type="button" className="career-filter__reset" onClick={resetFilters}>
              Xóa bộ lọc
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="career-results-meta">
        <p
          className={pagination.totalItems > 0 ? "career-results-count" : "sr-only"}
          aria-live="polite"
        >
          {pagination.items.length > 0
            ? `Đang hiển thị ${pagination.items.length} trên ${pagination.totalItems} tin tuyển dụng${filtersActive ? " phù hợp bộ lọc" : ""}`
            : `${pagination.totalItems} tin tuyển dụng đang hoạt động`}
        </p>
      </div>

      {pagination.items.length > 0 ? (
        <>
          {splitView ? (
            <div className="career-split">
              <ul className="career-split__stack" aria-label="Danh sách việc làm">
                {pagination.items.map((job) => (
                  <li key={job.id}>
                    <JobCard
                      job={job}
                      search={search}
                      active={job.id === activeJob?.id}
                      onSelect={() => selectJob(job.id)}
                    />
                  </li>
                ))}
              </ul>

              {activeJob && (
                <div ref={detailRef} className="career-split__detail">
                  <JobDetail
                    job={activeJob}
                    search={search}
                    signedIn={signedIn}
                    applied={applied(activeJob.id)}
                    jobs={jobs}
                    embedded
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="career-job-grid">
              {pagination.items.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  search={search}
                  onSelect={() => update({ job: job.id })}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <nav className="career-pagination" aria-label="Phân trang kết quả">
              <button
                type="button"
                aria-label="Trang trước"
                disabled={pagination.page === 0}
                onClick={() => update({ page: String(pagination.page - 1) })}
              >
                <span className="career-pagination__full">Trang trước</span>
                <span className="career-pagination__short" aria-hidden="true">
                  Trước
                </span>
              </button>
              <div className="career-pagination__pages">
                {Array.from({ length: pagination.totalPages }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-current={pagination.page === index ? "page" : undefined}
                    aria-label={`Trang ${index + 1}`}
                    onClick={() => update({ page: String(index) })}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="Trang sau"
                disabled={pagination.page >= pagination.totalPages - 1}
                onClick={() => update({ page: String(pagination.page + 1) })}
              >
                <span className="career-pagination__full">Trang sau</span>
                <span className="career-pagination__short" aria-hidden="true">
                  Sau
                </span>
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="career-empty">
          <SearchX size={40} aria-hidden="true" />
          <h2>Không tìm thấy tin tuyển dụng nào phù hợp</h2>
          <p>
            Thử bỏ bớt bộ lọc, chọn địa điểm rộng hơn hoặc dùng từ khóa ngắn hơn như “kế toán”,
            “kinh doanh”, “React”.
          </p>
          <div className="career-empty__actions">
            <button type="button" className="career-button" onClick={resetFilters}>
              Xóa bộ lọc
            </button>
            {POPULAR_QUERIES.map((query) => (
              <button
                key={query}
                type="button"
                className="career-chip"
                onClick={() => update({ q: query, location: "", industry: "", page: "" })}
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function JobDetail({
  job,
  search,
  signedIn,
  applied,
  jobs,
  embedded = false,
}: {
  job: JobItem;
  search: JobSearchParams;
  signedIn: boolean;
  applied: boolean;
  jobs: JobItem[];
  embedded?: boolean;
}) {
  const navigate = useNavigate();
  const jobsPath = useJobsPath();
  const similar = embedded ? [] : similarJobs(jobs, job);
  const applyHref = `/can/jobs/apply?job=${encodeURIComponent(job.id)}`;

  return (
    <article
      className={embedded ? "career-detail career-detail--pane" : "career-container career-detail"}
    >
      {!embedded && (
        <Link
          to={jobsPath}
          search={jobSearch({ ...search, job: "", page: search.page ?? "" })}
          className="career-text-link career-back"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Danh sách việc làm
        </Link>
      )}

      <div className="career-detail__layout">
        <div className="career-detail__sheet">
          <header className="career-detail__header">
            <div className="career-detail__company">
              <CompanyMark name={job.company} />
              <div>
                <p>{job.company}</p>
                <span className={badgeClass(job)}>{badgeLabel(job.badge)}</span>
              </div>
            </div>
            <h1 className="break-words">{job.title}</h1>
            <ul className="career-detail__meta">
              <li>
                <Banknote size={17} aria-hidden="true" />
                <strong className="break-words">{job.salaryRange}</strong>
              </li>
              <li>
                <MapPin size={17} aria-hidden="true" />
                {job.location}
              </li>
              <li>
                <BriefcaseBusiness size={17} aria-hidden="true" />
                {job.department}
              </li>
              <li>
                <CalendarClock size={17} aria-hidden="true" />
                {job.time}
              </li>
            </ul>
          </header>

          <div className="career-detail__main">
            <section aria-labelledby="detail-description">
              <h2 id="detail-description">Mô tả công việc</h2>
              <JobDescription value={job.description} />
            </section>

            <section aria-labelledby="detail-requirements">
              <h2 id="detail-requirements">Yêu cầu ứng viên</h2>
              {job.requirements.length ? (
                <ul>
                  {job.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              ) : (
                <p>Nhà tuyển dụng chưa công bố yêu cầu chi tiết cho vị trí này.</p>
              )}
            </section>

            <section aria-labelledby="detail-verification">
              <h2 id="detail-verification" className="career-detail__note-title">
                <ShieldCheck size={17} aria-hidden="true" />
                Ghi chú kiểm định
              </h2>
              <div className="career-detail__note">
                <p>{job.statutoryNote}</p>
                <p>{job.suggestedRevision}</p>
              </div>
            </section>
          </div>
        </div>

        <aside className="career-detail__aside">
          <div className="career-apply-card">
            <h2>Ứng tuyển vị trí này</h2>
            {signedIn ? (
              applied ? (
                <>
                  <p>Hồ sơ của bạn đã được gửi tới nhà tuyển dụng cho vị trí này.</p>
                  <span className="career-applied-state">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    Đã nộp hồ sơ
                  </span>
                </>
              ) : (
                <>
                  <p>Mở hồ sơ ứng viên để chọn CV và gửi đơn cho vị trí này.</p>
                  <Link to="/can/jobs/apply" search={{ job: job.id }} className="career-button">
                    Ứng tuyển ngay
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </>
              )
            ) : (
              <>
                <p>
                  Bạn cần đăng nhập để nộp hồ sơ. Việc xem tin tuyển dụng không yêu cầu tài khoản.
                </p>
                <Link
                  to="/login"
                  search={{ role: "candidate", next: applyHref }}
                  className="career-button"
                >
                  Đăng nhập để ứng tuyển
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  to="/register"
                  search={{ role: "candidate" }}
                  className="career-button career-button--outline"
                >
                  Tạo tài khoản mới
                </Link>
              </>
            )}
            <p className="career-apply-card__note">
              <ShieldCheck size={16} aria-hidden="true" />
              {signedIn
                ? "Đơn ứng tuyển được gửi trực tiếp tới nhà tuyển dụng."
                : "Nộp hồ sơ chỉ dành cho ứng viên đã đăng nhập."}
            </p>
          </div>

          <div className="career-facts">
            <h2>Thông tin chung</h2>
            <dl>
              <div>
                <dt>Doanh nghiệp</dt>
                <dd>{job.company}</dd>
              </div>
              <div>
                <dt>Ngành nghề</dt>
                <dd>{job.industry ?? job.department}</dd>
              </div>
              <div>
                <dt>Hình thức</dt>
                <dd>{WORK_MODE_LABELS[workModeOf(job)]}</dd>
              </div>
              <div>
                <dt>Địa điểm</dt>
                <dd>{job.location}</dd>
              </div>
              <div>
                <dt>Hạn nộp hồ sơ</dt>
                <dd>Chưa công bố</dd>
              </div>
              <div>
                <dt>Mã tin</dt>
                <dd>#{job.id.toUpperCase()}</dd>
              </div>
            </dl>
            <div className="career-facts__statutory">
              <Building2 size={16} aria-hidden="true" />
              <p>{job.statutoryBase}</p>
            </div>
            <p className="career-data-note">
              Danh sách có tin minh họa. Huy hiệu mẫu không phải kết quả kiểm định thực tế.
            </p>
          </div>
        </aside>
      </div>

      {!embedded && similar.length > 0 && (
        <section className="career-similar" aria-labelledby="similar-title">
          <h2 id="similar-title">Việc làm tương tự</h2>
          <div className="career-job-grid">
            {similar.map((related) => (
              <JobCard
                key={related.id}
                job={related}
                search={search}
                onSelect={() =>
                  void navigate({
                    to: jobsPath,
                    search: jobSearch({ ...search, job: related.id }),
                    resetScroll: false,
                  })
                }
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function MissingJob({ search, jobs }: { search: JobSearchParams; jobs: JobItem[] }) {
  const navigate = useNavigate();
  const jobsPath = useJobsPath();
  const suggestions = jobs.filter((job) => !isSampleListing(job)).slice(0, 3);
  return (
    <section className="career-container career-detail">
      <Link
        to={jobsPath}
        search={jobSearch({ ...search, job: "" })}
        className="career-text-link career-back"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Danh sách việc làm
      </Link>
      <div className="career-empty">
        <SearchX size={40} aria-hidden="true" />
        <h1>Tin tuyển dụng không còn khả dụng</h1>
        <p>Bạn có thể tiếp tục tìm kiếm các việc làm khác.</p>
        <div className="career-empty__actions">
          <Link
            to={jobsPath}
            search={jobSearch({ ...search, job: "", page: "" })}
            className="career-button"
          >
            Xem tất cả việc làm
          </Link>
        </div>
      </div>
      {suggestions.length > 0 && (
        <section className="career-similar" aria-labelledby="missing-similar-title">
          <h2 id="missing-similar-title">Việc làm khác</h2>
          <div className="career-job-grid">
            {suggestions.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                search={search}
                onSelect={() =>
                  void navigate({
                    to: jobsPath,
                    search: jobSearch({ ...search, job: job.id }),
                    resetScroll: false,
                  })
                }
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
