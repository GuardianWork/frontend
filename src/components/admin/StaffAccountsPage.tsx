import { toast } from "sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  SearchIcon as Search,
  LockIcon,
} from "@/components/icons";
import { AdminShell } from "@/components/AdminShell";
import { AdminPagination } from "./AdminPagination";
import { StaffStatusBadge, type StaffStatusTone } from "./StaffStatusBadge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  accountError,
  enforceStaffAccount,
  getStaffAccount,
  listStaffAccounts,
  type AccountType,
  type StaffAccount,
  type AccountPage,
} from "@/services/staffAccounts";
import "./staff-accounts.css";

const date = (value: string | null | undefined) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "Chưa có thông tin";
const name = (item: StaffAccount) => item.name || item.username || `#${item.id}`;
const labels: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Không hoạt động",
  BANNED: "Đã khóa",
  STAFF: "Nhân viên nền tảng",
  USER: "Người dùng",
  ADMIN: "Quản trị viên",
  VERIFIED: "Đã xác minh",
  REGISTERED: "Chưa gửi xác minh",
  PENDING: "Chờ xác minh",
  REJECTED: "Đã từ chối",
};
const verificationTones: Record<string, StaffStatusTone> = {
  VERIFIED: "verified",
  REGISTERED: "neutral",
  PENDING: "pending",
  REJECTED: "rejected",
};
const label = (value?: string) => (value ? labels[value] || value : "Chưa có thông tin");
function Status({ item, type }: { item: StaffAccount; type: AccountType }) {
  const banned =
    type === "companies" ? item.isBanned : item.status === "BANNED" || !!item.activeBan;
  return (
    <StaffStatusBadge
      tone={
        banned
          ? "rejected"
          : type === "companies" || item.status === "ACTIVE"
            ? "verified"
            : "neutral"
      }
    >
      {banned ? "Đã khóa" : type === "companies" ? "Không bị khóa" : label(item.status)}
    </StaffStatusBadge>
  );
}
export function StaffAccountsPage() {
  const [type, setType] = useState<AccountType>("users");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState({ q: "", page: 0 });
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<AccountPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [id, setId] = useState<number | null>(null);
  const [detail, setDetail] = useState<StaffAccount | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [action, setAction] = useState<"ban" | "unban" | null>(null);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("temporary");
  const [expiry, setExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [needsReload, setNeedsReload] = useState(false);
  const sequence = useRef(0);
  const pending = useRef(false);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const focusedDetail = useRef<number | null>(null);
  const actionTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (detail && id !== null && focusedDetail.current !== id) {
      detailHeading.current?.focus();
      focusedDetail.current = id;
    }
  }, [detail, id]);
  useEffect(() => {
    const timer = setTimeout(() => setFilter({ q: query.trim(), page: 0 }), 350);
    return () => clearTimeout(timer);
  }, [query, type]);
  useEffect(() => {
    if (filter.q !== query.trim()) return;
    const controller = new AbortController();
    setLoading(true);
    setListError("");
    listStaffAccounts(type, filter.q, filter.page, 20, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.totalPages > 0 && filter.page >= result.totalPages) {
          setFilter((previous) => ({ ...previous, page: result.totalPages - 1 }));
          return;
        }
        setData(result);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setListError(accountError(error).message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [type, filter, revision, query]);
  const refreshDetail = useCallback(async () => {
    if (id === null || pending.current) return null;
    const ticket = ++sequence.current;
    setDetailLoading(true);
    setDetailError("");
    try {
      const result = await getStaffAccount(type, id);
      if (ticket !== sequence.current) return null;
      setDetail(result);
      setNeedsReload(false);
      return result;
    } catch (error) {
      if (ticket !== sequence.current) return null;
      const mapped = accountError(error);
      if (mapped.status === 404) {
        setId(null);
        setDetail(null);
        setAction(null);
        toast.error(mapped.message);
        setRevision((value) => value + 1);
      } else {
        setDetailError(mapped.message);
        setNeedsReload(true);
      }
      return null;
    } finally {
      if (ticket === sequence.current) setDetailLoading(false);
    }
  }, [id, type]);
  useEffect(() => {
    const requestSequence = sequence;
    void refreshDetail();
    return () => {
      requestSequence.current++;
    };
  }, [refreshDetail]);
  useEffect(() => {
    const focus = () => {
      void refreshDetail();
    };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [refreshDetail]);
  const openAction = async (next: "ban" | "unban") => {
    const fresh = await refreshDetail();
    if (!fresh || !(next === "ban" ? fresh.canBan : fresh.canUnban)) return;
    setReason("");
    setExpiry("");
    setDuration("temporary");
    setFormError("");
    setAction(next);
  };
  const valid =
    reason.trim().length >= 1 &&
    reason.trim().length <= 2000 &&
    (action !== "ban" ||
      duration === "permanent" ||
      (Number.isFinite(Date.parse(expiry)) && Date.parse(expiry) > Date.now()));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !action ||
      id === null ||
      !valid ||
      pending.current ||
      needsReload ||
      detailLoading ||
      !(action === "ban" ? detail?.canBan : detail?.canUnban)
    )
      return;
    pending.current = true;
    setSaving(true);
    setFormError("");
    sequence.current++;
    try {
      const result = await enforceStaffAccount(
        type,
        id,
        action,
        reason,
        action === "ban" && duration === "temporary" ? new Date(expiry).toISOString() : null,
      );
      setDetail(result);
      setAction(null);
      toast.success(action === "ban" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.");
      setRevision((value) => value + 1);
    } catch (error) {
      const mapped = accountError(error);
      setFormError(mapped.message);
      if (mapped.status === 404) {
        setAction(null);
        setId(null);
        setDetail(null);
        toast.error(mapped.message);
        setRevision((value) => value + 1);
      }
      if ([0, 409, 500, 503].includes(mapped.status)) setNeedsReload(true);
      if (mapped.status === 409) {
        pending.current = false;
        await refreshDetail();
        setRevision((value) => value + 1);
      }
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };
  const back = () => {
    sequence.current++;
    const previousId = id;
    focusedDetail.current = null;
    setId(null);
    setDetail(null);
    setAction(null);
    setDetailError("");
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLButtonElement>(`[data-account-id="${previousId}"]`);
      (target || document.querySelector<HTMLInputElement>("#account-search"))?.focus();
    });
  };
  return (
    <AdminShell title="Quản lý tài khoản">
      <div className="staff-accounts">
        <div className="admin-page-heading">
          <div>
            <h1>Quản lý tài khoản</h1>
            <p>Tra cứu người dùng, công ty và quản lý quyền truy cập nền tảng.</p>
          </div>
          <LockIcon size={28} aria-hidden="true" className="accounts-heading-icon" />
        </div>
        {id === null ? (
          <>
            <div className="accounts-tabs" role="tablist" aria-label="Loại tài khoản">
              {(["users", "companies"] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  tabIndex={type === tab ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? "users"
                        : event.key === "End"
                          ? "companies"
                          : tab === "users"
                            ? "companies"
                            : "users";
                    const button = document.getElementById(`tab-${next}`);
                    button?.click();
                    button?.focus();
                  }}
                  id={`tab-${tab}`}
                  aria-selected={type === tab}
                  aria-controls="accounts-results"
                  onClick={() => {
                    if (tab === type) return;
                    setType(tab);
                    setFilter({ q: "", page: 0 });
                    setQuery("");
                    setData(null);
                  }}
                >
                  {tab === "users" ? "Tài khoản người dùng" : "Công ty"}
                </button>
              ))}
            </div>
            <section id="accounts-results" role="tabpanel" aria-labelledby={`tab-${type}`}>
              <div className="accounts-search">
                <label htmlFor="account-search">
                  {type === "users"
                    ? "Tìm theo tên đăng nhập, họ tên hoặc email"
                    : "Tìm theo tên công ty hoặc mã số thuế"}
                </label>
                <div>
                  <Search size={18} aria-hidden="true" />
                  <input
                    id="account-search"
                    type="search"
                    maxLength={200}
                    value={query}
                    placeholder={
                      type === "users" ? "Nhập tên hoặc email…" : "Nhập tên hoặc mã số thuế…"
                    }
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setLoading(true);
                      setData(null);
                    }}
                  />
                </div>
                <span>Tối đa 200 ký tự</span>
              </div>
              {loading ? (
                <div className="admin-list-state" role="status">
                  Đang tải tài khoản…
                </div>
              ) : listError ? (
                <div className="admin-list-state" role="alert">
                  <h2>Không tải được danh sách</h2>
                  <p>{listError}</p>
                  <button
                    className="admin-secondary-action"
                    onClick={() => setRevision((value) => value + 1)}
                  >
                    Thử tải lại
                  </button>
                </div>
              ) : !data?.content.length ? (
                <div className="admin-list-state">
                  <h2>Không tìm thấy tài khoản</h2>
                  <p>
                    {query
                      ? "Thử tên, email hoặc mã số thuế khác."
                      : "Chưa có tài khoản trong mục này."}
                  </p>
                  {query && (
                    <button className="admin-secondary-action" onClick={() => setQuery("")}>
                      Xóa tìm kiếm
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className="admin-panel admin-table-scroll"
                    role="region"
                    aria-label="Danh sách tài khoản"
                    tabIndex={0}
                  >
                    <table className="admin-record-table">
                      <caption className="sr-only">
                        {type === "users" ? "Tài khoản người dùng" : "Công ty"}
                      </caption>
                      <thead>
                        <tr>
                          <th>{type === "users" ? "Người dùng" : "Công ty"}</th>
                          <th>{type === "users" ? "Email" : "Mã số thuế"}</th>
                          <th>{type === "users" ? "Vai trò nền tảng" : "Xác minh"}</th>
                          <th>Trạng thái</th>
                          <th>Ngày tạo</th>
                          <th>
                            <span className="sr-only">Chi tiết</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.content.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <button
                                className="admin-record-name"
                                data-account-id={item.id}
                                onClick={() => {
                                  setDetail(null);
                                  setId(item.id);
                                }}
                              >
                                {name(item)}
                              </button>
                              {type === "users" && (
                                <span className="accounts-secondary">
                                  {[item.firstName, item.lastName].filter(Boolean).join(" ") ||
                                    "Chưa có họ tên"}
                                </span>
                              )}
                            </td>
                            <td>{type === "users" ? item.email : item.taxCode}</td>
                            <td>
                              {type === "users" ? (
                                label(item.role)
                              ) : (
                                <StaffStatusBadge
                                  tone={
                                    verificationTones[item.verificationStatus ?? ""] ?? "neutral"
                                  }
                                >
                                  {label(item.verificationStatus)}
                                </StaffStatusBadge>
                              )}
                            </td>
                            <td>
                              <Status item={item} type={type} />
                            </td>
                            <td>{date(item.createdAt)}</td>
                            <td>
                              <button
                                className="admin-text-link"
                                onClick={() => {
                                  setDetail(null);
                                  setId(item.id);
                                }}
                              >
                                Xem chi tiết <ArrowRight size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <AdminPagination
                    totalItems={data.totalElements}
                    page={filter.page}
                    pageSize={20}
                    itemLabel="tài khoản"
                    onPageChange={(page) => setFilter((previous) => ({ ...previous, page }))}
                    standalone
                  />
                </>
              )}
            </section>
          </>
        ) : (
          <>
            <button className="admin-text-link accounts-back" disabled={saving} onClick={back}>
              <ArrowLeft size={16} />
              Quay lại danh sách
            </button>
            {detailError && (
              <p role="alert" className="admin-inline-error">
                {detailError}
              </p>
            )}
            {detailLoading && <p role="status">Đang tải chi tiết mới nhất…</p>}
            {detail && (
              <>
                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <h2 ref={detailHeading} tabIndex={-1}>
                      {name(detail)}
                    </h2>
                    <Status item={detail} type={type} />
                  </div>
                  <dl className="admin-company-fields">
                    {(type === "users"
                      ? [
                          ["Tên đăng nhập", detail.username],
                          ["Họ", detail.firstName],
                          ["Tên", detail.lastName],
                          ["Email", detail.email],
                          ["Vai trò nền tảng", label(detail.role)],
                          [
                            "Xác minh email",
                            detail.emailVerified ? "Đã xác minh" : "Chưa xác minh",
                          ],
                          ["Trạng thái tài khoản", label(detail.status)],
                        ]
                      : [
                          ["Tên công ty", detail.name],
                          ["Mã số thuế", detail.taxCode],
                          ["Trạng thái xác minh", label(detail.verificationStatus)],
                          ["Khóa tài khoản", detail.isBanned ? "Đã khóa" : "Không bị khóa"],
                        ]
                    )
                      .concat([
                        ["Ngày tạo", date(detail.createdAt)],
                        ["Cập nhật lần cuối", date(detail.updatedAt)],
                      ])
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd>{value || "Chưa có thông tin"}</dd>
                        </div>
                      ))}
                  </dl>
                </section>
                <section className="admin-panel accounts-enforcement">
                  <div className="admin-panel-heading">
                    <h2>Quyền truy cập</h2>
                    <span>Giờ Việt Nam (UTC+7)</span>
                  </div>
                  {detail.activeBan ? (
                    <dl className="admin-company-fields">
                      <div className="admin-company-fields-wide">
                        <dt>Lý do khóa</dt>
                        <dd>{detail.activeBan.reason}</dd>
                      </div>
                      <div>
                        <dt>Bắt đầu</dt>
                        <dd>{date(detail.activeBan.startedAt)}</dd>
                      </div>
                      <div>
                        <dt>Hết hạn</dt>
                        <dd>
                          {detail.activeBan.expiresAt === null
                            ? "Vĩnh viễn"
                            : date(detail.activeBan.expiresAt)}
                        </dd>
                      </div>
                      <div>
                        <dt>Người thực hiện</dt>
                        <dd>#{detail.activeBan.createdBy}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="accounts-note">Không có lệnh khóa đang có hiệu lực.</p>
                  )}
                  {!detail.canBan && !detail.canUnban && (
                    <p className="accounts-note">
                      Tài khoản hiện không cho phép khóa hoặc mở khóa.
                    </p>
                  )}
                  <div className="accounts-actions">
                    <button
                      className="admin-secondary-action"
                      disabled={saving || detailLoading}
                      onClick={() => void refreshDetail()}
                    >
                      Tải lại chi tiết
                    </button>
                    {detail.canBan && (
                      <button
                        className="admin-secondary-action accounts-danger"
                        disabled={saving || detailLoading || needsReload}
                        onClick={(event) => {
                          actionTrigger.current = event.currentTarget;
                          void openAction("ban");
                        }}
                      >
                        Khóa tài khoản
                      </button>
                    )}
                    {detail.canUnban && (
                      <button
                        className="admin-primary-action"
                        disabled={saving || detailLoading || needsReload}
                        onClick={(event) => {
                          actionTrigger.current = event.currentTarget;
                          void openAction("unban");
                        }}
                      >
                        Mở khóa tài khoản
                      </button>
                    )}
                  </div>
                </section>
              </>
            )}
            {!detail && !detailLoading && (
              <button className="admin-secondary-action" onClick={() => void refreshDetail()}>
                Thử tải lại chi tiết
              </button>
            )}
          </>
        )}
        <Dialog
          open={action !== null}
          onOpenChange={(open) => {
            if (!open && !saving) setAction(null);
          }}
        >
          <DialogContent
            className="admin-decision-dialog"
            hideClose={saving}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (actionTrigger.current?.isConnected && !actionTrigger.current.disabled)
                actionTrigger.current.focus();
              else
                (
                  detailHeading.current ||
                  document.querySelector<HTMLInputElement>("#account-search")
                )?.focus();
            }}
          >
            <DialogTitle>{action === "ban" ? "Khóa tài khoản" : "Mở khóa tài khoản"}</DialogTitle>
            <DialogDescription>
              {detail && name(detail)} · #{id}
            </DialogDescription>
            <form onSubmit={submit} className="accounts-form">
              <p className="accounts-consequence">
                {action === "ban"
                  ? type === "companies"
                    ? "Phiên đăng nhập của các thành viên đang hoạt động sẽ bị vô hiệu hóa. Các tin tuyển dụng công khai sẽ bị đình chỉ."
                    : "Tài khoản sẽ bị chặn truy cập trong thời gian khóa."
                  : type === "companies"
                    ? "Người dùng phải đăng nhập lại. Tin tuyển dụng của công ty vẫn bị đình chỉ sau khi mở khóa."
                    : "Người dùng phải đăng nhập lại sau khi được mở khóa."}
              </p>
              <label htmlFor="account-reason">
                Lý do <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="account-reason"
                required
                rows={4}
                maxLength={2000}
                value={reason}
                disabled={saving}
                onChange={(event) => setReason(event.target.value)}
                aria-describedby="reason-hint"
              />
              <p id="reason-hint" className="admin-form-hint">
                {reason.trim().length} / 2.000 ký tự · Bắt buộc, không chỉ gồm khoảng trắng
              </p>
              {action === "ban" && (
                <>
                  <label htmlFor="ban-duration">Thời hạn khóa</label>
                  <select
                    id="ban-duration"
                    value={duration}
                    disabled={saving}
                    onChange={(event) => setDuration(event.target.value)}
                  >
                    <option value="temporary">Tạm thời</option>
                    <option value="permanent">Vĩnh viễn</option>
                  </select>
                  {duration === "temporary" && (
                    <>
                      <label htmlFor="ban-expiry">Hết hạn vào</label>
                      <input
                        id="ban-expiry"
                        type="datetime-local"
                        required
                        value={expiry}
                        disabled={saving}
                        onChange={(event) => setExpiry(event.target.value)}
                      />
                      <p className="admin-form-hint">
                        Chọn thời điểm trong tương lai theo múi giờ thiết bị. Thời gian lưu được quy
                        đổi sang UTC.
                      </p>
                    </>
                  )}
                </>
              )}
              {formError && (
                <p role="alert" className="admin-inline-error">
                  {formError}
                </p>
              )}
              {detailError && (
                <p role="alert" className="admin-inline-error">
                  {detailError}
                </p>
              )}
              {needsReload && (
                <button
                  type="button"
                  className="admin-secondary-action"
                  disabled={saving || detailLoading}
                  onClick={() => void refreshDetail()}
                >
                  Tải lại chi tiết trước khi thử lại
                </button>
              )}
              {!needsReload && detail && !(action === "ban" ? detail.canBan : detail.canUnban) && (
                <p role="alert">
                  Thao tác không còn khả dụng. Đóng hộp thoại để xem trạng thái mới.
                </p>
              )}
              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="admin-secondary-action"
                  disabled={saving}
                  onClick={() => setAction(null)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={
                    action === "ban"
                      ? "admin-primary-action accounts-danger-submit"
                      : "admin-primary-action"
                  }
                  disabled={
                    !valid ||
                    saving ||
                    needsReload ||
                    detailLoading ||
                    !(action === "ban" ? detail?.canBan : detail?.canUnban)
                  }
                >
                  {saving ? "Đang gửi…" : action === "ban" ? "Xác nhận khóa" : "Xác nhận mở khóa"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
