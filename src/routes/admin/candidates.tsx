import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/candidates")({
  head: () => ({
    meta: [
      { title: "Network Directory — GuardianWork Admin" },
      {
        name: "description",
        content:
          "Manage Seekers, Employers, and their compliance statuses across the GuardianWork network.",
      },
    ],
  }),
  component: CandidatesPage,
});

type Row = {
  name: string;
  email: string;
  initials?: string;
  type: "Seeker" | "Employer";
  status: "Verified" | "Pending Review" | "Suspended";
  last: string;
  flagged?: boolean;
  company?: boolean;
  pending?: boolean;
};

const ROWS: Row[] = [
  {
    name: "Nguyen Van An (Alex)",
    email: "an.nguyen@guardianwork.vn",
    initials: "NA",
    type: "Seeker",
    status: "Verified",
    last: "2 giờ trước",
  },
  {
    name: "Vellum Studio (Vietnam)",
    email: "admin@vellumstudio.vn",
    type: "Employer",
    status: "Verified",
    last: "Hôm qua",
    company: true,
  },
  {
    name: "Aura Systems Inc.",
    email: "hr@aurasystems.io",
    type: "Employer",
    status: "Pending Review",
    last: "3 giờ trước",
    company: true,
    pending: true,
  },
  {
    name: "Tran Minh Tri",
    email: "tri.tran@devmail.vn",
    initials: "TT",
    type: "Seeker",
    status: "Suspended",
    last: "4 ngày trước",
    flagged: true,
  },
];

function StatusDot({ status }: { status: Row["status"] }) {
  const color =
    status === "Verified"
      ? "bg-green-500"
      : status === "Pending Review"
        ? "bg-amber-500"
        : "bg-error";
  const text = status === "Suspended" ? "text-error" : "text-charcoal-text";
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className={`text-sm font-medium ${text}`}>{status}</span>
    </div>
  );
}

function CandidatesPage() {
  return (
    <AdminShell title="Network Directory" role="admin">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl md:text-4xl text-charcoal-text tracking-tight mb-2">
            Network Directory
          </h1>
          <p className="text-charcoal-83 text-base">
            Quản lý hồ sơ ứng viên IT, doanh nghiệp tuyển dụng và tình trạng thẩm định danh tính
            theo Bộ luật Lao động 2019.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-1.5 rounded-md bg-primary text-on-primary font-medium text-sm shadow-sm hover:bg-charcoal-83 transition-colors">
            Tất cả
          </button>
          <button className="px-4 py-1.5 rounded-md border border-warm-border bg-paper-white text-charcoal-text font-medium text-sm hover:bg-charcoal-04 transition-colors">
            Ứng viên IT
          </button>
          <button className="px-4 py-1.5 rounded-md border border-warm-border bg-paper-white text-charcoal-text font-medium text-sm hover:bg-charcoal-04 transition-colors">
            Doanh nghiệp
          </button>
          <button className="px-4 py-1.5 rounded-md border border-warm-border bg-paper-white text-charcoal-83 font-medium text-sm hover:bg-charcoal-04 transition-colors flex items-center">
            <Icon name="filter_list" className="!text-base mr-1.5" /> Bộ lọc
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-paper-white border border-warm-border rounded-md p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-32 h-32 bg-charcoal-04 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
          <h3 className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider mb-2">
            Tổng Người Dùng Mạng Lưới
          </h3>
          <div className="font-semibold text-3xl text-charcoal-text">14,208</div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center">
            <span className="text-green-600 font-semibold flex items-center mr-1">
              <Icon name="arrow_upward" className="!text-[14px]" /> 8.2%
            </span>
            so với tháng trước
          </div>
        </div>

        <div className="bg-paper-white border border-warm-border rounded-md p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-32 h-32 bg-charcoal-04 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
          <h3 className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider mb-2">
            Đang Chờ Rà Soát KYC
          </h3>
          <div className="font-semibold text-3xl text-charcoal-text">38</div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center">
            <span className="text-amber-600 font-semibold flex items-center mr-1">
              <Icon name="schedule" className="!text-[14px]" /> 12 ca khẩn
            </span>
            cần duyệt trong 24h
          </div>
        </div>

        <div className="bg-paper-white border border-warm-border rounded-md p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-32 h-32 bg-charcoal-04 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
          <h3 className="font-semibold text-charcoal-40 text-xs uppercase tracking-wider mb-2">
            Tỷ Lệ Xác Thực Thành Công
          </h3>
          <div className="font-semibold text-3xl text-charcoal-text">98.6%</div>
          <div className="mt-2 text-xs text-charcoal-83 flex items-center">
            <span className="text-green-600 font-semibold flex items-center mr-1">
              <Icon name="check_circle" className="!text-[14px]" /> Đạt chuẩn
            </span>
            Quy chuẩn định danh an toàn
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-paper-white border border-warm-border rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-warm-border bg-surface-container-low/50">
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider">
                  Thành viên / Đơn vị
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider">
                  Phân loại
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider">
                  Trạng thái Pháp lý
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider">
                  Hoạt động Gần nhất
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-charcoal-40 uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-border text-sm">
              {ROWS.map((r, i) => (
                <tr key={i} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {r.company ? (
                        <div className="w-9 h-9 rounded-md bg-surface-container border border-warm-border flex items-center justify-center text-primary shrink-0">
                          <Icon name="corporate_fare" className="!text-lg" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {r.initials}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-charcoal-text">{r.name}</div>
                        <div className="text-xs text-charcoal-40 font-mono">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-container text-charcoal-text">
                      {r.type === "Seeker" ? "Ứng viên IT" : "Doanh nghiệp"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusDot status={r.status} />
                  </td>
                  <td className="py-4 px-6 text-xs text-charcoal-83 font-mono">{r.last}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-xs font-medium text-primary hover:underline">
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
