import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CircleHelp,
  Database,
  Eye,
  Play,
  Search,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { ListSearch } from "@/components/ListSearch";
import { AdminPagination } from "./AdminPagination";
import { StaffStatusBadge, type StaffStatusTone } from "./StaffStatusBadge";
import { useListPagination } from "@/hooks/useListPagination";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type DraftAdminArea = "reports" | "jobs" | "accounts" | "monitoring" | "tasks";

type SampleRow = {
  cells: string[];
  status?: string;
  statusIndex?: number;
  searchable: string;
  periodValues?: Record<string, string>;
  actionReason?: string;
  lockUntil?: string;
};
type AreaSpec = {
  title: string;
  description: string;
  listTitle: string;
  columns: string[];
  rows: SampleRow[];
  note: string;
};

function todayInVietnam() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

const AREAS: Record<DraftAdminArea, AreaSpec> = {
  reports: {
    title: "Báo cáo vi phạm",
    description:
      "Xem báo cáo từ người dùng, thông tin đối tượng, bằng chứng và kết quả đã ghi nhận.",
    listTitle: "Báo cáo gần đây",
    columns: ["Đối tượng bị báo cáo", "Nội dung tóm tắt", "Thời điểm gửi", "Trạng thái"],
    note: "Dữ liệu báo cáo và người gửi dưới đây là hư cấu, chỉ dùng minh họa giao diện.",
    rows: [
      {
        cells: [
          "Tin tuyển dụng · Kế toán tổng hợp",
          "Yêu cầu ứng viên nộp phí hồ sơ",
          "19/10/2026 09:42",
          "Mới tiếp nhận",
        ],
        status: "Mới tiếp nhận",
        searchable: "Tin tuyển dụng Kế toán tổng hợp yêu cầu ứng viên nộp phí hồ sơ",
      },
      {
        cells: [
          "Công ty · Minh An Logistics",
          "Nghi ngờ thông tin tuyển dụng không chính xác",
          "19/10/2026 08:16",
          "Đang xem xét",
        ],
        status: "Đang xem xét",
        searchable: "Công ty Minh An Logistics thông tin tuyển dụng không chính xác",
      },
      {
        cells: [
          "Tin tuyển dụng · Nhân viên kinh doanh",
          "Mô tả có dấu hiệu phân biệt đối xử",
          "18/10/2026 16:27",
          "Đã ghi nhận",
        ],
        status: "Đã ghi nhận",
        searchable: "Tin tuyển dụng Nhân viên kinh doanh phân biệt đối xử",
      },
      {
        cells: [
          "Công ty · Hợp Nhất Services",
          "Đăng tin trùng lặp nhiều lần",
          "18/10/2026 14:03",
          "Mới tiếp nhận",
        ],
        status: "Mới tiếp nhận",
        searchable: "Công ty Hợp Nhất Services đăng tin trùng lặp",
      },
    ],
  },
  jobs: {
    title: "Kiểm soát tin tuyển dụng",
    description: "Quản lý tin đã đăng, trạng thái hiển thị và lịch sử xử lý sau khi công khai.",
    listTitle: "Tin tuyển dụng gần đây",
    columns: ["Chức danh", "Doanh nghiệp", "Ngành nghề", "Trạng thái", "Ngày đăng"],
    note: "Tin và trạng thái minh họa. Các thao tác ẩn hoặc công khai lại chưa kết nối backend.",
    rows: [
      {
        cells: [
          "Kế toán công nợ",
          "An Phúc Retail",
          "Kế toán · Tài chính",
          "Đang công khai",
          "19/10/2026",
        ],
        status: "Đang công khai",
        statusIndex: 3,
        searchable: "Kế toán công nợ An Phúc Retail kế toán tài chính",
      },
      {
        cells: [
          "Chuyên viên tuyển dụng",
          "Mộc Lan Foods",
          "Nhân sự",
          "Đang công khai",
          "18/10/2026",
        ],
        status: "Đang công khai",
        statusIndex: 3,
        searchable: "Chuyên viên tuyển dụng Mộc Lan Foods nhân sự",
      },
      {
        cells: [
          "Nhân viên bán hàng",
          "Đông Dương Home",
          "Bán lẻ · Kinh doanh",
          "Đã ẩn",
          "16/10/2026",
        ],
        status: "Đã ẩn",
        statusIndex: 3,
        searchable: "Nhân viên bán hàng Đông Dương Home bán lẻ kinh doanh đã ẩn",
      },
      {
        cells: [
          "Điều phối vận tải",
          "Minh An Logistics",
          "Vận hành · Logistics",
          "Đang công khai",
          "15/10/2026",
        ],
        status: "Đang công khai",
        statusIndex: 3,
        searchable: "Điều phối vận tải Minh An Logistics vận hành logistics",
      },
    ],
  },
  accounts: {
    title: "Quản lý tài khoản",
    description: "Tra cứu tài khoản cá nhân hoặc doanh nghiệp và xem trạng thái hiện tại.",
    listTitle: "Tài khoản mẫu",
    columns: ["Tên hiển thị", "Email", "Loại tài khoản", "Trạng thái", "Cập nhật"],
    note: "Toàn bộ tên và địa chỉ email là dữ liệu hư cấu. Không có chức năng khóa tài khoản thật.",
    rows: [
      {
        cells: [
          "Nguyễn Thu Hà",
          "ha.nguyen@example.test",
          "Ứng viên",
          "Hoạt động",
          "19/10/2026 08:20",
        ],
        status: "Hoạt động",
        statusIndex: 3,
        searchable: "Nguyễn Thu Hà ha.nguyen@example.test ứng viên hoạt động",
      },
      {
        cells: [
          "An Phúc Retail",
          "hr@anphuc.example.test",
          "Nhà tuyển dụng",
          "Hoạt động",
          "18/10/2026 15:12",
        ],
        status: "Hoạt động",
        statusIndex: 3,
        searchable: "An Phúc Retail hr nhà tuyển dụng hoạt động",
      },
      {
        cells: [
          "Trần Quốc Bảo",
          "bao.tran@example.test",
          "Ứng viên",
          "Tạm khóa",
          "18/10/2026 11:04",
        ],
        status: "Tạm khóa",
        statusIndex: 3,
        searchable: "Trần Quốc Bảo bao.tran@example.test ứng viên tạm khóa",
      },
      {
        cells: [
          "Mộc Lan Foods",
          "people@moclan.example.test",
          "Nhà tuyển dụng",
          "Chờ xác minh",
          "17/10/2026 09:36",
        ],
        status: "Chờ xác minh",
        statusIndex: 3,
        searchable: "Mộc Lan Foods people nhà tuyển dụng chờ xác minh",
      },
    ],
  },
  monitoring: {
    title: "Giám sát hệ thống",
    description:
      "Theo dõi số người trực tuyến, yêu cầu mỗi phút, lỗi, tài nguyên máy chủ và kết nối cơ sở dữ liệu.",
    listTitle: "Chỉ số vận hành mẫu",
    columns: ["Chỉ số", "Giá trị minh họa", "Khoảng thời gian", "Tình trạng"],
    note: "Các con số được tạo để minh họa cách trình bày, không phản ánh tình trạng hệ thống hiện tại.",
    rows: [
      {
        cells: ["Người dùng trực tuyến", "128 người", "Hiện tại", "Trong ngưỡng"],
        status: "Trong ngưỡng",
        searchable: "người dùng trực tuyến 128",
        periodValues: {
          "1 giờ": "128 người",
          "24 giờ": "121 người (TB)",
          "7 ngày": "116 người (TB)",
        },
      },
      {
        cells: ["Yêu cầu mỗi phút", "846 req/min", "5 phút gần nhất", "Trong ngưỡng"],
        status: "Trong ngưỡng",
        searchable: "yêu cầu mỗi phút 846",
        periodValues: {
          "1 giờ": "846 req/min",
          "24 giờ": "712 req/min (TB)",
          "7 ngày": "684 req/min (TB)",
        },
      },
      {
        cells: ["Tỷ lệ lỗi", "0,8%", "1 giờ gần nhất", "Cần theo dõi"],
        status: "Cần theo dõi",
        searchable: "tỷ lệ lỗi 0,8 cần theo dõi",
        periodValues: { "1 giờ": "0,8%", "24 giờ": "0,6%", "7 ngày": "0,7%" },
      },
      {
        cells: ["Bộ nhớ máy chủ", "67%", "Hiện tại", "Trong ngưỡng"],
        status: "Trong ngưỡng",
        searchable: "bộ nhớ máy chủ 67",
        periodValues: { "1 giờ": "67%", "24 giờ": "64% (TB)", "7 ngày": "62% (TB)" },
      },
      {
        cells: ["Kết nối cơ sở dữ liệu", "Đang kết nối", "Cập nhật 10:42", "Bình thường"],
        status: "Bình thường",
        searchable: "kết nối cơ sở dữ liệu bình thường",
        periodValues: { "1 giờ": "Đang kết nối", "24 giờ": "Ổn định", "7 ngày": "Ổn định" },
      },
    ],
  },
  tasks: {
    title: "Tác vụ nền",
    description: "Theo dõi lịch chạy, kết quả và lịch sử thực thi của tác vụ nền.",
    listTitle: "Lịch chạy mẫu",
    columns: ["Tác vụ", "Lịch chạy", "Lần chạy gần nhất", "Kết quả"],
    note: "Lịch chạy và kết quả minh họa. Nút kích hoạt chưa kết nối với hàng đợi tác vụ.",
    rows: [
      {
        cells: [
          "Đồng bộ danh mục ngành nghề",
          "Mỗi ngày · 02:00",
          "19/10/2026 02:00",
          "Hoàn tất · 18 giây",
        ],
        status: "Hoàn tất",
        searchable: "đồng bộ danh mục ngành nghề mỗi ngày hoàn tất",
      },
      {
        cells: [
          "Gửi email nhắc hồ sơ",
          "Mỗi ngày · 08:30",
          "19/10/2026 08:30",
          "Hoàn tất · 42 giây",
        ],
        status: "Hoàn tất",
        searchable: "gửi email nhắc hồ sơ hàng ngày hoàn tất",
      },
      {
        cells: ["Dọn phiên hết hạn", "Mỗi giờ", "19/10/2026 10:00", "Đang chạy"],
        status: "Đang chạy",
        searchable: "dọn phiên hết hạn mỗi giờ đang chạy",
      },
      {
        cells: [
          "Tổng hợp báo cáo tuần",
          "Thứ Hai · 06:00",
          "12/10/2026 06:00",
          "Thất bại · Thử lại lúc 11:00",
        ],
        status: "Thất bại",
        searchable: "tổng hợp báo cáo tuần thất bại thử lại",
      },
    ],
  },
};

export function AdminDraftPage({ area }: { area: DraftAdminArea }) {
  const spec = AREAS[area];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [period, setPeriod] = useState("1 giờ");
  const [sampleRows, setSampleRows] = useState(spec.rows);
  const [selectedRow, setSelectedRow] = useState<SampleRow | null>(null);
  const [actionType, setActionType] = useState<"hide" | "restore" | "lock" | "unlock" | null>(null);
  const [reason, setReason] = useState("");
  const [lockDuration, setLockDuration] = useState<"temporary" | "permanent">("temporary");
  const [lockUntil, setLockUntil] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [acceptedTasks, setAcceptedTasks] = useState<string[]>([]);

  useEffect(() => {
    setSampleRows(spec.rows);
    setQuery("");
    setStatusFilter("ALL");
    setPeriod("1 giờ");
    setSelectedRow(null);
    setActionType(null);
    setActionNotice("");
    setAcceptedTasks([]);
  }, [spec]);

  const availableStatuses = useMemo(
    () => Array.from(new Set(sampleRows.map((row) => row.status).filter(Boolean))) as string[],
    [sampleRows],
  );
  const rows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi-VN");
    return sampleRows.filter((row) => {
      const matchesQuery =
        !normalized || row.searchable.toLocaleLowerCase("vi-VN").includes(normalized);
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, sampleRows, statusFilter]);

  const pagination = useListPagination(rows, JSON.stringify([area, query, statusFilter]));

  function openDetails(row: SampleRow) {
    setSelectedRow(row);
    setActionType(null);
    setReason("");
    setActionError("");
    setActionNotice("");
  }

  function beginAction(type: "hide" | "restore" | "lock" | "unlock") {
    setActionType(type);
    setReason("");
    setActionError("");
    setActionNotice("");
  }

  function confirmLocalAction() {
    if (!selectedRow || !actionType) return;
    if (!reason.trim()) {
      setActionError("Hãy nhập lý do trước khi tiếp tục.");
      return;
    }
    if (
      actionType === "lock" &&
      lockDuration === "temporary" &&
      (!lockUntil || lockUntil <= todayInVietnam())
    ) {
      setActionError("Chọn thời hạn khóa lớn hơn ngày hôm nay.");
      return;
    }

    const nextStatus =
      actionType === "hide"
        ? "Đã ẩn"
        : actionType === "restore"
          ? "Đang công khai"
          : actionType === "lock"
            ? lockDuration === "temporary"
              ? "Tạm khóa"
              : "Khóa vĩnh viễn"
            : "Hoạt động";
    const statusIndex =
      selectedRow.statusIndex ?? (area === "jobs" || area === "accounts" ? 3 : -1);
    const updatedRow: SampleRow = {
      ...selectedRow,
      status: nextStatus,
      actionReason: reason.trim(),
      lockUntil: actionType === "lock" && lockDuration === "temporary" ? lockUntil : undefined,
      cells:
        statusIndex >= 0
          ? selectedRow.cells.map((cell, index) => (index === statusIndex ? nextStatus : cell))
          : selectedRow.cells,
      searchable: `${selectedRow.searchable} ${nextStatus}`,
    };
    setSampleRows((current) =>
      current.map((row) => (row.searchable === selectedRow.searchable ? updatedRow : row)),
    );
    setSelectedRow(updatedRow);
    setActionType(null);
    setReason("");
    setActionNotice(`${nextStatus} · thao tác chỉ áp dụng cho dữ liệu mẫu trên trang này.`);
  }

  function activateTask() {
    if (!selectedRow) return;
    setAcceptedTasks((current) =>
      current.includes(selectedRow.searchable) ? current : [...current, selectedRow.searchable],
    );
    setActionNotice("Yêu cầu kích hoạt mẫu đã được tiếp nhận; không gửi tới backend.");
  }

  const taskAlreadyAccepted = selectedRow ? acceptedTasks.includes(selectedRow.searchable) : false;
  const periodOptions = ["1 giờ", "24 giờ", "7 ngày"];
  const extraDetails = selectedRow
    ? area === "reports"
      ? [
          { label: "Người gửi", value: "Tài khoản người dùng minh họa" },
          { label: "Bằng chứng", value: "Không có tệp đính kèm trong dữ liệu mẫu" },
          {
            label: "Kết quả xử lý",
            value: selectedRow.status === "Đã ghi nhận" ? "Đã ghi nhận (mẫu)" : "Chưa xử lý (mẫu)",
          },
        ]
      : area === "jobs"
        ? [
            {
              label: "Lý do ẩn",
              value:
                selectedRow.status === "Đã ẩn"
                  ? (selectedRow.actionReason ?? "Nội dung cần được rà soát thêm (mẫu)")
                  : selectedRow.actionReason
                    ? `Lý do cập nhật gần nhất: ${selectedRow.actionReason}`
                    : "Chưa ẩn",
            },
            { label: "Lịch sử", value: "Tin đăng và cập nhật trạng thái minh họa" },
          ]
        : area === "accounts"
          ? [
              {
                label: "Thông tin khóa",
                value: ["Tạm khóa", "Khóa vĩnh viễn"].includes(selectedRow.status ?? "")
                  ? `${selectedRow.actionReason ?? "Lý do khóa minh họa"}${selectedRow.lockUntil ? ` · đến ${selectedRow.lockUntil}` : ""} · chỉ lưu trong phiên`
                  : "Không có thông tin khóa",
              },
            ]
          : area === "monitoring"
            ? [
                { label: "Khoảng thời gian", value: period },
                { label: "Ngưỡng cảnh báo", value: "Chưa cấu hình trong dữ liệu mẫu" },
                { label: "Nguồn dữ liệu", value: "Giá trị minh họa, không phải số đo trực tiếp" },
              ]
            : [
                { label: "Thông tin lần chạy", value: selectedRow.cells[2] },
                {
                  label: "Thông tin lỗi",
                  value:
                    selectedRow.status === "Thất bại"
                      ? "Lỗi thử nghiệm trong dữ liệu mẫu"
                      : "Không có lỗi mẫu",
                },
              ]
    : [];

  return (
    <AdminShell title={spec.title} role="admin">
      <div className="admin-page-heading">
        <div>
          <h1>{spec.title}</h1>
          <p>{spec.description}</p>
        </div>
        <span className="admin-draft-label admin-sample-label">
          <Database size={13} aria-hidden="true" /> Dữ liệu minh họa
        </span>
      </div>
      <div className="admin-sample-banner" role="note">
        <CircleHelp size={17} aria-hidden="true" />
        <p>
          <strong>Chế độ xem mẫu.</strong> {spec.note} Không có thao tác nào ở trang này ghi dữ liệu
          lên hệ thống.
        </p>
      </div>
      <section className="admin-panel admin-sample-panel" aria-labelledby={`${area}-list-title`}>
        <div className="admin-panel-heading">
          <h2 id={`${area}-list-title`}>{spec.listTitle}</h2>
          <span>
            {rows.length} / {sampleRows.length} bản ghi mẫu
          </span>
        </div>
        <div className="admin-sample-toolbar">
          <ListSearch
            value={query}
            onChange={setQuery}
            label="Tìm trong dữ liệu mẫu"
            count={rows.length}
          />
          {availableStatuses.length > 1 && (
            <label className="admin-sample-filter">
              Trạng thái
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">Tất cả</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {rows.length ? (
          <div
            className="admin-table-scroll"
            role="region"
            aria-label={spec.listTitle}
            tabIndex={0}
          >
            <table className="admin-record-table admin-sample-table">
              <caption className="sr-only">{spec.listTitle}</caption>
              <thead>
                <tr>
                  {spec.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((row) => (
                  <tr key={row.searchable}>
                    {row.cells.map((cell, index) => (
                      <td key={`${row.searchable}-${index}`}>
                        {index === (row.statusIndex ?? row.cells.length - 1) && row.status ? (
                          <StaffStatusBadge tone={statusTone(row.status)}>{cell}</StaffStatusBadge>
                        ) : area === "monitoring" && index === 1 ? (
                          (row.periodValues?.[period] ?? cell)
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        className="admin-sample-detail-button"
                        onClick={() => openDetails(row)}
                      >
                        <Eye size={15} aria-hidden="true" /> Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-sample-empty">
            <Search size={20} aria-hidden="true" />
            <h3>Không tìm thấy kết quả</h3>
            <p>Thử từ khóa khác hoặc xóa nội dung tìm kiếm.</p>
          </div>
        )}
        <AdminPagination
          totalItems={rows.length}
          page={pagination.page}
          onPageChange={pagination.onPageChange}
          label={`Phân trang ${spec.listTitle.toLowerCase()}`}
        />
      </section>

      <Dialog
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRow(null);
            setActionType(null);
          }
        }}
      >
        {selectedRow && (
          <DialogContent
            className="admin-sample-dialog"
            aria-describedby="admin-sample-detail-description"
          >
            <div className="admin-sample-dialog-heading">
              <div>
                <DialogTitle>{selectedRow.cells[0]}</DialogTitle>
                <p id="admin-sample-detail-description">Chi tiết bản ghi minh họa</p>
              </div>
              {selectedRow.status && (
                <StaffStatusBadge tone={statusTone(selectedRow.status)}>
                  {selectedRow.status}
                </StaffStatusBadge>
              )}
            </div>
            {actionNotice && (
              <p className="admin-sample-action-notice" role="status">
                {actionNotice}
              </p>
            )}
            {!actionType ? (
              <>
                {area === "monitoring" && (
                  <label className="admin-sample-period">
                    Khoảng thời gian
                    <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                      {periodOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                )}
                <dl className="admin-sample-detail-fields">
                  {spec.columns.map((column, index) => (
                    <div key={column}>
                      <dt>{column}</dt>
                      <dd>
                        {area === "monitoring" && index === 1
                          ? (selectedRow.periodValues?.[period] ?? selectedRow.cells[index])
                          : selectedRow.cells[index]}
                      </dd>
                    </div>
                  ))}
                  {extraDetails.map((detail) => (
                    <div key={detail.label}>
                      <dt>{detail.label}</dt>
                      <dd>{detail.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="admin-sample-dialog-actions">
                  {area === "jobs" && selectedRow.status === "Đang công khai" && (
                    <button
                      type="button"
                      className="admin-secondary-action"
                      onClick={() => beginAction("hide")}
                    >
                      <ShieldOff size={15} /> Ẩn tin mẫu
                    </button>
                  )}
                  {area === "jobs" && selectedRow.status === "Đã ẩn" && (
                    <button
                      type="button"
                      className="admin-primary-action"
                      onClick={() => beginAction("restore")}
                    >
                      <ShieldCheck size={15} /> Công khai lại mẫu
                    </button>
                  )}
                  {area === "accounts" && selectedRow.status === "Hoạt động" && (
                    <button
                      type="button"
                      className="admin-secondary-action"
                      onClick={() => beginAction("lock")}
                    >
                      <ShieldOff size={15} /> Khóa tài khoản mẫu
                    </button>
                  )}
                  {area === "accounts" &&
                    ["Tạm khóa", "Khóa vĩnh viễn"].includes(selectedRow.status ?? "") && (
                      <button
                        type="button"
                        className="admin-primary-action"
                        onClick={() => beginAction("unlock")}
                      >
                        <ShieldCheck size={15} /> Mở khóa mẫu
                      </button>
                    )}
                  {area === "tasks" && selectedRow.status !== "Đang chạy" && (
                    <button
                      type="button"
                      className="admin-primary-action"
                      onClick={activateTask}
                      disabled={taskAlreadyAccepted}
                    >
                      <Play size={15} />{" "}
                      {taskAlreadyAccepted ? "Đã tiếp nhận yêu cầu mẫu" : "Kích hoạt tác vụ mẫu"}
                    </button>
                  )}
                </div>
                {area === "reports" && (
                  <p className="admin-sample-readonly-note">
                    Phạm vi màn hình này là xem báo cáo. Không có thao tác xử lý hoặc áp dụng hình
                    phạt.
                  </p>
                )}
              </>
            ) : (
              <div className="admin-sample-action-form">
                <h3>
                  {actionType === "hide"
                    ? "Ẩn tin tuyển dụng mẫu"
                    : actionType === "restore"
                      ? "Công khai lại tin mẫu"
                      : actionType === "lock"
                        ? "Khóa tài khoản mẫu"
                        : "Mở khóa tài khoản mẫu"}
                </h3>
                {actionType === "lock" && (
                  <>
                    <label htmlFor="sample-lock-duration">Thời hạn khóa</label>
                    <select
                      id="sample-lock-duration"
                      value={lockDuration}
                      onChange={(event) =>
                        setLockDuration(event.target.value as "temporary" | "permanent")
                      }
                    >
                      <option value="temporary">Tạm thời</option>
                      <option value="permanent">Vĩnh viễn</option>
                    </select>
                    {lockDuration === "temporary" && (
                      <>
                        <label htmlFor="sample-lock-until">Khóa đến ngày</label>
                        <input
                          id="sample-lock-until"
                          type="date"
                          value={lockUntil}
                          onChange={(event) => setLockUntil(event.target.value)}
                        />
                      </>
                    )}
                  </>
                )}
                <label htmlFor="sample-action-reason">
                  Lý do <span>Bắt buộc</span>
                </label>
                <textarea
                  id="sample-action-reason"
                  rows={4}
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setActionError("");
                  }}
                  placeholder="Nhập lý do cho thao tác mẫu"
                />
                {actionError && (
                  <p className="admin-review-error" role="alert">
                    {actionError}
                  </p>
                )}
                <div className="admin-sample-dialog-actions">
                  <button
                    type="button"
                    className="admin-secondary-action"
                    onClick={() => setActionType(null)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="admin-primary-action"
                    onClick={confirmLocalAction}
                  >
                    Xác nhận mẫu <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </AdminShell>
  );
}

function statusTone(status: string): StaffStatusTone {
  if (["Đang công khai", "Hoạt động", "Trong ngưỡng", "Bình thường", "Hoàn tất"].includes(status))
    return "verified";
  if (["Tạm khóa", "Khóa vĩnh viễn", "Thất bại"].includes(status)) return "rejected";
  if (["Đã ẩn", "Đã ghi nhận"].includes(status)) return "neutral";
  if (["Mới tiếp nhận", "Đang chạy"].includes(status)) return "info";
  return "pending";
}

export { AREAS };
