import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";
import {
  type CompanyVerificationRecord,
  type VerificationStatus,
  type SubmitterRole,
  type NationalRegistryRecord,
  getStoredVerificationRecord,
  saveStoredVerificationRecord,
  submitVerification,
  resubmitVerification,
  lookupNationalRegistry,
  NATIONAL_REGISTRY_DATABASE,
} from "@/services/companyVerification";

export const Route = createFileRoute("/recruiter/verification")({
  head: () => ({
    meta: [
      { title: "Xác thực Doanh nghiệp (KYB) — GuardianWork" },
      {
        name: "description",
        content: "Nộp hồ sơ xác thực pháp nhân doanh nghiệp theo chuẩn Trust & Safety.",
      },
    ],
  }),
  component: CompanyVerificationPage,
});

function CompanyVerificationPage() {
  const [record, setRecord] = useState<CompanyVerificationRecord>(getStoredVerificationRecord());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);

  // Form Fields State
  const [taxCode, setTaxCode] = useState(record.taxCode || "");
  const [companyName, setCompanyName] = useState(record.name || "");
  const [englishName, setEnglishName] = useState(record.englishName || "");
  const [email, setEmail] = useState(record.email || "");
  const [website, setWebsite] = useState(record.website || "");
  const [phone, setPhone] = useState(record.phone || "");
  const [registeredAddress, setRegisteredAddress] = useState(record.registeredAddress || "");
  const [city, setCity] = useState(record.city || "TP. Hồ Chí Minh");
  const [district, setDistrict] = useState(record.district || "Quận Bình Thạnh");
  const [legalRepresentative, setLegalRepresentative] = useState(record.legalRepresentative || "");
  const [representativeTitle, setRepresentativeTitle] = useState(
    record.representativeTitle || "Tổng Giám đốc",
  );
  const [submitterRole, setSubmitterRole] = useState<SubmitterRole>(
    record.submitterRole || "AUTHORIZED_HR",
  );
  const [contactPerson, setContactPerson] = useState(record.contactPerson || "");
  const [contactTitle, setContactTitle] = useState(
    record.contactTitle || "Trưởng phòng Tuyển dụng",
  );

  // Document Uploads State
  const [certificateUrl, setCertificateUrl] = useState(
    record.registrationCertificateUrl ||
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200",
  );
  const [certificateNumber, setCertificateNumber] = useState(
    record.certificateNumber || "0316892341",
  );
  const [issueDate, setIssueDate] = useState(record.issueDate || "2021-06-15");
  const [issuingAuthority, setIssuingAuthority] = useState(
    record.issuingAuthority || "Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh",
  );
  const [powerOfAttorneyUrl, setPowerOfAttorneyUrl] = useState(
    record.powerOfAttorneyUrl ||
      "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1200",
  );

  // Compliance Checkbox State
  const [agreeCommitment, setAgreeCommitment] = useState(true);
  const [agreeNoFees, setAgreeNoFees] = useState(true);

  // National Registry Lookup Tool
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [registryResult, setRegistryResult] = useState<NationalRegistryRecord | null>(null);
  const [registryLookupError, setRegistryLookupError] = useState<string | null>(null);

  // Document Inspection Preview Modal
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState("");

  const isFreeEmail = /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/i.test(email.trim());

  useEffect(() => {
    setRecord(getStoredVerificationRecord());
  }, []);

  const handleLookupRegistry = () => {
    if (!taxCode.trim()) {
      setRegistryLookupError("Vui lòng nhập Mã số thuế.");
      return;
    }
    setRegistryLookupError(null);
    setIsLookingUp(true);
    setTimeout(() => {
      const result = lookupNationalRegistry(taxCode);
      setIsLookingUp(false);
      if (result) {
        setRegistryResult(result);
      } else {
        setRegistryLookupError("Không tìm thấy MST trên Cổng Quốc gia. Vui lòng kiểm tra lại số.");
      }
    }, 500);
  };

  const handleApplyRegistryData = () => {
    if (!registryResult) return;
    setCompanyName(registryResult.legalName);
    setEnglishName(registryResult.internationalName);
    setRegisteredAddress(registryResult.registeredAddress);
    setLegalRepresentative(registryResult.legalRepresentative);
    setRepresentativeTitle(registryResult.representativeTitle);
    setIssuingAuthority(registryResult.licensingAuthority);
    if (!certificateNumber) {
      setCertificateNumber(registryResult.taxCode);
    }
  };

  const handleApplySamplePreset = (presetTaxCode: string) => {
    const sample = NATIONAL_REGISTRY_DATABASE[presetTaxCode];
    if (!sample) return;
    setTaxCode(sample.taxCode);
    setCompanyName(sample.legalName);
    setEnglishName(sample.internationalName);
    setRegisteredAddress(sample.registeredAddress);
    setLegalRepresentative(sample.legalRepresentative);
    setRepresentativeTitle(sample.representativeTitle);
    setIssuingAuthority(sample.licensingAuthority);
    setCertificateNumber(sample.taxCode);
    setEmail(`hr@${sample.shortName.toLowerCase().replace(/[^a-z0-9]/g, "")}.vn`);
    setWebsite(`https://${sample.shortName.toLowerCase().replace(/[^a-z0-9]/g, "")}.vn`);
    setContactPerson("Phạm Hải Yến");
    setContactTitle("Head of Talent Acquisition");
    setRegistryResult(sample);
    setRegistryLookupError(null);
  };

  const handleSwitchStatusDemo = (newStatus: VerificationStatus) => {
    const updated: CompanyVerificationRecord = {
      ...record,
      verificationStatus: newStatus,
      rejectionReason:
        newStatus === "REJECTED"
          ? "Bản scan ĐKKD mờ con dấu đỏ và thiếu trang ngành nghề. Vui lòng tải lại bản scan rõ nét."
          : null,
      verifiedBy: newStatus === "VERIFIED" ? 901 : null,
      verifiedAt: newStatus === "VERIFIED" ? new Date().toISOString() : null,
    };
    saveStoredVerificationRecord(updated);
    setRecord(updated);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccessMsg(null);
    setSubmitErrorMsg(null);

    if (!taxCode.trim()) {
      setSubmitErrorMsg("Vui lòng nhập Mã số thuế.");
      return;
    }
    if (!companyName.trim()) {
      setSubmitErrorMsg("Vui lòng nhập Tên pháp lý doanh nghiệp.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setSubmitErrorMsg("Email công vụ không hợp lệ.");
      return;
    }
    if (!certificateUrl.trim()) {
      setSubmitErrorMsg("Vui lòng tải lên Giấy phép ĐKKD.");
      return;
    }
    if (submitterRole === "AUTHORIZED_HR" && !powerOfAttorneyUrl.trim()) {
      setSubmitErrorMsg("Vui lòng tải lên Giấy ủy quyền tuyển dụng.");
      return;
    }
    if (!agreeCommitment || !agreeNoFees) {
      setSubmitErrorMsg("Vui lòng tích xác nhận các cam kết tuân thủ.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (record.verificationStatus === "REJECTED") {
        const res = await resubmitVerification(record.id, {
          name: companyName,
          englishName,
          email,
          website,
          phone,
          registeredAddress,
          city,
          district,
          legalRepresentative,
          representativeTitle,
          submitterRole,
          contactPerson,
          contactTitle,
          registrationCertificateUrl: certificateUrl,
          certificateNumber,
          issueDate,
          issuingAuthority,
          powerOfAttorneyUrl,
          expectedVersion: record.version,
        });
        setRecord(res);
        setSubmitSuccessMsg("Đã nộp lại hồ sơ thành công! Đang chờ kiểm duyệt.");
      } else {
        const res = await submitVerification({
          name: companyName,
          englishName,
          taxCode,
          email,
          website,
          phone,
          registeredAddress,
          city,
          district,
          legalRepresentative,
          representativeTitle,
          submitterRole,
          contactPerson,
          contactTitle,
          registrationCertificateUrl: certificateUrl,
          certificateNumber,
          issueDate,
          issuingAuthority,
          powerOfAttorneyUrl,
        });
        setRecord(res);
        setSubmitSuccessMsg(`Hồ sơ đã nộp thành công! Mã phiếu #${res.ticketId}`);
      }
    } catch (err: unknown) {
      setSubmitErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell title="Xác thực Doanh nghiệp" role="recruiter">
      {/* Compact Demo & State Switcher Bar */}
      <div className="mb-5 bg-paper-white px-4 py-2.5 rounded-xl border border-warm-border shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-charcoal-40">Mô phỏng trạng thái:</span>
          <div className="inline-flex rounded-lg border border-warm-border bg-surface-container-low p-0.5">
            <button
              type="button"
              onClick={() => handleSwitchStatusDemo("REGISTERED")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                record.verificationStatus === "REGISTERED"
                  ? "bg-primary text-on-primary font-bold shadow-xs"
                  : "text-charcoal-83 hover:text-charcoal-text"
              }`}
            >
              Mẫu mới
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStatusDemo("PENDING")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                record.verificationStatus === "PENDING"
                  ? "bg-amber-600 text-white font-bold shadow-xs"
                  : "text-charcoal-83 hover:text-charcoal-text"
              }`}
            >
              Chờ duyệt
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStatusDemo("REJECTED")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                record.verificationStatus === "REJECTED"
                  ? "bg-red-600 text-white font-bold shadow-xs"
                  : "text-charcoal-83 hover:text-charcoal-text"
              }`}
            >
              Bị từ chối
            </button>
            <button
              type="button"
              onClick={() => handleSwitchStatusDemo("VERIFIED")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                record.verificationStatus === "VERIFIED"
                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                  : "text-charcoal-83 hover:text-charcoal-text"
              }`}
            >
              Đã duyệt
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-charcoal-40">Mẫu:</span>
          <button
            type="button"
            onClick={() => handleApplySamplePreset("0316892341")}
            className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-charcoal-text text-[11px] font-medium border border-warm-border"
          >
            Guardian Tech
          </button>
          <button
            type="button"
            onClick={() => handleApplySamplePreset("0108934522")}
            className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-charcoal-text text-[11px] font-medium border border-warm-border"
          >
            Vellum
          </button>
          <button
            type="button"
            onClick={() => handleApplySamplePreset("0401928374")}
            className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-charcoal-text text-[11px] font-medium border border-warm-border"
          >
            TechCorp
          </button>
          <Link
            to="/admin/verifications"
            className="ml-1 text-primary hover:underline text-[11px] font-semibold flex items-center gap-0.5"
          >
            Admin Console →
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-charcoal-text tracking-tight font-display">
            Xác thực Pháp nhân Doanh nghiệp
          </h2>
          <p className="text-xs text-charcoal-83 mt-0.5">
            Xác thực thông tin và giấy phép ĐKKD để mở khóa đăng tin tuyển dụng và gắn huy hiệu
            Verified.
          </p>
        </div>

        {/* Current Status Pill */}
        <div className="shrink-0">
          {record.verificationStatus === "VERIFIED" && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
              <Icon name="verified" className="!text-base text-emerald-600" />
              <span>Đã xác thực (v{record.version})</span>
            </div>
          )}
          {record.verificationStatus === "PENDING" && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2 text-xs font-semibold">
              <Icon name="hourglass_top" className="!text-base text-amber-600 animate-pulse" />
              <span>Đang chờ duyệt #{record.ticketId}</span>
            </div>
          )}
          {record.verificationStatus === "REJECTED" && (
            <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 text-xs font-semibold">
              <Icon name="cancel" className="!text-base text-red-600" />
              <span>Cần điều chỉnh (v{record.version})</span>
            </div>
          )}
          {record.verificationStatus === "REGISTERED" && (
            <div className="px-3 py-1.5 rounded-xl bg-surface-container border border-warm-border text-charcoal-text flex items-center gap-2 text-xs font-semibold">
              <Icon name="edit_document" className="!text-base text-primary" />
              <span>Chưa xác thực</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {submitSuccessMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="check_circle" className="!text-base text-emerald-600" />
            <span>{submitSuccessMsg}</span>
          </div>
          <button onClick={() => setSubmitSuccessMsg(null)}>
            <Icon name="close" className="!text-sm" />
          </button>
        </div>
      )}

      {submitErrorMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="error" className="!text-base text-red-600" />
            <span>{submitErrorMsg}</span>
          </div>
          <button onClick={() => setSubmitErrorMsg(null)}>
            <Icon name="close" className="!text-sm" />
          </button>
        </div>
      )}

      {/* REJECTED: Concise Alert Banner */}
      {record.verificationStatus === "REJECTED" && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3">
          <Icon name="error" className="!text-lg text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <strong>Lý do từ chối từ Admin:</strong>
              <span className="font-mono text-[11px] text-red-700">v{record.version}</span>
            </div>
            <p className="mt-1 font-medium text-red-950 bg-white/60 p-2.5 rounded-lg border border-red-200">
              "
              {record.rejectionReason ||
                "Hồ sơ chưa đạt tiêu chuẩn. Vui lòng kiểm tra lại Giấy ĐKKD và MST."}
              "
            </p>
            <p className="mt-1.5 text-red-700 text-[11px]">
              Vui lòng sửa thông tin chưa đúng bên dưới và bấm <strong>"Cập nhật & Nộp lại"</strong>
              .
            </p>
          </div>
        </div>
      )}

      {/* VERIFIED: Compact Badge Box */}
      {record.verificationStatus === "VERIFIED" && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Icon name="verified" className="!text-2xl" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-900">
                Doanh nghiệp Đã Xác Thực (Verified Employer)
              </h4>
              <p className="text-emerald-700 text-[11px]">
                Mã xác thực: #GW-VER-{record.id} • Duyệt ngày:{" "}
                {record.verifiedAt
                  ? new Date(record.verifiedAt).toLocaleDateString("vi-VN")
                  : "Hôm nay"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
              ✓ Huy hiệu tích xanh
            </span>
            <span className="px-2.5 py-1 bg-white rounded-lg border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
              ✓ Đăng tin không giới hạn
            </span>
          </div>
        </div>
      )}

      {/* PENDING: Compact Ticket Tracker */}
      {record.verificationStatus === "PENDING" && (
        <div className="mb-5 p-4 rounded-xl bg-paper-white border border-warm-border shadow-xs text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-warm-border">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                Ticket #{record.ticketId}
              </span>
              <span className="text-charcoal-40">
                • Nộp lúc: {new Date(record.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <span className="text-charcoal-83 font-medium">
              SLA: <strong>24h - 48h làm việc</strong>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 text-center">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 font-medium text-[11px]">
              ✓ Tiếp nhận
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800 font-medium text-[11px] animate-pulse">
              ⏳ Đối soát Cổng QG
            </div>
            <div className="p-2 rounded-lg bg-surface-container-low text-charcoal-40 text-[11px]">
              Giám định ĐKKD
            </div>
            <div className="p-2 rounded-lg bg-surface-container-low text-charcoal-40 text-[11px]">
              Cấp huy hiệu
            </div>
          </div>
        </div>
      )}

      {/* Form & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Col 8 */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <form onSubmit={handleSubmitForm} className="flex flex-col gap-5">
            {/* SECTION 1: DOANH NGHIỆP & THUẾ */}
            <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-warm-border">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                    1
                  </span>
                  <h3 className="font-bold text-sm text-charcoal-text font-display">
                    Thông tin Doanh nghiệp & Mã số Thuế
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleLookupRegistry}
                  disabled={isLookingUp}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-warm-border text-primary text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Icon
                    name={isLookingUp ? "sync" : "travel_explore"}
                    className={`!text-sm ${isLookingUp ? "animate-spin" : ""}`}
                  />
                  {isLookingUp ? "Đang tra..." : "Tra cứu Cổng QG"}
                </button>
              </div>

              {/* MST & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Mã số thuế (MST) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={taxCode}
                      onChange={(e) => {
                        setTaxCode(e.target.value);
                        setRegistryResult(null);
                        setRegistryLookupError(null);
                      }}
                      placeholder="10 hoặc 13 số (VD: 0316892341)"
                      maxLength={14}
                      className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text font-mono text-xs focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleLookupRegistry}
                      className="absolute right-1.5 top-1.5 px-2 py-0.5 rounded bg-primary text-on-primary text-[11px] font-medium"
                    >
                      Tra cứu
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Website Doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Compact Registry Lookup Result */}
              {registryResult && (
                <div className="mb-3.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-primary flex items-center gap-1">
                      <Icon name="verified" className="!text-sm" /> Cổng Thông tin Quốc gia:
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyRegistryData}
                      className="px-2 py-0.5 rounded bg-primary text-on-primary text-[11px] font-medium hover:opacity-90"
                    >
                      Tự động điền thông tin
                    </button>
                  </div>
                  <div className="text-[11px] text-charcoal-83 space-y-0.5">
                    <p>
                      <strong>{registryResult.legalName}</strong> •{" "}
                      <span className="text-emerald-700 font-semibold">
                        {registryResult.statusText}
                      </span>
                    </p>
                    <p>
                      Đại diện: {registryResult.legalRepresentative} (
                      {registryResult.representativeTitle})
                    </p>
                    <p className="truncate">Địa chỉ: {registryResult.registeredAddress}</p>
                  </div>
                </div>
              )}

              {registryLookupError && (
                <div className="mb-3.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  {registryLookupError}
                </div>
              )}

              {/* Legal Name & English Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Tên Doanh nghiệp (theo ĐKKD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="VD: CÔNG TY CỔ PHẦN GUARDIAN TECH"
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Tên tiếng Anh / Tên viết tắt
                  </label>
                  <input
                    type="text"
                    value={englishName}
                    onChange={(e) => setEnglishName(e.target.value)}
                    placeholder="VD: GUARDIAN TECH JSC"
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Địa chỉ Trụ sở chính <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                    placeholder="Số nhà, đường, phường/xã..."
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Tỉnh / Thành phố <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="TP. Hà Nội">TP. Hà Nội</option>
                    <option value="TP. Đà Nẵng">TP. Đà Nẵng</option>
                    <option value="Bình Dương">Bình Dương</option>
                    <option value="Đồng Nai">Đồng Nai</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: NGƯỜI ĐẠI DIỆN & LIÊN HỆ */}
            <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-warm-border">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                  2
                </span>
                <h3 className="font-bold text-sm text-charcoal-text font-display">
                  Người Đại diện & Liên hệ
                </h3>
              </div>

              {/* Legal Rep Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Họ & Tên Người đại diện pháp luật <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={legalRepresentative}
                    onChange={(e) => setLegalRepresentative(e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Chức danh Người đại diện <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={representativeTitle}
                    onChange={(e) => setRepresentativeTitle(e.target.value)}
                    placeholder="Tổng Giám đốc / Giám đốc"
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Submitter Role Toggle */}
              <div className="mb-3.5 p-3 rounded-lg bg-surface-container-low border border-warm-border text-xs">
                <span className="font-semibold text-charcoal-text block mb-2">
                  Vai trò người nộp:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs ${
                      submitterRole === "LEGAL_REP"
                        ? "bg-paper-white border-primary font-semibold text-primary"
                        : "bg-transparent border-warm-border text-charcoal-83"
                    }`}
                  >
                    <input
                      type="radio"
                      name="submitterRole"
                      checked={submitterRole === "LEGAL_REP"}
                      onChange={() => setSubmitterRole("LEGAL_REP")}
                      className="text-primary"
                    />
                    <span>Người đại diện theo PL</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs ${
                      submitterRole === "AUTHORIZED_HR"
                        ? "bg-paper-white border-primary font-semibold text-primary"
                        : "bg-transparent border-warm-border text-charcoal-83"
                    }`}
                  >
                    <input
                      type="radio"
                      name="submitterRole"
                      checked={submitterRole === "AUTHORIZED_HR"}
                      onChange={() => setSubmitterRole("AUTHORIZED_HR")}
                      className="text-primary"
                    />
                    <span>Nhân sự được ủy quyền (HR)</span>
                  </label>
                </div>
              </div>

              {/* Contact Info & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Người liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="VD: Lê Hoàng Lan"
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Chức danh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    placeholder="VD: HR Lead"
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="028 7300 8899"
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Corporate Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-charcoal-text">
                    Email công vụ doanh nghiệp <span className="text-red-500">*</span>
                  </label>
                  {isFreeEmail && (
                    <span className="text-[11px] text-amber-700 font-medium">
                      ⚠️ Nên dùng email tên miền công ty
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recruiter@guardianwork.com"
                  className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text font-mono text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* If Authorized HR: Power of Attorney URL */}
              {submitterRole === "AUTHORIZED_HR" && (
                <div className="mt-3.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                  <label className="block font-semibold text-primary mb-1">
                    Giấy ủy quyền / Quyết định bổ nhiệm (có mộc đỏ){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={powerOfAttorneyUrl}
                      onChange={(e) => setPowerOfAttorneyUrl(e.target.value)}
                      placeholder="Liên kết tệp PDF hoặc ảnh Giấy ủy quyền"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-warm-border bg-white text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewDocUrl(powerOfAttorneyUrl);
                        setPreviewDocTitle("Giấy Ủy quyền Tuyển dụng");
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-warm-border text-xs font-medium shrink-0"
                    >
                      Xem mẫu
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: GIẤY PHÉP ĐKKD */}
            <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-warm-border">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                    3
                  </span>
                  <h3 className="font-bold text-sm text-charcoal-text font-display">
                    Giấy phép ĐKKD (Bản chụp / scan)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDocUrl(certificateUrl);
                    setPreviewDocTitle("Giấy chứng nhận Đăng ký Doanh nghiệp");
                  }}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Icon name="visibility" className="!text-sm" /> Xem bản scan
                </button>
              </div>

              {/* Dropzone */}
              <div className="p-4 rounded-xl border border-dashed border-warm-border bg-surface-container-low/50 text-center mb-3.5">
                <p className="text-xs font-medium text-charcoal-text">
                  Kéo thả tệp hoặc chọn tệp từ máy (PDF, PNG, JPG ≤ 10MB)
                </p>
                <div className="mt-2.5 flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 cursor-pointer">
                    Chọn tệp ĐKKD
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setCertificateUrl(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDocUrl(certificateUrl);
                      setPreviewDocTitle("Giấy ĐKKD Mẫu");
                    }}
                    className="px-3 py-1.5 bg-paper-white border border-warm-border text-charcoal-text rounded-lg text-xs font-medium"
                  >
                    Xem mẫu scan
                  </button>
                </div>
              </div>

              {/* License details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Số Giấy phép / MST <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    placeholder="VD: 0316892341"
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text font-mono text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Ngày cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-text mb-1">
                    Cơ quan cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    placeholder="Sở KH & ĐT..."
                    className="w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Compact OCR Status Tag */}
              <div className="flex items-center justify-between text-[11px] text-charcoal-83 px-2 py-1 bg-surface-container-low rounded-lg">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Độ khớp OCR: <strong>98.4%</strong>
                </span>
                <span>✓ Mộc đỏ hợp lệ • Rủi ro: Thấp</span>
              </div>
            </div>

            {/* SECTION 4: CAM KẾT */}
            <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs text-xs">
              <h3 className="font-bold text-sm text-charcoal-text font-display mb-3">
                4. Cam kết Tuân thủ
              </h3>
              <div className="space-y-2 text-charcoal-text">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeCommitment}
                    onChange={(e) => setAgreeCommitment(e.target.checked)}
                    className="text-primary rounded"
                  />
                  <span>Cam kết thông tin và tài liệu cung cấp là chính xác, đúng pháp nhân.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeNoFees}
                    onChange={(e) => setAgreeNoFees(e.target.checked)}
                    className="text-primary rounded"
                  />
                  <span>
                    Tuyệt đối không thu bất kỳ phí tuyển dụng, tiền cọc hay đồng phục từ ứng viên
                    (Điều 17 Luật LĐ).
                  </span>
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-paper-white rounded-xl border border-warm-border shadow-xs flex items-center justify-between gap-3 text-xs">
              <span className="text-charcoal-40 font-mono">Phiên bản: v{record.version}</span>
              <div className="flex items-center gap-2.5">
                <Link
                  to="/recruiter"
                  className="px-3.5 py-2 rounded-lg border border-warm-border text-charcoal-83 hover:text-charcoal-text"
                >
                  Hủy
                </Link>
                {record.verificationStatus === "REJECTED" ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Đang gửi..." : `Cập nhật & Nộp lại (v${record.version + 1})`}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-primary hover:bg-charcoal-83 text-on-primary font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Đang gửi..." : "Nộp Hồ sơ Xác thực"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Concise Checklist & Support: Col 4 */}
        <div className="lg:col-span-4 flex flex-col gap-4 text-xs">
          {/* Streamlined 5-Point Checklist */}
          <div className="bg-paper-white p-4 rounded-xl border border-warm-border shadow-xs">
            <h4 className="font-bold text-charcoal-text font-display mb-2.5 flex items-center gap-1.5">
              <Icon name="fact_check" className="!text-base text-primary" /> Tiêu chuẩn Thẩm định
              (5/5)
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span>1. Mã số thuế trùng khớp Cổng QG</span>
                <span className="text-emerald-700 font-bold">✓ Đạt</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span>2. Tên pháp lý đúng ĐKKD</span>
                <span className="text-emerald-700 font-bold">✓ Đạt</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span>3. Trạng thái Đang hoạt động</span>
                <span className="text-emerald-700 font-bold">✓ Đạt</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span>4. Bản scan rõ mộc đỏ & giáp lai</span>
                <span className="text-emerald-700 font-bold">✓ Đạt</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                <span>5. Thẩm quyền nộp / Giấy ủy quyền</span>
                <span className="text-emerald-700 font-bold">✓ Đạt</span>
              </div>
            </div>
          </div>

          {/* Compact Trust Tier Card */}
          <div className="bg-paper-white p-4 rounded-xl border border-warm-border shadow-xs">
            <h4 className="font-bold text-charcoal-text mb-2 flex items-center gap-1.5">
              <Icon name="shield" className="!text-base text-primary" /> Mô hình 4 Cấp độ Tin cậy
            </h4>
            <div className="space-y-1.5 text-charcoal-83 text-[11px]">
              <p>
                • <strong>Tier 4:</strong> Giấy ủy quyền / Thẩm quyền đại diện
              </p>
              <p>
                • <strong>Tier 3:</strong> Giám định bản scan ĐKKD & mộc đỏ
              </p>
              <p>
                • <strong>Tier 2:</strong> Đối soát Cổng Thông tin Quốc gia
              </p>
              <p>
                • <strong>Tier 1:</strong> Email công vụ tên miền doanh nghiệp
              </p>
            </div>
          </div>

          {/* Quick Support */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-warm-border text-[11px] text-charcoal-83">
            <div className="font-semibold text-charcoal-text mb-1 flex items-center gap-1">
              <Icon name="support_agent" className="!text-sm text-primary" /> Hỗ trợ Thẩm định
            </div>
            <p>
              Hotline: <strong className="text-primary font-mono">028 7300 8899</strong>
            </p>
            <p>
              Email: <span className="text-primary font-mono">kyb@guardianwork.com</span>
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-white rounded-2xl border border-warm-border shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-warm-border flex items-center justify-between bg-surface-container-low">
              <h4 className="font-bold text-xs text-charcoal-text">{previewDocTitle}</h4>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="text-charcoal-40 hover:text-charcoal-text"
              >
                <Icon name="close" className="!text-base" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1 flex items-center justify-center bg-parchment-bg">
              <img
                src={previewDocUrl}
                alt="Document Preview"
                className="max-h-[65vh] rounded-lg shadow-sm border border-warm-border object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200";
                }}
              />
            </div>
            <div className="px-4 py-2 border-t border-warm-border flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
