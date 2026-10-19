import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, LoaderCircle, RefreshCw } from "lucide-react";
import { RecruiterShell } from "@/components/RecruiterShell";
import { useAuthUser } from "@/hooks/useAuthUser";
import { loadCurrentUser } from "@/services/auth";
import {
  getStoredVerificationRecord,
  submitVerification,
  resubmitVerification,
} from "@/services/companyVerification";

export const Route = createFileRoute("/recruiter/verification")({
  head: () => ({ meta: [{ title: "Đăng ký và xác minh công ty — GuardianWork" }] }),
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
  const [record, setRecord] = useState(getStoredVerificationRecord);
  const [name, setName] = useState(record.name);
  const [taxCode, setTaxCode] = useState(record.taxCode);
  const [email, setEmail] = useState(record.email);
  const [certificateUrl, setCertificateUrl] = useState(record.registrationCertificateUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [membershipError, setMembershipError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const hasCompany = Boolean(user?.activeMembership);
  const canEdit =
    (!hasCompany || user?.activeMembership?.companyRole === "OWNER") &&
    ["REGISTERED", "REJECTED"].includes(record.verificationStatus);
  const rejected = record.verificationStatus === "REJECTED";

  async function refreshMembership() {
    setRefreshing(true);
    try {
      await loadCurrentUser();
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
    let certificate: URL;
    try {
      certificate = new URL(certificateUrl.trim());
    } catch {
      setError("Vui lòng nhập đường dẫn hợp lệ đến giấy đăng ký doanh nghiệp.");
      return;
    }
    if (!["http:", "https:"].includes(certificate.protocol)) {
      setError("Đường dẫn giấy đăng ký phải bắt đầu bằng http:// hoặc https://.");
      return;
    }
    if (!name.trim() || !taxCode.trim() || !email.trim()) {
      setError("Vui lòng điền đầy đủ thông tin công ty.");
      return;
    }
    setSaving(true);
    try {
      const fields = { name, email, registrationCertificateUrl: certificate.href };
      const result = rejected
        ? await resubmitVerification(record.id, { ...fields, expectedVersion: record.version })
        : await submitVerification({ ...fields, taxCode });
      setRecord(result);
      setNotice(
        rejected
          ? "Đã gửi lại hồ sơ. Công ty đang chờ xác minh."
          : "Đã đăng ký công ty thành công. Công ty đang chờ xác minh.",
      );
      await refreshMembership();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gửi hồ sơ. Vui lòng thử lại.");
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
            {statusLabels[record.verificationStatus]}
          </span>
        </div>
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
            {rejected && (
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
                Email công ty <span aria-hidden="true">*</span>
                <input
                  name="companyEmail"
                  type="email"
                  required
                  maxLength={255}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="contact@alpha.com.vn"
                  className={inputClass}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Đường dẫn giấy đăng ký doanh nghiệp <span aria-hidden="true">*</span>
                <input
                  name="registrationCertificateUrl"
                  type="url"
                  required
                  value={certificateUrl}
                  onChange={(event) => setCertificateUrl(event.target.value)}
                  placeholder="https://storage.example.vn/licenses/alpha.pdf"
                  aria-describedby="certificate-hint"
                  className={inputClass}
                />
                <span
                  id="certificate-hint"
                  className="mt-2 block text-xs font-normal leading-5 text-charcoal-83"
                >
                  Nhập đường dẫn http hoặc https để người xét duyệt có thể mở tài liệu của bạn.
                </span>
              </label>
            </fieldset>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-warm-border pt-5">
              <p className="max-w-lg text-sm leading-6 text-charcoal-83">
                {record.verificationStatus === "PENDING"
                  ? "Hồ sơ đã được gửi và đang chờ xét duyệt."
                  : record.verificationStatus === "VERIFIED"
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
