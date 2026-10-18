import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { VerificationUpload } from "@/components/VerificationUpload";
import { AdminShell, Icon } from "@/components/AdminShell";
import {
  type CompanyVerificationRecord,
  type VerificationStatus,
  type SubmitterRole,
  type NationalRegistryRecord,
  getStoredVerificationRecord,
  submitVerification,
  resubmitVerification,
  lookupNationalRegistry,
} from "@/services/companyVerification";

export const Route = createFileRoute("/recruiter/verification")({
  head: () => ({
    meta: [{ title: "Xác thực Doanh nghiệp (KYB) — GuardianWork" }],
  }),
  component: CompanyVerificationPage,
});

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-charcoal-text">
      <span className="mb-2 block font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function CompanyVerificationPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready)
    return (
      <AdminShell title="Cài đặt tài khoản" role="recruiter">
        <p role="status" className="text-sm text-charcoal-83">
          Đang tải hồ sơ doanh nghiệp…
        </p>
      </AdminShell>
    );
  return <CompanyVerificationForm />;
}

function CompanyVerificationForm() {
  const [activeSection, setActiveSection] = useState<"company" | "contact" | "documents">(
    "company",
  );
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
    record.registrationCertificateUrl?.startsWith("https://images.unsplash.com/")
      ? ""
      : record.registrationCertificateUrl || "",
  );
  const [certificateNumber, setCertificateNumber] = useState(record.certificateNumber || "");
  const [issueDate, setIssueDate] = useState(record.issueDate || "");
  const [issuingAuthority, setIssuingAuthority] = useState(record.issuingAuthority || "");
  const [powerOfAttorneyUrl, setPowerOfAttorneyUrl] = useState(
    record.powerOfAttorneyUrl?.startsWith("https://images.unsplash.com/")
      ? ""
      : record.powerOfAttorneyUrl || "",
  );
  const [agreeCommitment, setAgreeCommitment] = useState(false);
  const [agreeNoFees, setAgreeNoFees] = useState(false);

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [registryResult, setRegistryResult] = useState<NationalRegistryRecord | null>(null);
  const [registryError, setRegistryError] = useState<string | null>(null);

  const isFreeEmail = /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/i.test(email.trim());

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
        setRegistryError(
          "Không tìm thấy mã số thuế trong dữ liệu minh họa. Bạn có thể nhập thông tin công ty bên dưới.",
        );
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

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (record.verificationStatus === "PENDING" || record.verificationStatus === "VERIFIED") return;
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!/^\d{10}(?:-?\d{3})?$/.test(taxCode.trim())) {
      setActiveSection("company");
      return setErrorMsg("Mã số thuế cần có 10 hoặc 13 chữ số.");
    }
    if (!companyName.trim() || !registeredAddress.trim()) {
      setActiveSection("company");
      return setErrorMsg("Vui lòng nhập tên công ty và địa chỉ trụ sở.");
    }
    if (!contactPerson.trim() || !phone.trim()) {
      setActiveSection("contact");
      return setErrorMsg("Vui lòng nhập người liên hệ và số điện thoại.");
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setActiveSection("contact");
      return setErrorMsg("Email không hợp lệ.");
    }
    if (!legalRepresentative.trim() || !representativeTitle.trim() || !contactTitle.trim()) {
      setActiveSection("contact");
      return setErrorMsg("Vui lòng nhập đầy đủ thông tin người đại diện và người liên hệ.");
    }
    if (!certificateNumber.trim() || !issueDate || !issuingAuthority.trim()) {
      setActiveSection("documents");
      return setErrorMsg("Vui lòng điền số giấy phép, ngày cấp và cơ quan cấp.");
    }
    if (website.trim() && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(website.trim())) {
      setActiveSection("company");
      return setErrorMsg("Website cần có định dạng https://company.com.");
    }
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
        setSuccessMsg(`Đã nộp lại hồ sơ thành công! Bạn có thể theo dõi trạng thái tại đây.`);
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
        setSuccessMsg(
          `Đăng ký doanh nghiệp thành công! Mã phiếu #${res.ticketId}. Bạn có thể theo dõi trạng thái tại đây.`,
        );
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-warm-border bg-paper-white text-charcoal-text text-sm focus:outline-none focus:border-primary";

  return (
    <AdminShell title="Cài đặt tài khoản" role="recruiter">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-charcoal-text tracking-tight font-display">
            Cài đặt tài khoản
          </h2>
          <p className="text-xs text-charcoal-83 mt-0.5">
            Hoàn thiện thông tin và xác thực doanh nghiệp để bắt đầu hành trình tuyển dụng.
          </p>
        </div>
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
        <div
          role="status"
          className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2"
        >
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
        <div
          role="alert"
          className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2"
        >
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
            <p className="mt-1 p-2.5 bg-paper-white/60 rounded-lg border border-red-200 font-medium text-red-950">
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
            <span className="px-2 py-1 bg-paper-white rounded-lg border border-emerald-200 text-emerald-800 font-semibold">
              ✓ Huy hiệu tích xanh
            </span>
            <span className="px-2 py-1 bg-paper-white rounded-lg border border-emerald-200 text-emerald-800 font-semibold">
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
              Thời gian dự kiến: <strong>24–48h làm việc</strong>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
              ✓ Tiếp nhận
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800 font-medium animate-pulse">
              ⏳ Đang xét duyệt
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
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
        <nav
          aria-label="Cài đặt tài khoản"
          className="h-fit rounded-lg border border-warm-border bg-paper-white p-2"
        >
          <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal-40">
            Thông tin & xác thực
          </p>
          {(
            [
              { id: "company", label: "Thông tin công ty", icon: "business" },
              { id: "contact", label: "Thông tin người liên hệ", icon: "person" },
              { id: "documents", label: "Giấy đăng ký doanh nghiệp", icon: "description" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeSection === item.id ? "step" : undefined}
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm ${activeSection === item.id ? "bg-surface-container font-semibold text-primary" : "text-charcoal-83 hover:bg-surface-container-low"}`}
            >
              <Icon name={item.icon} className="!text-lg" />
              {item.label}
            </button>
          ))}
          <div className="m-3 border-t border-warm-border pt-4 text-xs leading-5 text-charcoal-83">
            Thông tin doanh nghiệp cần trùng khớp với giấy đăng ký doanh nghiệp đã cung cấp.
          </div>
        </nav>
        <div className="min-w-0">
          <form noValidate onSubmit={handleSubmitForm} className="flex flex-col gap-4">
            <fieldset
              disabled={
                isSubmitting ||
                record.verificationStatus === "PENDING" ||
                record.verificationStatus === "VERIFIED"
              }
              className="min-w-0 space-y-4"
            >
              {/* Section 1 */}
              <div
                hidden={activeSection !== "company"}
                className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-warm-border">
                  <h3 className="font-bold text-sm text-charcoal-text font-display flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                      1
                    </span>
                    Thông tin công ty
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
                    {isLookingUp ? "Đang tìm..." : "Tra cứu mẫu"}
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
                  <Field label="Website">
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
                        <Icon name="verified" className="!text-sm" /> Dữ liệu minh họa:
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
              <div
                hidden={activeSection !== "contact"}
                className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs"
              >
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-warm-border">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                    2
                  </span>
                  <h3 className="font-bold text-sm text-charcoal-text font-display">
                    Thông tin người liên hệ
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
              </div>

              {/* Section 3 */}
              <div
                hidden={activeSection !== "documents"}
                className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-warm-border">
                  <h3 className="font-bold text-sm text-charcoal-text font-display flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                      3
                    </span>
                    Giấy đăng ký doanh nghiệp
                  </h3>
                </div>

                <p className="mb-5 text-sm text-charcoal-83">
                  Tải lên bản đầy đủ, rõ nét, không che hoặc cắt thông tin. Tên công ty và mã số
                  thuế phải khớp với hồ sơ doanh nghiệp.
                </p>
                <div className="mb-6">
                  <VerificationUpload
                    label="Giấy đăng ký doanh nghiệp"
                    value={certificateUrl}
                    onChange={setCertificateUrl}
                    disabled={
                      isSubmitting ||
                      record.verificationStatus === "PENDING" ||
                      record.verificationStatus === "VERIFIED"
                    }
                  />
                </div>
                {submitterRole === "AUTHORIZED_HR" && (
                  <div className="mb-6">
                    <VerificationUpload
                      label="Giấy ủy quyền"
                      value={powerOfAttorneyUrl}
                      onChange={setPowerOfAttorneyUrl}
                      disabled={
                        isSubmitting ||
                        record.verificationStatus === "PENDING" ||
                        record.verificationStatus === "VERIFIED"
                      }
                    />
                  </div>
                )}
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

                <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  Lưu ý: Hồ sơ sẽ được kiểm tra sau khi gửi. Vui lòng chỉ cung cấp giấy tờ hợp lệ
                  của doanh nghiệp.
                </p>
              </div>

              {/* Section 4 */}
              <div
                hidden={activeSection !== "documents"}
                className="bg-paper-white p-5 rounded-xl border border-warm-border shadow-xs text-xs"
              >
                <h3 className="font-bold text-sm text-charcoal-text font-display mb-3 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-on-primary">
                    4
                  </span>
                  Cam kết
                </h3>
                <div className="space-y-2 text-charcoal-text">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeCommitment}
                      onChange={(e) => setAgreeCommitment(e.target.checked)}
                      className="text-primary rounded"
                    />
                    <span>Thông tin và tài liệu cung cấp chính xác, đúng pháp nhân.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeNoFees}
                      onChange={(e) => setAgreeNoFees(e.target.checked)}
                      className="text-primary rounded"
                    />
                    <span>Không thu phí tuyển dụng hay tiền cọc từ ứng viên.</span>
                  </label>
                </div>
              </div>
            </fieldset>
            {/* Action Bar */}
            <div className="p-4 bg-paper-white rounded-xl border border-warm-border shadow-xs flex items-center justify-between gap-3 text-xs">
              <span className="text-charcoal-83">
                {activeSection === "company"
                  ? "Bước 1/3"
                  : activeSection === "contact"
                    ? "Bước 2/3"
                    : "Bước 3/3"}
              </span>
              <div className="flex items-center gap-3">
                {activeSection !== "company" && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(activeSection === "documents" ? "contact" : "company")
                    }
                    className="rounded-md border border-warm-border px-4 py-2 text-sm"
                  >
                    Quay lại
                  </button>
                )}
                {activeSection !== "documents" ? (
                  <button
                    type="button"
                    className="recruiter-primary"
                    onClick={() =>
                      setActiveSection(activeSection === "company" ? "contact" : "documents")
                    }
                  >
                    Tiếp tục
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      record.verificationStatus === "PENDING" ||
                      record.verificationStatus === "VERIFIED"
                    }
                    className="recruiter-primary"
                  >
                    {isSubmitting
                      ? "Đang gửi…"
                      : record.verificationStatus === "PENDING"
                        ? "Đang xét duyệt"
                        : record.verificationStatus === "VERIFIED"
                          ? "Đã xác thực"
                          : record.verificationStatus === "REJECTED"
                            ? "Gửi lại hồ sơ"
                            : "Lưu và gửi xác thực"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
