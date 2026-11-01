import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";

export interface RecruiterApplication {
  id: string;
  candidateName: string;
  status: "SUBMITTED";
  appliedAt: string;
}
export interface ApplicationPage {
  content: RecruiterApplication[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
export async function listRecruiterApplications(
  jobId: number,
  search: string,
  page: number,
  signal?: AbortSignal,
): Promise<ApplicationPage> {
  const query = new URLSearchParams({ page: String(page), size: "20" });
  if (search.trim()) query.set("search", search.trim());
  const data = (await authenticatedRequest(`/companies/me/jobs/${jobId}/applications?${query}`, {
    signal,
    cache: "no-store",
  })) as ApplicationPage;
  if (
    !data ||
    !Array.isArray(data.content) ||
    !data.content.every(
      (a) =>
        a &&
        typeof a.id === "string" &&
        typeof a.candidateName === "string" &&
        a.status === "SUBMITTED" &&
        typeof a.appliedAt === "string" &&
        Number.isFinite(Date.parse(a.appliedAt)),
    ) ||
    ![data.pageNumber, data.totalElements, data.totalPages].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    !Number.isSafeInteger(data.pageSize) ||
    data.pageSize < 1 ||
    data.pageSize > 100 ||
    typeof data.first !== "boolean" ||
    typeof data.last !== "boolean"
  ) {
    throw new ApiError("Phản hồi danh sách không hợp lệ. Vui lòng thử lại.");
  }
  return data;
}
