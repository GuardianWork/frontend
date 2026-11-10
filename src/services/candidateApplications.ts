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
  return applicationItems(data).map(parseSubmittedApplication);
}

export async function listApplicationPage(
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

export interface CandidateApplicationCounts {
  all: number;
  submitted: number;
  underReview: number;
  shortlisted: number;
  interviewing: number;
  hired: number;
  rejected: number;
  withdrawn: number;
}

export interface CandidateApplicationCountOptions {
  search?: string;
  signal?: AbortSignal;
}

/**
 * The list endpoint returns one total per filtered request. Eight size-one reads
 * give the status tabs exact counts without downloading the application rows again.
 */
export async function listApplicationCounts(
  options: CandidateApplicationCountOptions = {},
): Promise<CandidateApplicationCounts> {
  const search = options.search ?? "";
  const signal = options.signal;
  const [all, submitted, underReview, shortlisted, interviewing, hired, rejected, withdrawn] =
    await Promise.all([
      listApplicationPage({ search, size: 1, signal }),
      listApplicationPage({ search, size: 1, status: "SUBMITTED", signal }),
      listApplicationPage({ search, size: 1, status: "UNDER_REVIEW", signal }),
      listApplicationPage({ search, size: 1, status: "SHORTLISTED", signal }),
      listApplicationPage({ search, size: 1, status: "INTERVIEWING", signal }),
      listApplicationPage({ search, size: 1, status: "HIRED", signal }),
      listApplicationPage({ search, size: 1, status: "REJECTED", signal }),
      listApplicationPage({ search, size: 1, status: "WITHDRAWN", signal }),
    ]);
  return {
    all: all.totalElements,
    submitted: submitted.totalElements,
    underReview: underReview.totalElements,
    shortlisted: shortlisted.totalElements,
    interviewing: interviewing.totalElements,
    hired: hired.totalElements,
    rejected: rejected.totalElements,
    withdrawn: withdrawn.totalElements,
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
  history: CandidateApplicationHistory[];
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
    status: detail.status,
    version: detail.version,
    history: detail.history.map((event) => ({
      toStatus: event.toStatus,
      occurredAt: event.occurredAt,
      candidateFeedback: event.candidateFeedback,
    })),
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
