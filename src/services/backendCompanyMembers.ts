import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";

export interface BackendCompanyMember {
  membershipId: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  companyRole: "OWNER" | "ADMIN" | "RECRUITER";
  status: "ACTIVE" | "LEFT" | "REMOVED";
  joinedAt: string;
}

export async function listBackendCompanyMembers(page = 0) {
  const result = (await authenticatedRequest(`/companies/me/members?page=${page}&size=20`, {
    cache: "no-store",
  })) as { content: BackendCompanyMember[]; totalElements: number; totalPages: number };
  if (
    !result ||
    !Array.isArray(result.content) ||
    !Number.isSafeInteger(result.totalElements) ||
    !Number.isSafeInteger(result.totalPages) ||
    result.content.some(
      (m) =>
        !Number.isSafeInteger(m.membershipId) ||
        !Number.isSafeInteger(m.userId) ||
        typeof m.email !== "string" ||
        !["OWNER", "ADMIN", "RECRUITER"].includes(m.companyRole) ||
        !["ACTIVE", "LEFT", "REMOVED"].includes(m.status),
    )
  ) {
    throw new ApiError("Phản hồi danh sách thành viên không hợp lệ. Vui lòng thử lại.");
  }
  return result;
}

export async function removeBackendCompanyMember(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError("Thành viên không hợp lệ.");
  await authenticatedRequest(`/companies/me/members/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
