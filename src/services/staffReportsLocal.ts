/** Browser-local report demo state. This is never a server audit record. */
export type ReportProcessingStatus = "Đang xem xét" | "Đã xử lý";
export type ReportLocalState = { read: boolean; status?: ReportProcessingStatus };
export type ReportStates = Record<string, ReportLocalState>;
export const REPORT_ACTIVITY_EVENT = "guardianwork:staff-report-activity";
export const REPORT_ACTIONS = {
  READ: "Đã đọc báo cáo",
  UNREAD: "Đã đánh dấu chưa đọc",
  REVIEW: "Đã chuyển sang đang xem xét",
  RESOLVE: "Đã đánh dấu đã xử lý",
} as const;
export type ReportAction = keyof typeof REPORT_ACTIONS;
export interface ReportActivity {
  id: string;
  occurredAt: string;
  reportId: string;
  reportNumber: number;
  target: string;
  subject: string;
  action: ReportAction;
  field: "read" | "status";
  before: boolean | ReportProcessingStatus | null;
  after: boolean | ReportProcessingStatus;
}
export interface ReportWorkspace {
  reports: ReportStates;
  activities: ReportActivity[];
}
const key = (userId: number) => `guardianwork:staff:${userId}:sample-report-workspace:v2`;
function states(value: unknown): ReportStates {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, row]) =>
        row &&
        typeof row.read === "boolean" &&
        (row.status === undefined || row.status === "Đang xem xét" || row.status === "Đã xử lý"),
    ),
  );
}
function isActivity(value: unknown): value is ReportActivity {
  if (!value || typeof value !== "object") return false;
  const item = value as ReportActivity;
  const validState = (state: unknown) =>
    state === null ||
    typeof state === "boolean" ||
    state === "Đang xem xét" ||
    state === "Đã xử lý";
  return (
    typeof item.id === "string" &&
    typeof item.reportId === "string" &&
    Number.isSafeInteger(item.reportNumber) &&
    item.reportNumber > 0 &&
    typeof item.target === "string" &&
    typeof item.subject === "string" &&
    typeof item.occurredAt === "string" &&
    Number.isFinite(Date.parse(item.occurredAt)) &&
    Object.hasOwn(REPORT_ACTIONS, item.action) &&
    (item.field === "read" || item.field === "status") &&
    validState(item.before) &&
    item.after !== null &&
    validState(item.after)
  );
}
export function loadReportWorkspace(userId: number): ReportWorkspace {
  try {
    const raw = localStorage.getItem(key(userId));
    if (raw) {
      const data = JSON.parse(raw) as Partial<ReportWorkspace> | null;
      return {
        reports: states(data?.reports),
        activities: Array.isArray(data?.activities) ? data.activities.filter(isActivity) : [],
      };
    }
    // Preserve report read/status choices made before activity history was introduced.
    const legacy = JSON.parse(
      localStorage.getItem(`guardianwork:staff:${userId}:sample-report-state:v1`) || "{}",
    );
    return { reports: states(legacy), activities: [] };
  } catch {
    return { reports: {}, activities: [] };
  }
}
export function commitReportChange(
  userId: number,
  reports: ReportStates,
  activity: ReportActivity,
) {
  const workspace: ReportWorkspace = {
    reports,
    activities: [...loadReportWorkspace(userId).activities, activity],
  };
  // One write keeps the saved state and its history together; failures propagate to the UI.
  localStorage.setItem(key(userId), JSON.stringify(workspace));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REPORT_ACTIVITY_EVENT));
}
