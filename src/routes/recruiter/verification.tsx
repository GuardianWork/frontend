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
    meta: [{ title: "Xác thực Doanh nghiệp (KYB) — GuardianWork" }],
  }),
  component: CompanyVerificationPage,
});

function CompanyVerificationPage() {
  const [record, setRecord] = useState<CompanyVerificationRecord>(getStoredVerificationRecord());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [taxCode, setTaxCode] = useState(record.taxCode || "");
  const [companyName, setCompanyName] = useState(record.name || "");
  const [englishName, setEnglishName] = useState(record.englishName || "");
  const [email, setEmail] = useState(record.email || "");
  const [website, setWebsite] = useState(record.website || "");
  const [phone, setPhone] = useState(record.phone || "");
  const [registeredAddress, setRegisteredAddress] = useState(record.registeredAddress || "");
  const [city, setCity] = useState(record.city || "TP. Hồ Chí Minh");
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
  const [agreeCommitment, setAgreeCommitment] = useState(true);
  const [agreeNoFees, setAgreeNoFees] = useState(true);

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [registryResult, setRegistryResult] = useState<NationalRegistryRecord | null>(null);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState("");

  const isFreeEmail = /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/i.test(email.trim());

  useEffect(() => {
    setRecord(getStoredVerificationRecord());
  }, []);

  const handleLookupRegistry = () => {
    if (!taxCode.trim()) {
      setRegistryError("Vui lòng nhập MST.");
      return;
    }
    setRegistryError(null);
    setIsLookingUp(true);
    setTimeout(() => {
      const result = lookupNationalRegistry(taxCode);
      setIsLookingUp(false);
      if (result) {
        setRegistryResult(result);
      } else {
        setRegistryError("Không tìm thấy MST trên Cổng Quốc gia.");
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
    if (!certificateNumber) setCertificateNumber(registryResult.taxCode);
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
    setRegistryError(null);
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
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!taxCode.trim()) return setErrorMsg("Vui lòng nhập Mã số thuế.");
    if (!companyName.trim()) return setErrorMsg("Vui lòng nhập Tên pháp lý.");
    if (!email.trim() || !email.includes("@")) return setErrorMsg("Email không hợp lệ.");
    if (!certificateUrl.trim()) return setErrorMsg("Vui lòng tải lên Giấy ĐKKD.");
    if (submitterRole === "AUTHORIZED_HR" && !powerOfAttorneyUrl.trim())
      return setErrorMsg("Vui lòng tải lên Giấy ủy quyền.");
    if (!agreeCommitment || !agreeNoFees) return setErrorMsg("Vui lòng xác nhận cam kết.");

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
          district: record.district || "",
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
        setSuccessMsg("Đã nộp lại hồ sơ thành công!");
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
          district: record.district || "",
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
        setSuccessMsg(`Hồ sơ đã nộp! Mã phiếu #${res.ticketId}`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Field = ({
    label,
    required,
    children,
  }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-charcoal-text mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-warm-border bg-parchment-bg text-charcoal-text text-xs focus:outline-none focus:border-primary";

  return (
    <AdminShell title="Xác thực Doanh nghiệp" role="recruiter">
      {/* Demo bar */}
      <div className="mb-4 bg-paper-white px-3 py-2 rounded-xl border border-warm-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-charcoal-40">Trạng thái:</span>
          {(["REGISTERED", "PENDING", "REJECTED", "VERIFIED"] as VerificationStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSwitchStatusDemo(s)}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                record.verificationStatus === s
                  ? s === "VERIFIED"
                    ? "bg-emerald-600 text-white"
                    : s === "PENDING"
                      ? "bg-amber-500 text-white"
                      : s === "REJECTED"
                        ? "bg-red-600 text-white"
                        : "bg-primary text-on-primary"
                  : "text-charcoal-83 hover:text-charcoal-text"
              }`}
            >
              {s === "REGISTERED"
                ? "Mới"
                : s === "PENDING"
                  ? "Chờ"
                  : s === "REJECTED"
                    ? "Từ chối"
                    : "Duyệt"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-charcoal-40">Mẫu:</span>
          {[
            ["0316892341", "Guardian"],
            ["0108934522", "Vellum"],
            ["0401928374", "TechCorp"],
          ].map(([code, name]) => (
            <button
              key={code}
              type="button"
              onClick={() => handleApplySamplePreset(code)}
              className="px-1.5 py-0.5 rounded border border-warm-border bg-surface-container text-[11px] hover:bg-surface-container-high"
            >
              {name}
            </button>
          ))}
          <Link
            to="/admin/verifications"
            className="ml-1 text-primary text-[11px] font-semibold hover:underline"
          >
            Admin →
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-charcoal-text tracking-tight font-display">
          Xác thực Pháp nhân (KYB)
        </h2>
        <div className="shrink-0">
          {record.verificationStatus === "VERIFIED" && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 text-xs font-semibold">
              <Icon name="verified" className="!text-base text-emerald-600" /> Đã xác thực v
              {record.version}
            </span>
          )}
          {record.verificationStatus === "PENDING" && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5 text-xs font-semibold">
              <Icon name="hourglass_top" className="!text-base text-amber-600 animate-pulse" /> Chờ
              duyệt #{record.ticketId}
            </span>
          )}
          {record.verificationStatus === "REJECTED" && (
            <span className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-1.5 text-xs font-semibold">
              <Icon name="cancel" className="!text-base text-red-600" /> Cần điều chỉnh
            </span>
          )}
          {record.verificationStatus === "REGISTERED" && (
            <span className="px-3 py-1.5 rounded-xl bg-surface-container border border-warm-border text-charcoal-text flex items-center gap-1.5 text-xs font-semibold">
              <Icon name="edit_document" className="!text-base text-primary" /> Chưa xác thực
            </span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Icon name="check_circle" className="!text-base text-emerald-600" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)}>
            <Icon name="close" className="!text-sm" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Icon name="error" className="!text-base text-red-600" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)}>
            <Icon name="close" className="!text-sm" />
          </button>
        </div>
      )}

      {/* Status Banners */}
      {record.verificationStatus === "REJECTED" && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3">
          <Icon name="error" className="!text-lg text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong>Lý do từ chối:</strong>
            <p className="mt-1 p-2.5 bg-white/60 rounded-lg border border-red-200 font-medium text-red-950">
              {record.rejectionReason || "Hồ sơ chưa đạt tiêu chuẩn."}
            </p>
          </div>
        </div>
      )}
      {record.verificationStatus === "VERIFIED" && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Icon name="verified" className="!text-xl" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-emerald-900">Verified Employer</p>
              <p className="text-emerald-700 text-[11px]">
                #GW-VER-{record.id} •{" "}
                {record.verifiedAt
                  ? new Date(record.verifiedAt).toLocaleDateString("vi-VN")
                  : "Hôm nay"}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 text-[11px]">
            <span className="px-2 py-1 bg-white rounded-lg border border-emerald-200 text-emerald-800 font-semibold">
              ✓ Huy hiệu tích xanh
            </span>
            <span className="px-2 py-1 bg-white rounded-lg border border-emerald-200 text-emerald-800 font-semibold">
              ✓ Đăng tin
            </span>
          </div>
        </div>
      )}
      {record.verificationStatus === "PENDING" && (
        <div className="mb-4 p-3.5 rounded-xl bg-paper-white border border-warm-border text-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-warm-border mb-2.5">
            <span className="font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
              #{record.ticketId}
            </span>
            <span className="text-charcoal-83">
              SLA: <strong>24–48h làm việc</strong>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
              ✓ Tiếp nhận
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800 font-medium animate-pulse">
              ⏳ Đối soát QG
            </div>
            <div className="p-1.5 rounded-lg bg-surface-container-low text-charcoal-40">
              Giám định
            </div>
            <div className="p-1.5 rounded-lg bg-surface-container-low text-charcoal-40">
              Cấp huy hiệu
            </div>
          </div>
        </div>
      )}

      {/* Form + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
            {/* Section 1 */}
            <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-warm-border">
                <h3 className="font-bold text-sm text-charcoal-text font-display flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                    1
                  </span>
                  Doanh nghiệp & Mã số Thuế
                </h3>
                <button
                  type="button"
                  onClick={handleLookupRegistry}
                  disabled={isLookingUp}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-warm-border text-primary text-xs font-medium flex items-center gap-1"
                >
                  <Icon
                    name={isLookingUp ? "sync" : "travel_explore"}
                    className={`!text-sm ${isLookingUp ? "animate-spin" : ""}`}
                  />
                  {isLookingUp ? "Đang tra..." : "Tra Cổng QG"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <Field label="MST" required>
                  <div className="relative">
                    <input
                      type="text"
                      value={taxCode}
                      onChange={(e) => {
                        setTaxCode(e.target.value);
                        setRegistryResult(null);
                        setRegistryError(null);
                      }}
                      placeholder="VD: 0316892341"
                      maxLength={14}
                      className={`${inputCls} font-mono pr-16`}
                    />
                    <button
                      type="button"
                      onClick={handleLookupRegistry}
                      className="absolute right-1.5 top-1.5 px-2 py-0.5 rounded bg-primary text-on-primary text-[11px] font-medium"
                    >
                      Tra cứu
                    </button>
                  </div>
                </Field>
                <Field label="Website" required>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className={inputCls}
                  />
                </Field>
              </div>

              {registryResult && (
                <div className="mb-3.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-primary flex items-center gap-1">
                      <Icon name="verified" className="!text-sm" /> Cổng Quốc gia:
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyRegistryData}
                      className="px-2 py-0.5 rounded bg-primary text-on-primary text-[11px] font-medium"
                    >
                      Tự động điền
                    </button>
                  </div>
                  <p className="text-[11px] text-charcoal-83">
                    <strong>{registryResult.legalName}</strong> •{" "}
                    <span className="text-emerald-700 font-semibold">
                      {registryResult.statusText}
                    </span>
                  </p>
                  <p className="text-[11px] text-charcoal-83 truncate">
                    {registryResult.registeredAddress}
                  </p>
                </div>
              )}
              {registryError && (
                <div className="mb-3.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  {registryError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <Field label="Tên pháp lý (theo ĐKKD)" required>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="CÔNG TY CỔ PHẦN..."
                    className={`${inputCls} font-medium`}
                  />
                </Field>
                <Field label="Tên tiếng Anh / viết tắt">
                  <input
                    type="text"
                    value={englishName}
                    onChange={(e) => setEnglishName(e.target.value)}
                    placeholder="GUARDIAN TECH JSC"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <Field label="Địa chỉ trụ sở" required>
                    <input
                      type="text"
                      value={registeredAddress}
                      onChange={(e) => setRegisteredAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã..."
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="Tỉnh / Thành phố" required>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputCls}
                  >
                    <option>TP. Hồ Chí Minh</option>
                    <option>TP. Hà Nội</option>
                    <option>TP. Đà Nẵng</option>
                    <option>Bình Dương</option>
                    <option>Đồng Nai</option>
                    <option>Khác</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-warm-border">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                  2
                </span>
                <h3 className="font-bold text-sm text-charcoal-text font-display">
                  Người Đại diện & Liên hệ
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <Field label="Người đại diện pháp luật" required>
                  <input
                    type="text"
                    value={legalRepresentative}
                    onChange={(e) => setLegalRepresentative(e.target.value)}
                    placeholder="Nguyễn Văn An"
                    className={`${inputCls} font-medium`}
                  />
                </Field>
                <Field label="Chức danh" required>
                  <input
                    type="text"
                    value={representativeTitle}
                    onChange={(e) => setRepresentativeTitle(e.target.value)}
                    placeholder="Tổng Giám đốc"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="mb-3.5 p-3 rounded-lg bg-surface-container-low border border-warm-border text-xs">
                <span className="font-semibold text-charcoal-text block mb-2">
                  Vai trò người nộp:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(["LEGAL_REP", "AUTHORIZED_HR"] as SubmitterRole[]).map((role) => (
                    <label
                      key={role}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs ${
                        submitterRole === role
                          ? "bg-paper-white border-primary font-semibold text-primary"
                          : "border-warm-border text-charcoal-83"
                      }`}
                    >
                      <input
                        type="radio"
                        name="submitterRole"
                        checked={submitterRole === role}
                        onChange={() => setSubmitterRole(role)}
                      />
                      {role === "LEGAL_REP" ? "Người đại diện PL" : "Nhân sự ủy quyền (HR)"}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3.5">
                <Field label="Người liên hệ" required>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Lê Hoàng Lan"
                    className={inputCls}
                  />
                </Field>
                <Field label="Chức danh" required>
                  <input
                    type="text"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    placeholder="HR Lead"
                    className={inputCls}
                  />
                </Field>
                <Field label="Điện thoại" required>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="028 7300 8899"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Email công vụ" required>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className={`${inputCls} font-mono`}
                  />
                  {isFreeEmail && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-amber-600 font-medium">
                      ⚠ Gmail/Yahoo
                    </span>
                  )}
                </div>
              </Field>

              {submitterRole === "AUTHORIZED_HR" && (
                <div className="mt-3.5 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                  <label className="block font-semibold text-primary mb-1">
                    Giấy ủy quyền (có mộc đỏ) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={powerOfAttorneyUrl}
                      onChange={(e) => setPowerOfAttorneyUrl(e.target.value)}
                      placeholder="Liên kết tệp PDF / ảnh"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-warm-border bg-white text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewDocUrl(powerOfAttorneyUrl);
                        setPreviewDocTitle("Giấy Ủy quyền");
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-warm-border text-xs font-medium shrink-0"
                    >
                      Xem
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3 */}
            <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-warm-border">
                <h3 className="font-bold text-sm text-charcoal-text font-display flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                    3
                  </span>
                  Giấy phép ĐKKD
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDocUrl(certificateUrl);
                    setPreviewDocTitle("Giấy ĐKKD");
                  }}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Icon name="visibility" className="!text-sm" /> Xem scan
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-dashed border-warm-border bg-surface-container-low/50 text-center mb-3.5">
                <div className="flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 cursor-pointer">
                    Chọn tệp (PDF / PNG / JPG)
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
                    className="px-3 py-1.5 bg-paper-white border border-warm-border text-charcoal-text rounded-lg text-xs"
                  >
                    Xem mẫu
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3">
                <Field label="Số Giấy phép / MST" required>
                  <input
                    type="text"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    placeholder="0316892341"
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label="Ngày cấp" required>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Cơ quan cấp" required>
                  <input
                    type="text"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    placeholder="Sở KH & ĐT..."
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-charcoal-83 px-2 py-1 bg-surface-container-low rounded-lg">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  OCR: <strong>98.4%</strong>
                </span>
                <span>✓ Mộc đỏ hợp lệ</span>
                <span>Rủi ro: Thấp</span>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs text-xs">
              <h3 className="font-bold text-sm text-charcoal-text font-display mb-3 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                  4
                </span>
                Cam kết Tuân thủ
              </h3>
              <div className="space-y-2 text-charcoal-text">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeCommitment}
                    onChange={(e) => setAgreeCommitment(e.target.checked)}
                    className="text-primary rounded"
                  />
                  <span>Thông tin và tài liệu cung cấp là chính xác, đúng pháp nhân.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeNoFees}
                    onChange={(e) => setAgreeNoFees(e.target.checked)}
                    className="text-primary rounded"
                  />
                  <span>
                    Không thu phí tuyển dụng, tiền cọc hay đồng phục từ ứng viên (Điều 17 Luật LĐ).
                  </span>
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-paper-white rounded-xl border border-warm-border shadow-xs flex items-center justify-between gap-3 text-xs">
              <span className="text-charcoal-40 font-mono">v{record.version}</span>
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
                    className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? "Đang gửi..." : `Nộp lại (v${record.version + 1})`}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-primary hover:bg-charcoal-83 text-on-primary font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? "Đang gửi..." : "Nộp Hồ sơ"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4 text-xs">
          <div className="bg-paper-white p-4 rounded-xl border border-warm-border shadow-xs">
            <h4 className="font-bold text-charcoal-text font-display mb-2.5 flex items-center gap-1.5 text-sm">
              <Icon name="fact_check" className="!text-base text-primary" /> 5 Tiêu chuẩn
            </h4>
            <div className="space-y-1.5">
              {[
                "MST trùng khớp Cổng QG",
                "Tên pháp lý đúng ĐKKD",
                "Trạng thái Đang hoạt động",
                "Bản scan rõ mộc đỏ & giáp lai",
                "Thẩm quyền / Giấy ủy quyền",
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
          </div>

          <div className="bg-paper-white p-4 rounded-xl border border-warm-border shadow-xs">
            <h4 className="font-bold text-charcoal-text mb-2 flex items-center gap-1.5">
              <Icon name="shield" className="!text-base text-primary" /> 4 Cấp độ Tin cậy
            </h4>
            <div className="space-y-1 text-[11px] text-charcoal-83">
              {[
                ["T4", "Giấy ủy quyền / Đại diện"],
                ["T3", "Giám định scan ĐKKD"],
                ["T2", "Đối soát Cổng Quốc gia"],
                ["T1", "Email tên miền doanh nghiệp"],
              ].map(([tier, desc]) => (
                <div key={tier} className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-[10px] w-5 shrink-0">
                    {tier}
                  </span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-warm-border text-[11px] text-charcoal-83">
            <div className="font-semibold text-charcoal-text mb-1.5 flex items-center gap-1">
              <Icon name="support_agent" className="!text-sm text-primary" /> Hỗ trợ
            </div>
            <p>
              📞 <strong className="text-primary font-mono">028 7300 8899</strong>
            </p>
            <p>
              ✉ <span className="text-primary font-mono">kyb@guardianwork.com</span>
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox */}
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
