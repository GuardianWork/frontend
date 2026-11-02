import { authenticatedRequest, getCurrentUser, isStaffUser } from "./auth.ts";
import { ApiError } from "./api.ts";

export const ACTIVITY_CATEGORIES = {
  ACCOUNT_MANAGEMENT: "Quản lý tài khoản",
  JOB_MODERATION: "Kiểm duyệt tin tuyển dụng",
  COMPANY_VERIFICATION: "Xác minh doanh nghiệp",
} as const;
export type ActivityCategory = keyof typeof ACTIVITY_CATEGORIES;
export const ACTIVITY_ACTIONS = {
  BAN_ACCOUNT: "Cấm tài khoản",
  UNBAN_ACCOUNT: "Gỡ cấm tài khoản",
  APPROVE_JOB_REVISION: "Duyệt phiên bản tin tuyển dụng",
  REJECT_JOB_REVISION: "Từ chối phiên bản tin tuyển dụng",
  APPROVE_COMPANY: "Duyệt xác minh doanh nghiệp",
  REJECT_COMPANY: "Từ chối xác minh doanh nghiệp",
  REVIEW_COMPANY: "Xét duyệt doanh nghiệp (thiếu kết quả lịch sử)",
} as const;
export type ActivityAction = keyof typeof ACTIVITY_ACTIONS;
export const ACTIONS_BY_CATEGORY: Record<ActivityCategory, ActivityAction[]> = {
  ACCOUNT_MANAGEMENT: ["BAN_ACCOUNT", "UNBAN_ACCOUNT"],
  JOB_MODERATION: ["APPROVE_JOB_REVISION", "REJECT_JOB_REVISION"],
  COMPANY_VERIFICATION: ["APPROVE_COMPANY", "REJECT_COMPANY", "REVIEW_COMPANY"],
};
export const ACTIVITY_TARGETS = {
  USER: "Người dùng",
  COMPANY: "Doanh nghiệp",
  JOB_POSTING: "Tin tuyển dụng",
} as const;
export type ActivityTarget = keyof typeof ACTIVITY_TARGETS;
export const TARGETS_BY_CATEGORY: Record<ActivityCategory, ActivityTarget[]> = {
  ACCOUNT_MANAGEMENT: ["USER", "COMPANY"],
  JOB_MODERATION: ["JOB_POSTING"],
  COMPANY_VERIFICATION: ["COMPANY"],
};

export interface StaffActivity {
  id: number;
  occurredAt: string;
  category: ActivityCategory;
  action: ActivityAction;
  targetType: ActivityTarget | null;
  targetId: string | null;
  revisionId: string | number | null;
  changes: { field: string; before: string | boolean | null; after: string | boolean | null }[];
  reason: string | null;
}
export interface StaffActivityPage {
  content: StaffActivity[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
export interface ActivityFilters {
  fromDate: string;
  toDate: string;
  category: ActivityCategory | "";
  action: ActivityAction | "";
  targetType: ActivityTarget | "";
  targetId: string;
}

export function validateActivityFilters(filters: ActivityFilters): string | null {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const validDate = (value: string) => {
    if (!datePattern.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  };
  if (Boolean(filters.fromDate) !== Boolean(filters.toDate))
    return "Vui lòng chọn cả ngày bắt đầu và ngày kết thúc, hoặc để trống cả hai.";
  if (filters.fromDate && (!validDate(filters.fromDate) || !validDate(filters.toDate)))
    return "Ngày lọc không hợp lệ.";
  if (filters.fromDate && filters.fromDate > filters.toDate)
    return "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.";
  if (filters.category && !(filters.category in ACTIVITY_CATEGORIES))
    return "Nhóm hoạt động không hợp lệ.";
  if (
    filters.action &&
    (!filters.category || !ACTIONS_BY_CATEGORY[filters.category]?.includes(filters.action))
  )
    return "Hành động không phù hợp với nhóm hoạt động.";
  if (
    filters.targetType &&
    (!filters.category || !TARGETS_BY_CATEGORY[filters.category]?.includes(filters.targetType))
  )
    return "Loại đối tượng không phù hợp với nhóm hoạt động.";
  if (
    filters.targetId &&
    (!/^[1-9]\d*$/.test(filters.targetId) || !filters.category || !filters.targetType)
  )
    return "Mã đối tượng phải là số nguyên dương và cần chọn nhóm, loại đối tượng.";
  return null;
}

export async function listStaffActivities(
  filters: ActivityFilters,
  page: number,
  signal?: AbortSignal,
): Promise<StaffActivityPage> {
  const validation = validateActivityFilters(filters);
  if (validation) throw new ApiError(validation, 400);
  if (!Number.isSafeInteger(page) || page < 0) throw new ApiError("Trang không hợp lệ.", 400);
  const user = getCurrentUser();
  if (user && !isStaffUser(user))
    throw new ApiError("Chỉ tài khoản Staff được phép truy cập.", 403);
  const query = new URLSearchParams();
  if (filters.fromDate) {
    query.set("fromDate", filters.fromDate);
    query.set("toDate", filters.toDate);
  }
  if (filters.category) query.set("category", filters.category);
  if (filters.action) query.set("action", filters.action);
  if (filters.targetType) query.set("targetType", filters.targetType);
  if (filters.targetId) query.set("targetId", filters.targetId);
  query.set("page", String(page));
  const data = (await authenticatedRequest(`/staff/me/activities?${query}`, {
    signal,
  })) as StaffActivityPage;
  if (
    !data ||
    !Array.isArray(data.content) ||
    !Number.isInteger(data.pageNumber) ||
    !Number.isInteger(data.totalElements) ||
    !Number.isInteger(data.totalPages) ||
    typeof data.first !== "boolean" ||
    typeof data.last !== "boolean"
  ) {
    throw new ApiError("Dữ liệu lịch sử không hợp lệ. Vui lòng thử lại.");
  }
  return data;
}
