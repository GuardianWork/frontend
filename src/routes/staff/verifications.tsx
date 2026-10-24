import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, ArrowRight, Database, RotateCcw } from "lucide-react";
import { StaffStatusBadge } from "@/components/admin/StaffStatusBadge";
import { AdminShell } from "@/components/AdminShell";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ListSearch } from "@/components/ListSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useListPagination } from "@/hooks/useListPagination";
import { matchesSearch } from "@/lib/list-search";
import {
  AdminApiError,
  decideAdminVerification,
  getAdminVerifications,
  type AdminCompany,
  type VerificationFilter,
} from "@/services/adminCompanies";

export const Route = createFileRoute("/staff/verifications")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { status: VerificationFilter; page: number } => ({
    status:
      search.status === "ALL" || search.status === "VERIFIED" || search.status === "REJECTED"
        ? search.status
        : "PENDING",
    page:
      typeof search.page === "number" && Number.isInteger(search.page) && search.page >= 0
        ? search.page
        : 0,
  }),
  head: () => ({ meta: [{ title: "Hồ sơ xác minh công ty — Platform staff GuardianWork" }] }),
  component: AdminVerificationsPage,
});
const STATUS_TONES = {
  REGISTERED: "neutral",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;
const LABELS = {
  REGISTERED: "Chưa gửi",
  PENDING: "Chờ duyệt",
  VERIFIED: "Đã xác minh",
  REJECTED: "Đã từ chối",
} as const;
const STATUS_OPTIONS: { id: VerificationFilter; label: string }[] = [
  { id: "PENDING", label: "Chờ duyệt" },
  { id: "VERIFIED", label: "Đã xác minh" },
  { id: "REJECTED", label: "Đã từ chối" },
  { id: "ALL", label: "Tất cả" },
];
function date(value: string | null) {
  if (!value) return "Chưa có thông tin";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Chưa có thông tin"
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(parsed);
}
function AdminVerificationsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [rows, setRows] = useState<AdminCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminCompany | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [decision, setDecision] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<AdminApiError | null>(null);
  const [reload, setReload] = useState(0);
  const [mockMode, setMockMode] = useState(false);
  const mockRows: AdminCompany[] = [
    {
      id: -1,
      name: "An Phúc Retail",
      taxCode: "0318456721",
      email: "phaply@anphuc.example.test",
      registrationCertificateUrl: null,
      verificationStatus: "PENDING",
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,
      version: 1,
      createdAt: "2026-10-19T02:15:00Z",
    },
    {
      id: -2,
      name: "Mộc Lan Foods",
      taxCode: "0109283645",
      email: "hr@moclan.example.test",
      registrationCertificateUrl: null,
      verificationStatus: "VERIFIED",
      rejectionReason: null,
      verifiedBy: 42,
      verifiedAt: "2026-10-17T04:30:00Z",
      version: 3,
      createdAt: "2026-10-15T06:20:00Z",
    },
    {
      id: -3,
      name: "Minh An Logistics",
      taxCode: "0316720984",
      email: "admin@minhan.example.test",
      registrationCertificateUrl: null,
      verificationStatus: "REJECTED",
      rejectionReason: "Thông tin mã số thuế chưa khớp với hồ sơ đăng ký.",
      verifiedBy: 37,
      verifiedAt: "2026-10-16T08:45:00Z",
      version: 2,
      createdAt: "2026-10-14T03:10:00Z",
    },
    {
      id: -4,
      name: "Hợp Nhất Services",
      taxCode: "0105847392",
      email: "contact@hopnhat.example.test",
      registrationCertificateUrl: null,
      verificationStatus: "PENDING",
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,
      version: 1,
      createdAt: "2026-10-18T09:05:00Z",
    },
  ];
  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminVerifications(search.status, search.page, signal);
        if (signal.aborted) return;
        setRows(data.content);
        setTotal(data.totalElements);
        if (data.totalPages > 0 && search.page >= data.totalPages)
          void navigate({
            search: (previous) => ({ ...previous, page: data.totalPages - 1 }),
            replace: true,
          });
      } catch (cause) {
        if (!signal.aborted) {
          setRows([]);
          setTotal(0);
          setError(cause instanceof Error ? cause.message : "Không tải được danh sách hồ sơ.");
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [navigate, search.page, search.status],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reload]);
  const sourceRows = mockMode
    ? mockRows.filter(
        (item) => search.status === "ALL" || item.verificationStatus === search.status,
      )
    : rows;
  const visibleRows = useMemo(
    () =>
      sourceRows.filter((item) => matchesSearch(query, item.name, item.taxCode, item.email ?? "")),
    [query, sourceRows],
  );
  const mockPagination = useListPagination(visibleRows, JSON.stringify([query, search.status]));
  const displayedRows = mockMode ? mockPagination.items : visibleRows;
  const updateSearch = (values: Partial<typeof search>) =>
    void navigate({ search: (previous) => ({ ...previous, ...values }) });
  const retry = () => setReload((value) => value + 1);
  const choose = (item: AdminCompany) => {
    setSelected(item);
    setNotice(null);
    setDecisionError(null);
  };
  const openDecision = (value: "VERIFIED" | "REJECTED") => {
    setDecision(value);
    setDecisionError(null);
    setReason("");
    setDialogOpen(true);
  };
  const submitDecision = async () => {
    if (!selected || selected.verificationStatus !== "PENDING" || mockMode) return;
    setSaving(true);
    setDecisionError(null);
    try {
      const updated = await decideAdminVerification(selected, decision, reason);
      setSelected(updated);
      setNotice(
        decision === "VERIFIED" ? "Hồ sơ đã được xác minh." : "Đã từ chối hồ sơ và lưu lý do.",
      );
      setDialogOpen(false);
      retry();
    } catch (cause) {
      setDecisionError(
        cause instanceof AdminApiError
          ? cause
          : new AdminApiError(
              "Không thể xác nhận kết quả. Tải lại danh sách để kiểm tra trạng thái hồ sơ.",
              0,
              true,
            ),
      );
    } finally {
      setSaving(false);
    }
  };
  const reloadAfterConflict = () => {
    setSelected(null);
    setDecisionError(null);
    setNotice("Danh sách đang được tải lại để lấy trạng thái mới nhất.");
    retry();
  };
  const certificateValue = selected?.registrationCertificateUrl;
  const certificateHref =
    certificateValue &&
    (/^https?:\/\//i.test(certificateValue) ||
      (certificateValue.startsWith("/") && !certificateValue.startsWith("//")))
      ? certificateValue
      : null;
  return (
    <AdminShell title="Hồ sơ xác minh công ty" role="admin">
      {!selected ? (
        <>
          <div className="admin-page-heading">
            <div>
              <h1>Hồ sơ xác minh công ty</h1>
              <p>Xem hồ sơ doanh nghiệp và xử lý yêu cầu đang chờ duyệt.</p>
            </div>
            <button
              type="button"
              className="admin-secondary-action"
              onClick={() => {
                setMockMode((value) => !value);
                setSelected(null);
                setQuery("");
              }}
            >
              {mockMode ? "Quay lại dữ liệu hệ thống" : "Xem dữ liệu mẫu"}
            </button>
          </div>
          {mockMode && (
            <div className="admin-sample-banner" role="note">
              <Database size={17} aria-hidden="true" />
              <p>
                <strong>Chế độ xem mẫu.</strong> Hồ sơ bên dưới là hư cấu; quyết định phê duyệt và
                từ chối đã được tắt.
              </p>
            </div>
          )}
          {notice && (
            <p role="status" className="admin-inline-notice">
              {notice}
            </p>
          )}
          <div className="admin-list-toolbar">
            <ListSearch
              value={query}
              onChange={(value) => {
                setQuery(value);
                if (search.page !== 0) updateSearch({ page: 0 });
              }}
              label="Tìm trong hồ sơ đang hiển thị theo tên, mã số thuế hoặc email"
              count={visibleRows.length}
            />
            <label className="list-filter-label">
              Trạng thái
              <select
                className="list-status-select"
                aria-label="Lọc trạng thái hồ sơ"
                value={search.status}
                onChange={(event) =>
                  updateSearch({ status: event.target.value as VerificationFilter, page: 0 })
                }
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!mockMode && error ? (
            <div className="admin-list-state" role="alert">
              <AlertCircle aria-hidden="true" />
              <h2>Không tải được hồ sơ</h2>
              <p>{error}</p>
              <button type="button" className="admin-secondary-action" onClick={retry}>
                <RotateCcw size={16} />
                Thử tải lại
              </button>
            </div>
          ) : !mockMode && loading ? (
            <div className="admin-list-state" role="status">
              Đang tải hồ sơ xác minh…
            </div>
          ) : (
            <div
              className="admin-panel admin-table-scroll"
              role="region"
              aria-label="Danh sách hồ sơ xác minh công ty"
              tabIndex={0}
            >
              <table className="admin-record-table">
                <caption className="sr-only">Danh sách hồ sơ xác minh công ty</caption>
                <thead>
                  <tr>
                    <th>Tên công ty</th>
                    <th>Mã số thuế</th>
                    <th>Email</th>
                    <th>Thời điểm gửi</th>
                    <th>Trạng thái</th>
                    <th>
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          type="button"
                          className="admin-record-name"
                          onClick={() => choose(item)}
                        >
                          {item.name}
                        </button>
                      </td>
                      <td>{item.taxCode}</td>
                      <td>{item.email || "Chưa cung cấp"}</td>
                      <td>{date(item.createdAt)}</td>
                      <td>
                        <StaffStatusBadge tone={STATUS_TONES[item.verificationStatus]}>
                          {LABELS[item.verificationStatus]}
                        </StaffStatusBadge>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-text-link"
                          onClick={() => choose(item)}
                        >
                          Mở hồ sơ <ArrowRight size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleRows.length === 0 && (
                <div className="admin-list-empty">
                  <h2>
                    {rows.length ? "Không tìm thấy hồ sơ phù hợp" : "Không có hồ sơ trong mục này"}
                  </h2>
                  <p>
                    {rows.length
                      ? "Thử từ khóa khác trong trang hiện tại."
                      : "Khi có hồ sơ phù hợp với bộ lọc, hồ sơ sẽ xuất hiện tại đây."}
                  </p>
                  {query && (
                    <button type="button" className="admin-text-link" onClick={() => setQuery("")}>
                      Xóa từ khóa tìm kiếm
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {(mockMode || (!loading && !error)) && (
            <AdminPagination
              totalItems={mockMode ? visibleRows.length : total}
              page={mockMode ? mockPagination.page : search.page}
              onPageChange={
                mockMode ? mockPagination.onPageChange : (page) => updateSearch({ page })
              }
              itemLabel="hồ sơ"
              label="Phân trang hồ sơ xác minh"
              standalone
            />
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            className="admin-text-link mb-5"
            onClick={() => {
              setSelected(null);
              setNotice(null);
            }}
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>
          <div className="admin-page-heading">
            <div>
              <h1>{selected.name}</h1>
              <p>Hồ sơ xác minh công ty · Mã số thuế {selected.taxCode}</p>
            </div>
            <StaffStatusBadge tone={STATUS_TONES[selected.verificationStatus]}>
              {LABELS[selected.verificationStatus]}
            </StaffStatusBadge>
          </div>
          {mockMode && (
            <div className="admin-sample-banner" role="note">
              <Database size={17} aria-hidden="true" />
              <p>
                <strong>Hồ sơ minh họa.</strong> Đây không phải hồ sơ doanh nghiệp thật; thao tác
                quyết định không khả dụng.
              </p>
            </div>
          )}
          {notice && (
            <p role="status" className="admin-inline-notice">
              {notice}
            </p>
          )}
          {decisionError && (
            <div className="admin-inline-error" role="alert">
              <AlertCircle size={18} />
              <div>
                <p>{decisionError.message}</p>
                {decisionError.conflict && (
                  <button type="button" className="admin-text-link" onClick={reloadAfterConflict}>
                    Tải lại danh sách <RotateCcw size={15} />
                  </button>
                )}
              </div>
            </div>
          )}
          <section className="admin-panel admin-company-detail" aria-labelledby="company-info">
            <div className="admin-panel-heading">
              <h2 id="company-info">Thông tin hồ sơ</h2>
            </div>
            <dl className="admin-company-fields">
              <div>
                <dt>Tên công ty</dt>
                <dd>{selected.name}</dd>
              </div>
              <div>
                <dt>Mã số thuế</dt>
                <dd>{selected.taxCode}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selected.email || "Chưa cung cấp"}</dd>
              </div>
              <div>
                <dt>Thời điểm gửi</dt>
                <dd>{date(selected.createdAt)}</dd>
              </div>
              <div>
                <dt>Thời điểm xét duyệt</dt>
                <dd>{date(selected.verifiedAt)}</dd>
              </div>
              <div>
                <dt>Người duyệt</dt>
                <dd>
                  {selected.verifiedBy == null
                    ? "Chưa có thông tin"
                    : `Mã người duyệt: ${selected.verifiedBy}`}
                </dd>
              </div>
              <div className="admin-company-fields-wide">
                <dt>Giấy đăng ký công ty</dt>
                <dd>
                  {certificateHref ? (
                    <a
                      href={certificateHref}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-text-link"
                    >
                      Mở đường dẫn giấy đăng ký <ArrowRight size={16} />
                    </a>
                  ) : (
                    "Chưa có đường dẫn tài liệu trong hồ sơ."
                  )}
                </dd>
              </div>
              {selected.verificationStatus === "REJECTED" && (
                <div className="admin-company-fields-wide">
                  <dt>Lý do từ chối</dt>
                  <dd>{selected.rejectionReason || "Không có lý do trong hồ sơ."}</dd>
                </div>
              )}
            </dl>
          </section>
          {selected.verificationStatus === "PENDING" && !mockMode && (
            <div className="admin-decision-actions">
              <p>Chỉ hồ sơ đang chờ duyệt mới có thể được quyết định.</p>
              <div>
                <button
                  type="button"
                  className="admin-secondary-action"
                  onClick={() => openDecision("REJECTED")}
                >
                  Từ chối hồ sơ
                </button>
                <button
                  type="button"
                  className="admin-primary-action"
                  onClick={() => openDecision("VERIFIED")}
                >
                  Phê duyệt <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
          {dialogOpen && (
            <Dialog
              open
              onOpenChange={(open) => {
                if (!saving) setDialogOpen(open);
              }}
            >
              <DialogContent
                aria-describedby="decision-description"
                className="admin-decision-dialog"
              >
                <div className="admin-panel-heading">
                  <DialogTitle>
                    {decision === "VERIFIED" ? "Phê duyệt hồ sơ" : "Từ chối hồ sơ"}
                  </DialogTitle>
                </div>
                <p id="decision-description">
                  {selected.name} · Mã số thuế {selected.taxCode}
                </p>
                {decision === "REJECTED" && (
                  <div>
                    <label htmlFor="rejection-reason">
                      Lý do từ chối <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="rejection-reason"
                      autoFocus
                      rows={5}
                      maxLength={1000}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Nhập lý do từ chối (10–1.000 ký tự)"
                    />
                    <p className="admin-form-hint" aria-live="polite">
                      {reason.trim().length} / 1.000 ký tự · Tối thiểu 10 ký tự
                    </p>
                  </div>
                )}
                {decisionError && (
                  <p role="alert" className="admin-inline-error">
                    {decisionError.message}
                  </p>
                )}
                <div className="admin-dialog-actions">
                  <button
                    type="button"
                    className="admin-secondary-action"
                    disabled={saving}
                    onClick={() => setDialogOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="admin-primary-action"
                    disabled={
                      saving ||
                      (decision === "REJECTED" &&
                        (reason.trim().length < 10 || reason.trim().length > 1000))
                    }
                    onClick={() => void submitDecision()}
                  >
                    {saving
                      ? "Đang gửi…"
                      : decision === "VERIFIED"
                        ? "Xác nhận phê duyệt"
                        : "Xác nhận từ chối"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </AdminShell>
  );
}
