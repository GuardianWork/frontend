import { authenticatedRequest } from "./auth.ts";
import { ApiError } from "./api.ts";

export interface ApplicationFormPrefill {
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export interface SubmittedApplication {
  id: string;
  jobId: number;
  jobTitle: string;
  companyId: number;
  companyName: string;
  status: string;
  appliedAt: string;
  cvFileName: string;
  version: number;
  candidateFeedback: string;
  /** Empty until the applicant endpoint returns the job's published location. */
  location: string;
  /** Empty until the endpoint returns a work mode; raw backend values are tolerated. */
  workMode: string;
  /** ISO date or date-time; empty when the posting has no application deadline. */
  deadline: string;
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseSubmittedApplication(value: unknown): SubmittedApplication {
  const application = value as Partial<SubmittedApplication> & {
    workArrangement?: unknown;
    applicationDeadline?: unknown;
    jobLocation?: unknown;
    workLocation?: unknown;
    workType?: unknown;
    employmentType?: unknown;
    deadlineDate?: unknown;
    applicationDeadlineDate?: unknown;
    cvFile?: unknown;
    resumeFileName?: unknown;
    company?: unknown;
    title?: unknown;
    job?: { id?: unknown };
  };
  if (!application || typeof application.id !== "string") {
    throw new ApiError("Phản hồi đơn ứng tuyển không hợp lệ. Vui lòng thử lại.", 500);
  }
  // The applicant endpoint is being extended with the job snapshot. Read the
  // documented names first, keep the public-job spellings as fallbacks, and
  // leave ambiguous values empty so the card can show an explicit placeholder.
  const location = textValue(
    application.location ?? application.jobLocation ?? application.workLocation,
  );
  const workMode = textValue(
    application.workMode ??
      application.workArrangement ??
      application.workType ??
      application.employmentType,
  );
  const deadline = textValue(
    application.deadline ??
      application.applicationDeadline ??
      application.deadlineDate ??
      application.applicationDeadlineDate,
  );
  const cvFileName = textValue(
    application.cvFileName ?? application.cvFile ?? application.resumeFileName,
  );
  const companyName = textValue(application.companyName ?? application.company);
  const jobTitle = textValue(application.jobTitle ?? application.title);
  return {
    id: String(application.id),
    jobId: Number(application.jobId ?? 0),
    jobTitle,
    companyId: Number(application.companyId ?? 0),
    companyName,
    status: String(application.status ?? "SUBMITTED"),
    appliedAt: String(application.appliedAt ?? new Date().toISOString()),
    cvFileName,
    version: Number(application.version ?? 0),
    candidateFeedback: textValue(application.candidateFeedback),
    location,
    workMode,
    deadline,
  };
}

export interface SubmitApplicationInput {
  jobId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  coverLetter?: string | null;
  cvId: string;
}

export const CANDIDATE_APPLICATION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEWING",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
  "INACTIVE",
] as const;

export type CandidateApplicationStatus = (typeof CANDIDATE_APPLICATION_STATUSES)[number];

export interface CandidateApplicationPage {
  items: SubmittedApplication[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface CandidateApplicationQuery {
  search?: string;
  status?: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

const APPLICATION_PAGE_SIZE = 20;
const MAX_APPLICATION_PAGE_SIZE = 100;
const MAX_APPLICATION_SEARCH_LENGTH = 150;

/** The list endpoint moved to a PageResponse; older deployments still return an array. */
function applicationItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { content?: unknown }).content))
    return (value as { content: unknown[] }).content;
  return [];
}

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

/** Applies the server filters locally for deployments that still answer with a plain array. */
function filterApplicationsLocally(
  applications: SubmittedApplication[],
  search: string,
  status: string,
) {
  const term = normalizeSearch(search.trim());
  return applications.filter((application) => {
    if (status && application.status !== status) return false;
    if (!term) return true;
    return (
      normalizeSearch(application.jobTitle).includes(term) ||
      normalizeSearch(application.companyName).includes(term)
    );
  });
}

function boundedInteger(value: number | undefined, fallback: number, maximum: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(0, Math.trunc(value as number)));
}

export function parseApplicationPage(
  value: unknown,
  query: Pick<CandidateApplicationQuery, "search" | "status" | "page" | "size"> = {},
): CandidateApplicationPage {
  const requestedPage = boundedInteger(query.page, 0, Number.MAX_SAFE_INTEGER);
  const requestedSize = Math.max(
    1,
    boundedInteger(query.size, APPLICATION_PAGE_SIZE, MAX_APPLICATION_PAGE_SIZE),
  );
  const search = (query.search ?? "").trim();
  const status = query.status ?? "";

  if (Array.isArray(value)) {
    const filtered = filterApplicationsLocally(
      value.map(parseSubmittedApplication),
      search,
      status,
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / requestedSize));
    const pageNumber = Math.min(requestedPage, totalPages - 1);
    const start = pageNumber * requestedSize;
    return {
      items: filtered.slice(start, start + requestedSize),
      pageNumber,
      pageSize: requestedSize,
      totalElements: filtered.length,
      totalPages,
    };
  }

  const page = value as {
    content?: unknown;
    pageNumber?: unknown;
    pageSize?: unknown;
    totalElements?: unknown;
    totalPages?: unknown;
  } | null;
  if (!page || typeof page !== "object" || !Array.isArray(page.content)) {
    throw new ApiError("Phản hồi danh sách đơn ứng tuyển không hợp lệ. Vui lòng thử lại.", 500);
  }
  const totalElements = Math.max(0, Number(page.totalElements ?? page.content.length) || 0);
  const pageSize = Math.max(1, Number(page.pageSize ?? requestedSize) || requestedSize);
  return {
    items: page.content.map(parseSubmittedApplication),
    pageNumber: Math.max(0, Number(page.pageNumber ?? requestedPage) || 0),
    pageSize,
    totalElements,
    totalPages: Math.max(1, Number(page.totalPages ?? Math.ceil(totalElements / pageSize)) || 1),
  };
}

export async function listApplications(): Promise<SubmittedApplication[]> {
  const data = await authenticatedRequest("/candidate/applications");
  return applicationItems(data).map(parseSubmittedApplication).map(candidateVisibleApplication);
}

async function requestApplicationPage(
  query: CandidateApplicationQuery = {},
): Promise<CandidateApplicationPage> {
  const search = (query.search ?? "").trim().slice(0, MAX_APPLICATION_SEARCH_LENGTH);
  const page = boundedInteger(query.page, 0, Number.MAX_SAFE_INTEGER);
  const size = Math.max(
    1,
    boundedInteger(query.size, APPLICATION_PAGE_SIZE, MAX_APPLICATION_PAGE_SIZE),
  );
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  params.set("page", String(page));
  params.set("size", String(size));

  const data = await authenticatedRequest(`/candidate/applications?${params.toString()}`, {
    signal: query.signal,
  });
  return parseApplicationPage(data, { search, status: query.status, page, size });
}

// Shortlisting is an internal Recruiter decision, presented as continued review.
function candidateVisibleStatus(status: string) {
  return status === "SHORTLISTED" ? "UNDER_REVIEW" : status;
}
function candidateVisibleApplication(application: SubmittedApplication): SubmittedApplication {
  return { ...application, status: candidateVisibleStatus(application.status) };
}

export async function listApplicationPage(
  query: CandidateApplicationQuery = {},
): Promise<CandidateApplicationPage> {
  if (query.status !== "UNDER_REVIEW") {
    const page = await requestApplicationPage(query);
    return { ...page, items: page.items.map(candidateVisibleApplication) };
  }
  // The backend filters by one internal status. Merge both streams before paginating
  // so shortlisted Applications remain discoverable under the visible review filter.
  const size = Math.max(
    1,
    boundedInteger(query.size, APPLICATION_PAGE_SIZE, MAX_APPLICATION_PAGE_SIZE),
  );
  const firstPages = await Promise.all(
    ["UNDER_REVIEW", "SHORTLISTED"].map((status) =>
      requestApplicationPage({ ...query, status, page: 0, size }),
    ),
  );
  const totalElements = firstPages.reduce((sum, page) => sum + page.totalElements, 0);
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const pageNumber = Math.min(
    boundedInteger(query.page, 0, Number.MAX_SAFE_INTEGER),
    totalPages - 1,
  );
  const end = (pageNumber + 1) * size;
  const streams = await Promise.all(
    firstPages.map(async (first, index) => {
      const pages = [first];
      // Fetch only the prefix that could contribute to this merged page.
      for (
        let page = 1;
        page < Math.min(first.totalPages, Math.ceil(end / first.pageSize));
        page++
      ) {
        pages.push(
          await requestApplicationPage({
            ...query,
            status: index === 0 ? "UNDER_REVIEW" : "SHORTLISTED",
            page,
            size,
          }),
        );
      }
      return pages.flatMap((page) => page.items);
    }),
  );
  const items = streams
    .flat()
    .sort((a, b) => Date.parse(b.appliedAt) - Date.parse(a.appliedAt) || b.id.localeCompare(a.id));
  return {
    items: items.slice(pageNumber * size, end).map(candidateVisibleApplication),
    pageNumber,
    pageSize: size,
    totalElements,
    totalPages,
  };
}

/** Scan size used to locate one application; the endpoint accepts up to 100. */
const LOCATE_PAGE_SIZE = MAX_APPLICATION_PAGE_SIZE;
/** Bound the scan so a missing id cannot walk the whole ledger. */
const MAX_LOCATE_REQUESTS = 10;

/** Ledger page that holds the wanted application, plus its position in the ledger. */
export interface CandidateApplicationLocation {
  /** Zero-based page of the ledger when it is read at the requested page size. */
  page: number;
  /** Zero-based position in the newest-first ledger. */
  index: number;
}

/**
 * Find the ledger page that holds one application.
 *
 * A notification links to a single application, but the ledger is paged and that
 * application may sit on any page. The list endpoint is ordered newest-first with
 * a stable tie-break, so scanning larger pages yields an index that divides back
 * into the displayed page size without walking every page. Returns `null` when
 * the application is not in the ledger at all — the posting may be suspended.
 */
export async function locateApplicationPage(
  id: string,
  options: { pageSize: number; signal?: AbortSignal },
): Promise<CandidateApplicationLocation | null> {
  const wanted = id.trim();
  const pageSize = Math.max(1, Math.trunc(options.pageSize) || 1);
  if (!wanted) return null;
  for (let scan = 0; scan < MAX_LOCATE_REQUESTS; scan += 1) {
    const result = await requestApplicationPage({
      page: scan,
      size: LOCATE_PAGE_SIZE,
      signal: options.signal,
    });
    const offset = result.items.findIndex((application) => application.id === wanted);
    if (offset !== -1) {
      const index = result.pageSize * result.pageNumber + offset;
      return { page: Math.floor(index / pageSize), index };
    }
    if (result.pageNumber + 1 >= result.totalPages) return null;
  }
  return null;
}

/**
 * Find the Candidate's application for one posting.
 *
 * The ledger is newest-first and only exposes paged reads, so an older application
 * can sit past the default first page. Scan at the endpoint's maximum page size
 * and stop on the first match. Every status counts: the backend refuses a second
 * application for the same job even after a withdrawal.
 */
export async function findApplicationForJob(
  jobId: string | number,
  options: { signal?: AbortSignal } = {},
): Promise<SubmittedApplication | null> {
  const wanted = String(jobId).trim();
  if (!wanted) return null;
  for (let scan = 0; scan < MAX_LOCATE_REQUESTS; scan += 1) {
    const result = await requestApplicationPage({
      page: scan,
      size: LOCATE_PAGE_SIZE,
      signal: options.signal,
    });
    const match = result.items.find((application) => String(application.jobId) === wanted);
    if (match) return candidateVisibleApplication(match);
    if (result.pageNumber + 1 >= result.totalPages) return null;
  }
  return null;
}

export interface CandidateApplicationCounts {
  all: number;
  submitted: number;
  underReview: number;
  interviewing: number;
  hired: number;
  rejected: number;
  withdrawn: number;
  inactive: number;
}

export interface CandidateApplicationCountOptions {
  search?: string;
  signal?: AbortSignal;
}

/**
 * The list endpoint returns one total per filtered request. Nine size-one reads
 * give the status tabs exact counts without downloading the application rows again.
 */
export async function listApplicationCounts(
  options: CandidateApplicationCountOptions = {},
): Promise<CandidateApplicationCounts> {
  const search = options.search ?? "";
  const signal = options.signal;
  const [
    all,
    submitted,
    underReview,
    shortlisted,
    interviewing,
    hired,
    rejected,
    withdrawn,
    inactive,
  ] = await Promise.all([
    requestApplicationPage({ search, size: 1, signal }),
    requestApplicationPage({ search, size: 1, status: "SUBMITTED", signal }),
    requestApplicationPage({ search, size: 1, status: "UNDER_REVIEW", signal }),
    requestApplicationPage({ search, size: 1, status: "SHORTLISTED", signal }),
    requestApplicationPage({ search, size: 1, status: "INTERVIEWING", signal }),
    requestApplicationPage({ search, size: 1, status: "HIRED", signal }),
    requestApplicationPage({ search, size: 1, status: "REJECTED", signal }),
    requestApplicationPage({ search, size: 1, status: "WITHDRAWN", signal }),
    requestApplicationPage({ search, size: 1, status: "INACTIVE", signal }),
  ]);
  return {
    all: all.totalElements,
    submitted: submitted.totalElements,
    underReview: underReview.totalElements + shortlisted.totalElements,
    interviewing: interviewing.totalElements,
    hired: hired.totalElements,
    rejected: rejected.totalElements,
    withdrawn: withdrawn.totalElements,
    inactive: inactive.totalElements,
  };
}

export async function submitApplication(
  input: SubmitApplicationInput,
): Promise<SubmittedApplication> {
  const payload: Record<string, unknown> = {
    jobId: input.jobId,
    fullName: input.fullName,
    email: input.email,
    phoneNumber: input.phoneNumber,
    cvId: input.cvId,
  };
  if (input.coverLetter) payload.coverLetter = input.coverLetter;

  const data = await authenticatedRequest("/candidate/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseSubmittedApplication(data);
}

export interface CandidateApplicationHistory {
  toStatus: string;
  occurredAt: string;
  candidateFeedback?: string | null;
}
export interface CandidateApplicationDetail {
  id: string;
  status: string;
  version: number;
  cvFileName: string;
  /** Whether the Candidate can still download the submitted CV. */
  canViewCv: boolean;
  history: CandidateApplicationHistory[];
}

export interface CandidateCvDownloadUrl {
  url: string;
  expiresAt: string;
  fileName: string;
}
function parseCandidateDetail(value: unknown): CandidateApplicationDetail {
  const detail = value as CandidateApplicationDetail | null;
  if (
    !detail ||
    typeof detail.id !== "string" ||
    !CANDIDATE_APPLICATION_STATUSES.some((status) => status === detail.status) ||
    !Number.isSafeInteger(detail.version) ||
    detail.version < 0 ||
    !Array.isArray(detail.history) ||
    !detail.history.every(
      (event) =>
        event &&
        CANDIDATE_APPLICATION_STATUSES.some((status) => status === event.toStatus) &&
        typeof event.occurredAt === "string" &&
        Number.isFinite(Date.parse(event.occurredAt)) &&
        (event.candidateFeedback == null || typeof event.candidateFeedback === "string"),
    )
  ) {
    throw new ApiError("Phản hồi đơn ứng tuyển không hợp lệ. Vui lòng thử lại.", 500);
  }
  return {
    id: detail.id,
    status: candidateVisibleStatus(detail.status),
    version: detail.version,
    cvFileName: textValue(detail.cvFileName),
    canViewCv: detail.canViewCv === true,
    history: detail.history
      .map((event) => ({
        toStatus: candidateVisibleStatus(event.toStatus),
        occurredAt: event.occurredAt,
        candidateFeedback: event.candidateFeedback,
      }))
      .filter(
        (event, index, history) => index === 0 || event.toStatus !== history[index - 1].toStatus,
      ),
  };
}
export async function getCandidateApplication(
  id: string,
  signal?: AbortSignal,
): Promise<CandidateApplicationDetail> {
  return parseCandidateDetail(
    await authenticatedRequest(`/candidate/applications/${encodeURIComponent(id)}`, {
      signal,
      cache: "no-store",
    }),
  );
}
export async function withdrawApplication(
  id: string,
  version: number,
): Promise<CandidateApplicationDetail> {
  return parseCandidateDetail(
    await authenticatedRequest(`/candidate/applications/${encodeURIComponent(id)}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ version }),
      cache: "no-store",
    }),
  );
}

export async function getCandidateApplicationCvDownloadUrl(
  id: string,
  signal?: AbortSignal,
): Promise<CandidateCvDownloadUrl> {
  const data = await authenticatedRequest(
    `/candidate/applications/${encodeURIComponent(id)}/cv/download-url`,
    { signal, cache: "no-store" },
  );
  const value = data as Partial<CandidateCvDownloadUrl> | null;
  if (
    !value ||
    typeof value.url !== "string" ||
    !/^https?:\/\//i.test(value.url) ||
    typeof value.fileName !== "string" ||
    !value.fileName ||
    typeof value.expiresAt !== "string" ||
    !Number.isFinite(Date.parse(value.expiresAt))
  ) {
    throw new ApiError("Phản hồi liên kết tải CV không hợp lệ.", 500);
  }
  return { url: value.url, expiresAt: value.expiresAt, fileName: value.fileName };
}
