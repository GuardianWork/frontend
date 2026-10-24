export type AuditAction =
  | "VERIFY_COMPANY"
  | "REJECT_COMPANY"
  | "HIDE_JOB"
  | "RESTORE_JOB"
  | "LOCK_ACCOUNT"
  | "UNLOCK_ACCOUNT";
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  VERIFY_COMPANY: "Xác minh công ty",
  REJECT_COMPANY: "Từ chối xác minh",
  HIDE_JOB: "Ẩn tin tuyển dụng",
  RESTORE_JOB: "Công khai lại tin",
  LOCK_ACCOUNT: "Khóa tài khoản",
  UNLOCK_ACCOUNT: "Mở khóa tài khoản",
};
export interface AuditEntry {
  id: string;
  actor: { id: number; name: string; email: string };
  createdAt: string;
  action: AuditAction;
  target: string;
  targetId: string;
  before: string;
  after: string;
  reason: string;
}
const SAMPLE_STAFF = [
  { id: 101, name: "Nguyễn Minh Anh", email: "minhanh@example.test" },
  { id: 102, name: "Trần Hoàng Nam", email: "hoangnam@example.test" },
  { id: 103, name: "Lê Thu Hà", email: "thuha@example.test" },
];
type SampleInput = [string, number, string, AuditAction, string, string, string, string, string];
const SAMPLE_INPUT: SampleInput[] = [
  [
    "AUD-0014",
    0,
    "2026-10-24T10:42:16+07:00",
    "VERIFY_COMPANY",
    "Minh An Logistics",
    "COMPANY-204",
    "Chờ xác minh",
    "Đã xác minh",
    "Giấy tờ và thông tin doanh nghiệp hợp lệ (mẫu).",
  ],
  [
    "AUD-0013",
    1,
    "2026-10-24T10:18:42+07:00",
    "HIDE_JOB",
    "Nhân viên kinh doanh",
    "JOB-118",
    "Đang công khai",
    "Đã ẩn",
    "Tin có yêu cầu nộp phí hồ sơ, cần rà soát (mẫu).",
  ],
  [
    "AUD-0012",
    2,
    "2026-10-24T09:56:08+07:00",
    "LOCK_ACCOUNT",
    "tuyendung_mau",
    "USER-82",
    "Hoạt động",
    "Tạm khóa",
    "Tạm khóa để kiểm tra báo cáo spam (mẫu).",
  ],
  [
    "AUD-0011",
    0,
    "2026-10-24T09:20:31+07:00",
    "REJECT_COMPANY",
    "An Phát Thương mại",
    "COMPANY-203",
    "Chờ xác minh",
    "Bị từ chối",
    "Giấy đăng ký kinh doanh chưa rõ thông tin mã số thuế (mẫu).",
  ],
  [
    "AUD-0010",
    1,
    "2026-10-23T16:45:12+07:00",
    "RESTORE_JOB",
    "Chuyên viên marketing",
    "JOB-116",
    "Đã ẩn",
    "Đang công khai",
    "Nội dung đã được cập nhật sau khi rà soát (mẫu).",
  ],
  [
    "AUD-0009",
    2,
    "2026-10-23T15:30:04+07:00",
    "UNLOCK_ACCOUNT",
    "nhansu_mau",
    "USER-79",
    "Tạm khóa",
    "Hoạt động",
    "Đã kiểm tra và hoàn tất xử lý báo cáo (mẫu).",
  ],
  [
    "AUD-0008",
    0,
    "2026-10-23T14:08:22+07:00",
    "VERIFY_COMPANY",
    "Bình Minh Retail",
    "COMPANY-201",
    "Chờ xác minh",
    "Đã xác minh",
    "Hồ sơ doanh nghiệp đã được đối chiếu (mẫu).",
  ],
  [
    "AUD-0007",
    1,
    "2026-10-23T11:32:10+07:00",
    "HIDE_JOB",
    "Kế toán công nợ",
    "JOB-112",
    "Đang công khai",
    "Đã ẩn",
    "Rà soát điều kiện tuyển dụng được AI gắn cờ (mẫu).",
  ],
  [
    "AUD-0006",
    2,
    "2026-10-22T16:10:36+07:00",
    "LOCK_ACCOUNT",
    "recruiter_mau",
    "USER-74",
    "Hoạt động",
    "Tạm khóa",
    "Kiểm tra hoạt động gửi tin lặp lại (mẫu).",
  ],
  [
    "AUD-0005",
    0,
    "2026-10-22T14:25:18+07:00",
    "VERIFY_COMPANY",
    "Hòa Bình Foods",
    "COMPANY-198",
    "Chờ xác minh",
    "Đã xác minh",
    "Hồ sơ đăng ký và thông tin pháp nhân hợp lệ (mẫu).",
  ],
  [
    "AUD-0004",
    1,
    "2026-10-22T10:42:05+07:00",
    "REJECT_COMPANY",
    "Nam Việt Services",
    "COMPANY-196",
    "Chờ xác minh",
    "Bị từ chối",
    "Thiếu tài liệu xác minh doanh nghiệp (mẫu).",
  ],
  [
    "AUD-0003",
    2,
    "2026-10-21T15:18:46+07:00",
    "RESTORE_JOB",
    "Chuyên viên nhân sự",
    "JOB-105",
    "Đã ẩn",
    "Đang công khai",
    "Nội dung đã được điều chỉnh theo yêu cầu rà soát (mẫu).",
  ],
  [
    "AUD-0002",
    0,
    "2026-10-21T11:06:29+07:00",
    "UNLOCK_ACCOUNT",
    "hr_mau",
    "USER-68",
    "Tạm khóa",
    "Hoạt động",
    "Hoàn tất xác minh tài khoản (mẫu).",
  ],
  [
    "AUD-0001",
    1,
    "2026-10-20T09:14:03+07:00",
    "VERIFY_COMPANY",
    "Đông Phương Tech",
    "COMPANY-192",
    "Chờ xác minh",
    "Đã xác minh",
    "Thông tin hồ sơ đã được đối chiếu (mẫu).",
  ],
];

/** Fictional UI fixtures only; no backend audit-search API is available yet. */
export const AUDIT_SAMPLE_ENTRIES: AuditEntry[] = SAMPLE_INPUT.map(
  ([id, actor, createdAt, action, target, targetId, before, after, reason]) => ({
    id,
    actor: SAMPLE_STAFF[actor],
    createdAt,
    action,
    target,
    targetId,
    before,
    after,
    reason,
  }),
);
