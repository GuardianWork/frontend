import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";
import {
  type CompanyVerificationRecord,
  getStoredVerificationRecord,
  saveStoredVerificationRecord,
  executeAdminDecision,
  lookupNationalRegistry,
} from "@/services/companyVerification";

export const Route = createFileRoute("/admin/verifications")({
  head: () => ({
    meta: [{ title: "Duyệt Pháp nhân — GuardianWork Admin" }],
  }),
  component: AdminVerificationsPage,
});

function AdminVerificationsPage() {
  const [record, setRecord] = useState<CompanyVerificationRecord>(getStoredVerificationRecord());
  const [modalOpen, setModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [rejectionCategory, setRejectionCategory] = useState("TAX_CODE_MISMATCH");
  const [rejectionReason, setRejectionReason] = useState(
    "Bản scan ĐKKD mờ con dấu đỏ và thiếu trang ngành nghề. Vui lòng tải lại bản scan rõ nét có dấu giáp lai.",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [zoomDoc, setZoomDoc] = useState(false);

  useEffect(() => {
    setRecord(getStoredVerificationRecord());
  }, []);

  const official = lookupNationalRegistry(record.taxCode);

  const handleOpenDecision = (type: "VERIFIED" | "REJECTED") => {
    setDecisionType(type);
    setModalOpen(true);
  };

  const handleExecuteDecision = async () => {
    setIsProcessing(true);
    setActionError(null);
    try {
      if (decisionType === "REJECTED" && rejectionReason.trim().length < 10) {
        throw new Error("Lý do từ chối tối thiểu 10 ký tự (BR-ADM-05).");
      }
      const updated = await executeAdminDecision(
        record.id,
        decisionType,
        decisionType === "REJECTED" ? rejectionReason : undefined,
        record.version,
      );
      setRecord(updated);
      setModalOpen(false);
      setActionSuccess(
        decisionType === "VERIFIED" ? "Phê duyệt thành công!" : "Đã ghi nhận từ chối.",
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToPending = () => {
    const updated: CompanyVerificationRecord = {
      ...record,
      verificationStatus: "PENDING",
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,
    };
    saveStoredVerificationRecord(updated);
    setRecord(updated);
    setActionSuccess("Đã đặt lại về PENDING.");
  };

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="p-2 rounded-lg bg-surface-container-low text-xs">
      <span className="text-charcoal-40 block mb-0.5">{label}</span>
      <strong className="text-charcoal-text">{value}</strong>
    </div>
  );

  return (
    <AdminShell title="Duyệt Pháp nhân" role="admin">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            UC-ADM-01
          </span>
          <h2 className="text-2xl font-bold text-charcoal-text tracking-tight font-display mt-1">
            Thẩm định KYB
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/recruiter/verification"
            className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-warm-border text-charcoal-text text-xs font-medium flex items-center gap-1"
          >
            <Icon name="visibility" className="!text-sm text-primary" /> Form
          </Link>
          <button
            type="button"
            onClick={handleResetToPending}
            className="px-3 py-1.5 rounded-lg bg-paper-white hover:bg-surface-container border border-warm-border text-charcoal-83 text-xs"
          >
            Reset PENDING
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionSuccess && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Icon name="check_circle" className="!text-base text-emerald-600" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess(null)}>
            <Icon name="close" className="!text-sm" />
          </button>
        </div>
      )}
      {actionError && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Icon name="error" className="!text-base text-red-600" />
            {actionError}
          </span>
          <button onClick={() => setActionError(null)}>
            <Icon name="close" className="!text-sm" />
          </button>
        </div>
      )}

      {/* Status + Actions */}
      <div className="mb-4 px-4 py-3 rounded-xl bg-paper-white border border-warm-border shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          {record.verificationStatus === "PENDING" && (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> PENDING
            </span>
          )}
          {record.verificationStatus === "VERIFIED" && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
              <Icon name="verified" className="!text-xs" /> VERIFIED
            </span>
          )}
          {record.verificationStatus === "REJECTED" && (
            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold">
              REJECTED
            </span>
          )}
          <span className="text-charcoal-40">
            v<strong className="font-mono text-charcoal-text">{record.version}</strong>
          </span>
          <span className="text-charcoal-40">
            #<strong className="font-mono text-primary">{record.ticketId}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenDecision("REJECTED")}
            className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex items-center gap-1.5"
          >
            <Icon name="close" className="!text-sm" /> Từ chối
          </button>
          <button
            type="button"
            onClick={() => handleOpenDecision("VERIFIED")}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Icon name="verified" className="!text-sm" /> Phê duyệt
          </button>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Submitted */}
        <div className="bg-paper-white p-4 rounded-xl border border-warm-border shadow-xs">
          <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-warm-border">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="font-bold text-xs text-charcoal-40 uppercase tracking-wider">
              Hồ sơ khai báo
            </h3>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-charcoal-40 block mb-0.5 text-xs">Tên doanh nghiệp</span>
              <strong className="text-sm text-charcoal-text font-display">{record.name}</strong>
              {record.englishName && (
                <span className="text-charcoal-40 block text-[11px]">{record.englishName}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Row
                label="MST"
                value={<span className="font-mono text-primary">{record.taxCode}</span>}
              />
              <Row
                label="Email"
                value={<span className="font-mono text-[11px] break-all">{record.email}</span>}
              />
            </div>
            <Row label="Địa chỉ" value={record.registeredAddress} />
            <div className="grid grid-cols-2 gap-2">
              <Row
                label="Đại diện PL"
                value={
                  <>
                    {record.legalRepresentative}
                    <span className="text-charcoal-40 block text-[11px] font-normal">
                      {record.representativeTitle}
                    </span>
                  </>
                }
              />
              <Row
                label="Vai trò nộp"
                value={
                  <span className="text-primary font-semibold">
                    {record.submitterRole === "LEGAL_REP" ? "Đại diện PL" : "HR ủy quyền"}
                  </span>
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Row
                label="Website"
                value={<span className="truncate block">{record.website}</span>}
              />
              <Row
                label="Liên hệ"
                value={
                  <>
                    {record.contactPerson}
                    <span className="text-charcoal-40 block text-[11px] font-normal">
                      {record.contactTitle}
                    </span>
                  </>
                }
              />
            </div>
          </div>
        </div>

        {/* Official Registry */}
        <div className="bg-paper-white p-4 rounded-xl border border-warm-border shadow-xs">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-warm-border">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-xs text-charcoal-40 uppercase tracking-wider">
                Cổng Quốc gia
              </h3>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
              LIVE
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <span className="text-emerald-700 block mb-0.5 text-xs">
                Tên pháp lý (Cơ quan QLKD)
              </span>
              <strong className="text-sm text-emerald-950 font-display">
                {official ? official.legalName : record.name}
              </strong>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-surface-container-low">
                <span className="text-charcoal-40 block mb-0.5">Tình trạng</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] inline-block">
                  HOẠT ĐỘNG
                </span>
              </div>
              <Row
                label="Mã số"
                value={
                  <span className="font-mono text-emerald-800">
                    {official ? official.taxCode : record.taxCode}
                  </span>
                }
              />
            </div>
            <Row
              label="Địa chỉ đăng ký"
              value={official ? official.registeredAddress : record.registeredAddress}
            />
            <div className="grid grid-cols-2 gap-2">
              <Row
                label="Đại diện hợp pháp"
                value={
                  <>
                    {official ? official.legalRepresentative : record.legalRepresentative}
                    <span className="text-charcoal-40 block text-[11px] font-normal">
                      {official ? official.representativeTitle : record.representativeTitle}
                    </span>
                  </>
                }
              />
              <Row
                label="Cơ quan cấp phép"
                value={official ? official.licensingAuthority : record.issuingAuthority}
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
              <span
                className={`px-2 py-1 rounded text-center font-semibold ${record.taxCode === (official?.taxCode ?? record.taxCode) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
              >
                {record.taxCode === (official?.taxCode ?? record.taxCode)
                  ? "✓ MST khớp"
                  : "✗ MST lệch"}
              </span>
              <span
                className={`px-2 py-1 rounded text-center font-semibold ${record.legalRepresentative === (official?.legalRepresentative ?? record.legalRepresentative) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
              >
                {record.legalRepresentative ===
                (official?.legalRepresentative ?? record.legalRepresentative)
                  ? "✓ Đại diện khớp"
                  : "⚠ Đại diện lệch"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Panel */}
      <div className="bg-paper-white p-4 rounded-xl border border-warm-border shadow-xs mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-warm-border">
          <h3 className="font-bold text-sm text-charcoal-text font-display flex items-center gap-2">
            <Icon name="document_scanner" className="!text-lg text-primary" /> Giấy phép ĐKKD
          </h3>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              OCR 98.4%
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              Rủi ro: Thấp
            </span>
            <button
              type="button"
              onClick={() => setZoomDoc(!zoomDoc)}
              className="px-2.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high border border-warm-border text-charcoal-text font-medium"
            >
              {zoomDoc ? "Thu nhỏ" : "Phóng to"}
            </button>
          </div>
        </div>

        <div
          className={`grid gap-4 items-start ${zoomDoc ? "grid-cols-1" : "grid-cols-1 md:grid-cols-12"}`}
        >
          <div className={zoomDoc ? "" : "md:col-span-7"}>
            <div className="relative rounded-xl border border-warm-border overflow-hidden bg-parchment-bg flex items-center justify-center p-3">
              <img
                src={record.registrationCertificateUrl}
                alt="Business Certificate"
                className="max-h-96 object-contain rounded-lg shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200";
                }}
              />
              <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-xs font-mono">
                <Icon name="verified" className="!text-xs text-emerald-400" /> Mộc đỏ hợp lệ
              </div>
            </div>
            {record.submitterRole === "AUTHORIZED_HR" && record.powerOfAttorneyUrl && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                <span className="text-primary font-semibold">Giấy ủy quyền HR</span>
                <a
                  href={record.powerOfAttorneyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-bold hover:underline flex items-center gap-0.5"
                >
                  Mở <Icon name="open_in_new" className="!text-xs" />
                </a>
              </div>
            )}
          </div>

          {!zoomDoc && (
            <div className="md:col-span-5 text-xs space-y-1.5">
              <h4 className="font-bold text-charcoal-text text-xs uppercase tracking-wider mb-2">
                Tiêu chuẩn duyệt
              </h4>
              {[
                "MST khớp ĐKKD",
                "Tên pháp lý",
                "Đang hoạt động",
                "Scan mộc đỏ",
                "Thẩm quyền/Ủy quyền",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] flex items-center justify-center font-mono shrink-0">
                      {i + 1}
                    </span>
                    {item}
                  </span>
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-white rounded-2xl border border-warm-border shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-warm-border">
              <div className="flex items-center gap-2">
                <Icon
                  name={decisionType === "VERIFIED" ? "verified" : "cancel"}
                  className={`!text-xl ${decisionType === "VERIFIED" ? "text-emerald-600" : "text-red-600"}`}
                />
                <h3 className="font-bold text-sm text-charcoal-text font-display">
                  {decisionType === "VERIFIED" ? "Xác nhận Phê duyệt" : "Xác nhận Từ chối"}
                </h3>
              </div>
              <button type="button" onClick={() => setModalOpen(false)}>
                <Icon name="close" className="!text-lg text-charcoal-40 hover:text-charcoal-text" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              {decisionType === "VERIFIED" ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <p>
                    • Trạng thái → <code className="font-mono">VERIFIED</code>
                  </p>
                  <p>• Cấp huy hiệu Verified Employer & mở đăng tin</p>
                  <p>
                    • Ghi <code className="font-mono">audit_logs</code> (Admin #901)
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-semibold mb-1 uppercase tracking-wide text-[11px]">
                      Nhóm lý do:
                    </label>
                    <select
                      value={rejectionCategory}
                      onChange={(e) => setRejectionCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-xs"
                    >
                      <option value="TAX_CODE_MISMATCH">MST không khớp ĐKKD</option>
                      <option value="NAME_MISMATCH">Tên pháp lý không khớp</option>
                      <option value="DOCUMENT_ALTERED">Tài liệu mờ / chỉnh sửa</option>
                      <option value="COMPANY_INACTIVE">Không đang hoạt động</option>
                      <option value="UNAUTHORIZED_REPRESENTATIVE">Thiếu Giấy ủy quyền HR</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="font-semibold uppercase tracking-wide text-[11px]">
                        Nội dung phản hồi <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-charcoal-40">
                        {rejectionReason.length} ký tự
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-3 rounded-lg border border-warm-border bg-parchment-bg text-xs leading-relaxed focus:outline-none focus:border-red-400"
                    />
                    {rejectionReason.trim().length < 10 && (
                      <p className="text-[10px] text-red-500 mt-1">
                        Tối thiểu 10 ký tự (BR-ADM-05)
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-warm-border flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-warm-border text-charcoal-83 hover:text-charcoal-text"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteDecision}
                disabled={
                  isProcessing ||
                  (decisionType === "REJECTED" && rejectionReason.trim().length < 10)
                }
                className={`px-5 py-1.5 rounded-lg text-white font-bold disabled:opacity-50 ${decisionType === "VERIFIED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {isProcessing
                  ? "Đang xử lý..."
                  : decisionType === "VERIFIED"
                    ? "Xác nhận Duyệt"
                    : "Gửi Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
