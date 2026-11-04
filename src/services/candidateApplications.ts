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
}

export function parseSubmittedApplication(value: unknown): SubmittedApplication {
  const application = value as Partial<SubmittedApplication>;
  if (!application || typeof application.id !== "string") {
    throw new ApiError("Phản hồi đơn ứng tuyển không hợp lệ. Vui lòng thử lại.", 500);
  }
  return {
    id: application.id,
    jobId: Number(application.jobId ?? 0),
    jobTitle: String(application.jobTitle ?? ""),
    companyId: Number(application.companyId ?? 0),
    companyName: String(application.companyName ?? ""),
    status: String(application.status ?? "SUBMITTED"),
    appliedAt: String(application.appliedAt ?? new Date().toISOString()),
    cvFileName: String(application.cvFileName ?? ""),
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
  "VIEWED",
  "UNDER_REVIEW",
  "SHORTLISTED",
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
  viewed: number;
  rejected: number;
}

export interface CandidateApplicationCountOptions {
  search?: string;
  signal?: AbortSignal;
}

/**
 * The list endpoint returns one total per filtered request. Four size-one reads
 * give the status tabs exact counts without downloading the application rows again.
 */
export async function listApplicationCounts(
  options: CandidateApplicationCountOptions = {},
): Promise<CandidateApplicationCounts> {
  const search = options.search ?? "";
  const signal = options.signal;
  const [all, submitted, viewed, rejected] = await Promise.all([
    listApplicationPage({ search, size: 1, signal }),
    listApplicationPage({ search, size: 1, status: "SUBMITTED", signal }),
    listApplicationPage({ search, size: 1, status: "VIEWED", signal }),
    listApplicationPage({ search, size: 1, status: "REJECTED", signal }),
  ]);
  return {
    all: all.totalElements,
    submitted: submitted.totalElements,
    viewed: viewed.totalElements,
    rejected: rejected.totalElements,
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
