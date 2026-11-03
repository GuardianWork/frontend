import { apiRequest } from "./api.ts";
import { authenticatedRequest, hasAuthSession } from "./auth.ts";

export interface CompensationDetail {
  disclosed: boolean;
  minimum?: number;
  maximum?: number;
  currency?: "VND" | "USD";
  payPeriod?: "HOUR" | "DAY" | "MONTH" | "YEAR";
}

export interface PublicJobContent {
  title?: string;
  description?: string;
  location?: string;
  employmentType?: string;
  workArrangement?: string;
  deadline?: string;
  headcount?: number;
  compensation?: CompensationDetail;
  screeningQuestions?: unknown[];
}

export interface PublicJobSearchResult {
  id: number;
  company: {
    id: number;
    name: string;
  };
  content: PublicJobContent;
  publicationStatus: string;
  approvedDeadline: string | null;
  applicationsAvailable: boolean;
  applicationAvailabilityReason: string | null;
}

export interface ApiPage<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PublicJobSearchParams {
  keyword?: string;
  location?: string;
  industry?: string;
  employmentType?: string;
  workArrangement?: string;
  deadline?: string;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  size?: number;
}

export function toSalaryRange(compensation: CompensationDetail | undefined): string {
  if (
    !compensation?.disclosed ||
    typeof compensation.minimum !== "number" ||
    typeof compensation.maximum !== "number"
  ) {
    return "Thỏa thuận";
  }
  const format = (value: number) => Math.round(value).toLocaleString("vi-VN").replace(/,/g, ".");
  return `${format(compensation.minimum)} - ${format(compensation.maximum)} ${compensation.currency ?? "VND"} / ${(
    compensation.payPeriod ?? "MONTH"
  ).toLowerCase()}`;
}

export async function searchPublicJobs(
  params: PublicJobSearchParams,
): Promise<ApiPage<PublicJobSearchResult>> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.location) query.set("location", params.location);
  if (params.industry) query.set("industry", params.industry);
  if (params.employmentType) query.set("employmentType", params.employmentType);
  if (params.workArrangement) query.set("workArrangement", params.workArrangement);
  if (params.deadline) query.set("deadline", params.deadline);
  if (params.salaryMin !== undefined) query.set("salaryMin", String(params.salaryMin));
  if (params.salaryMax !== undefined) query.set("salaryMax", String(params.salaryMax));
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 6));

  const request = hasAuthSession() ? authenticatedRequest : apiRequest;
  return (await request(`/jobs/search?${query.toString()}`)) as ApiPage<PublicJobSearchResult>;
}
