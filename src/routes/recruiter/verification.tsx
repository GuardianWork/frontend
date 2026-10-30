import { useEmployerOnboarding } from "@/context/EmployerOnboardingContext";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, LoaderCircle, RefreshCw } from "lucide-react";
import { RecruiterShell } from "@/components/RecruiterShell";
import { useAuthUser } from "@/hooks/useAuthUser";
import { loadCurrentUser } from "@/services/auth";
import {
  getStoredVerificationRecord,
  submitVerification,
  resubmitVerification,
  loadCompanyVerification,
  type CompanyLegalDossier,
} from "@/services/companyVerification";

export const Route = createFileRoute("/recruiter/verification")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Đăng ký và xác minh công ty — GuardianWork" },
    ],
  }),
  component: CompanyVerificationPage,
});

const inputClass =
  "mt-2 w-full rounded-lg border border-warm-border bg-paper-white px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:bg-surface-container-low disabled:text-charcoal-83";
const statusLabels = {
  REGISTERED: "Chưa đăng ký",
  PENDING: "Chờ xác minh",
  VERIFIED: "Đã xác minh",
  REJECTED: "Cần bổ sung hồ sơ",
};

function CompanyVerificationPage() {
  const user = useAuthUser();
  const onboarding = useEmployerOnboarding();
  const stage = onboarding?.onboarding.stage;
  const [record, setRecord] = useState(getStoredVerificationRecord);
  const [name, setName] = useState(record.name);
  const [taxCode, setTaxCode] = useState(record.taxCode);
  const [file, setFile] = useState<File | null>(null);
  const [workAddress, setWorkAddress] = useState("");
  const [submitterPosition, setSubmitterPosition] = useState("");
  const [representation, setRepresentation] =
    useState<CompanyLegalDossier["representation"]>("LEGAL_REPRESENTATIVE");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [membershipError, setMembershipError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const next = getStoredVerificationRecord();
    setRecord(next);
    setName(next.name);
    setTaxCode(next.taxCode);
  }, [stage]);
  const hasCompany = Boolean(user?.activeMembership);
  const canEdit =
    (stage === "COMPANY_ACTION_REQUIRED" &&
      !hasCompany &&
      record.verificationStatus === "REGISTERED") ||
    (stage === "REJECTED" &&
      user?.activeMembership?.companyRole === "OWNER" &&
      record.verificationStatus === "REJECTED");
  const rejected = stage === "REJECTED";

  async function refreshMembership() {
    setRefreshing(true);
    try {
      await loadCurrentUser();
      await onboarding?.refresh();
      setMembershipError("");
    } catch {
      setMembershipError(
        "Công ty đã được lưu, nhưng chưa tải được quyền thành viên. Hãy thử tải lại thông tin tài khoản.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !canEdit) return;
    setError("");
    setNotice("");
    if (
      !file ||
      !name.trim() ||
      !taxCode.trim() ||
      !workAddress.trim() ||
      !submitterPosition.trim() ||
      !declarationAccepted
    ) {
      setError("Vui lòng hoàn tất hồ sơ, chọn tài liệu và xác nhận cam kết.");
      return;
    }
    setSaving(true);
    try {
      const fields = {
        name,
        file,
        legal: { workAddress, submitterPosition, representation, declarationAccepted },
      };
      const result = rejected
        ? await resubmitVerification(record.id, { ...fields, expectedVersion: record.version })
        : await submitVerification({ ...fields, taxCode });
      setRecord(result);
      setFile(null);
      setDeclarationAccepted(false);
      setNotice(
        rejected
          ? "Đã gửi lại hồ sơ. Công ty đang chờ xác minh."
          : "Đã đăng ký công ty thành công. Công ty đang chờ xác minh.",
      );
      await refreshMembership();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gửi hồ sơ. Vui lòng thử lại.");
      // Refresh the version and status after conflicts without losing the entered correction.
      try {
        setRecord(await loadCompanyVerification());
      } catch {
        /* Keep the form available for retry. */
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <RecruiterShell title="Đăng ký công ty">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {hasCompany ? "Hồ sơ công ty" : "Đăng ký công ty"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal-83">
              {hasCompany
                ? "Thông tin doanh nghiệp và trạng thái xác minh của công ty bạn."
                : "Cung cấp thông tin doanh nghiệp để tạo không gian tuyển dụng. Bạn sẽ trở thành chủ sở hữu công ty sau khi đăng ký thành công."}
            </p>
          </div>
          <span className="rounded-md border border-warm-border bg-paper-white px-3 py-2 text-sm">
            {stage === "PENDING"
              ? "Chờ xác minh"
              : stage === "REJECTED"
                ? "Cần bổ sung hồ sơ"
                : stage === "VERIFIED"
                  ? "Đã xác minh"
                  : statusLabels.REGISTERED}
          </span>
        </div>
        {stage === "COMPANY_ACTION_REQUIRED" && (
          <p className="mb-5 text-sm leading-6 text-charcoal-83">
            Bạn được mời tham gia công ty có sẵn?{" "}
            <Link
              to="/recruiter/members"
              className="font-semibold text-primary underline underline-offset-4"
            >
              Xem lời mời công ty
            </Link>
            .
          </p>
        )}
        <p className="mb-5 break-words text-sm leading-6 text-charcoal-83">
          Tài khoản phụ trách hồ sơ: {user?.email}
        </p>
        {notice && (
          <p
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
          >
            {notice}
          </p>
        )}
        {membershipError && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          >
            <p>{membershipError}</p>
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void refreshMembership()}
              className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold"
            >
              <RefreshCw size={16} />
              {refreshing ? "Đang tải…" : "Tải lại thông tin tài khoản"}
            </button>
          </div>
        )}
        <section
          className="overflow-hidden rounded-xl border border-warm-border bg-paper-white"
          aria-labelledby="company-form-title"
        >
          <div className="flex items-start gap-3 border-b border-warm-border p-5 sm:p-6">
            <Building2 size={22} className="shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 id="company-form-title" className="text-base font-semibold">
                Thông tin doanh nghiệp
              </h2>
              <p className="mt-1 text-sm leading-6 text-charcoal-83">
                Tên, mã số thuế và giấy đăng ký cần thuộc cùng một doanh nghiệp.
              </p>
            </div>
          </div>
          <form onSubmit={submit} className="p-5 sm:p-6" aria-busy={saving}>
            {error && (
              <p
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"
              >
                {error}
              </p>
            )}
            {rejected && user?.activeMembership?.companyRole === "OWNER" && (
              <p className="mb-5 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Lý do cần bổ sung:{" "}
                {record.rejectionReason || "Vui lòng kiểm tra và cập nhật thông tin hồ sơ."}
              </p>
            )}
            <fieldset disabled={saving || !canEdit} className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">
                Tên công ty <span aria-hidden="true">*</span>
                <input
                  name="companyName"
                  required
                  maxLength={255}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Công ty TNHH Giải Pháp Alpha"
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-medium">
                Mã số thuế <span aria-hidden="true">*</span>
                <input
                  name="taxCode"
                  required
                  maxLength={50}
                  readOnly={rejected}
                  value={taxCode}
                  onChange={(event) => setTaxCode(event.target.value)}
                  placeholder="0101234567"
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-medium">
                Chức vụ người nộp <span aria-hidden="true">*</span>
                <input
                  name="submitterPosition"
                  required
                  maxLength={200}
                  value={submitterPosition}
                  onChange={(event) => setSubmitterPosition(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Địa chỉ đăng ký kinh doanh <span aria-hidden="true">*</span>
                <textarea
                  name="workAddress"
                  required
                  maxLength={1000}
                  value={workAddress}
                  onChange={(event) => setWorkAddress(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Tư cách đại diện
                <select
                  name="representation"
                  value={representation}
                  onChange={(event) =>
                    setRepresentation(event.target.value as CompanyLegalDossier["representation"])
                  }
                  className={inputClass}
                >
                  <option value="LEGAL_REPRESENTATIVE">Người đại diện theo pháp luật</option>
                  <option value="AUTHORIZED_REPRESENTATIVE">Người đại diện được ủy quyền</option>
                </select>
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                {rejected ? "Tài liệu thay thế" : "Giấy đăng ký doanh nghiệp"}{" "}
                <span aria-hidden="true">*</span>
                <input
                  name="file"
                  type="file"
                  required
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  aria-describedby="certificate-hint"
                  className={inputClass}
                />
                <span
                  id="certificate-hint"
                  className="mt-2 block text-sm font-normal leading-5 text-charcoal-83"
                >
                  PDF, JPEG hoặc PNG, tối đa 10 MiB. Hồ sơ bổ sung cần tải lên tài liệu mới. Email
                  liên hệ được lấy từ tài khoản của bạn.
                </span>
              </label>
              <label className="flex min-h-11 items-start gap-3 text-sm leading-6 sm:col-span-2">
                <input
                  type="checkbox"
                  required
                  checked={declarationAccepted}
                  onChange={(event) => setDeclarationAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                Tôi cam kết thông tin và tài liệu là chính xác, và có thẩm quyền đại diện doanh
                nghiệp để nộp hồ sơ.
              </label>
            </fieldset>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-warm-border pt-5">
              <p className="max-w-lg text-sm leading-6 text-charcoal-83">
                {stage === "PENDING"
                  ? "Hồ sơ đã được gửi và đang chờ xét duyệt."
                  : stage === "VERIFIED"
                    ? "Công ty đã được xác minh."
                    : "Kiểm tra thông tin trước khi gửi hồ sơ."}
              </p>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="recruiter-primary inline-flex min-h-11 items-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight size={17} aria-hidden="true" />
                  )}
                  {saving ? "Đang gửi hồ sơ…" : rejected ? "Gửi lại hồ sơ" : "Đăng ký công ty"}
                </button>
              )}
              {!canEdit && (
                <Link
                  to="/recruiter"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                >
                  Về tổng quan <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          </form>
        </section>
      </div>
    </RecruiterShell>
  );
}
