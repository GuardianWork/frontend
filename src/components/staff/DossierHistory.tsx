import {
  DownloadIcon,
  UnavailableEvidenceIcon,
  SubmissionHistoryIcon,
  ExternalLinkIcon,
  RefreshIcon,
  PendingIcon,
  CompanyIcon,
  RejectedIcon,
} from "@/components/icons";
import { useEffect, useState } from "react";
import {
  certificateTarget,
  downloadEvidence,
  getVerificationHistory,
  type VerificationAttempt,
} from "@/services/staffDossiers";
import { AdminApiError } from "@/services/adminCompanies";

import { StaffStatusBadge } from "@/components/admin/StaffStatusBadge";

import { dossierDate } from "@/lib/dossier-date";

export function EvidenceDownload({ documentId }: { documentId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="admin-text-link"
        disabled={busy || unavailable}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await downloadEvidence(documentId);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Không thể tải tài liệu xác minh.");
            setUnavailable(cause instanceof AdminApiError && cause.status === 404);
          } finally {
            setBusy(false);
          }
        }}
      >
        {unavailable ? <UnavailableEvidenceIcon size={16} /> : <DownloadIcon size={16} />}
        {busy
          ? "Đang tải tài liệu…"
          : unavailable
            ? "Tài liệu không khả dụng"
            : "Tải tài liệu xác minh"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function LegacyEvidence({ value }: { value: string | null }) {
  const target = certificateTarget(value);
  if (target.documentId)
    return <EvidenceDownload key={target.documentId} documentId={target.documentId} />;
  if (target.href)
    return (
      <a className="admin-text-link" href={target.href} target="_blank" rel="noreferrer">
        <ExternalLinkIcon size={16} /> Mở đường dẫn giấy đăng ký
      </a>
    );
  return <>Chưa có đường dẫn tài liệu trong hồ sơ.</>;
}
export function DossierHistory({ companyId, revision }: { companyId: number; revision: number }) {
  const [attempts, setAttempts] = useState<VerificationAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void getVerificationHistory(companyId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setAttempts(data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Không tải được lịch sử hồ sơ.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [companyId, revision, retry]);
  return (
    <section className="admin-panel verification-history mt-6" aria-labelledby="history-title">
      <div className="admin-panel-heading">
        <h2 id="history-title" className="flex items-center gap-2">
          <SubmissionHistoryIcon size={20} /> Lịch sử gửi hồ sơ
        </h2>
      </div>
      {loading ? (
        <p className="p-6" role="status">
          Đang tải lịch sử hồ sơ…
        </p>
      ) : error ? (
        <div className="p-6" role="alert">
          <p>{error}</p>
          <button className="admin-text-link" onClick={() => setRetry((value) => value + 1)}>
            <RefreshIcon size={16} /> Thử tải lại lịch sử
          </button>
        </div>
      ) : !attempts.length ? (
        <p className="p-6">
          Không có lịch sử nộp hồ sơ được lưu giữ. Thông tin hồ sơ cũ được hiển thị ở trên.
        </p>
      ) : (
        <ol className="space-y-6 p-6">
          {attempts.map((attempt) => (
            <li key={attempt.attemptId} className="verification-history-attempt">
              <h3 className="font-semibold">Hồ sơ gửi lúc {dossierDate(attempt.submittedAt)}</h3>
              <dl className="admin-company-fields">
                <div>
                  <dt>Tên công ty</dt>
                  <dd>{attempt.companyName}</dd>
                </div>
                <div>
                  <dt>Mã số thuế</dt>
                  <dd>{attempt.taxCode}</dd>
                </div>
                <div>
                  <dt>Địa chỉ làm việc</dt>
                  <dd>{attempt.workAddress}</dd>
                </div>
                <div>
                  <dt>Chức vụ người nộp</dt>
                  <dd>{attempt.submitterPosition}</dd>
                </div>
                <div>
                  <dt>Tư cách đại diện</dt>
                  <dd>
                    {attempt.representation === "LEGAL_REPRESENTATIVE"
                      ? "Người đại diện pháp luật"
                      : "Người đại diện được ủy quyền"}
                  </dd>
                </div>
                <div>
                  <dt>Phiên bản cam kết</dt>
                  <dd>{attempt.declarationVersion}</dd>
                </div>
                <div className="admin-company-fields-wide">
                  <dt>Nội dung cam kết</dt>
                  <dd className="whitespace-pre-wrap">{attempt.declarationText}</dd>
                </div>
                <div>
                  <dt>Tài liệu chứng minh</dt>
                  <dd>
                    <EvidenceDownload documentId={attempt.documentId} />
                  </dd>
                </div>
                <div>
                  <dt>Kết quả</dt>
                  <dd>
                    <StaffStatusBadge
                      tone={
                        attempt.outcome === "VERIFIED"
                          ? "verified"
                          : attempt.outcome === "REJECTED"
                            ? "rejected"
                            : "pending"
                      }
                    >
                      {attempt.outcome === "VERIFIED" ? (
                        <CompanyIcon size={16} />
                      ) : attempt.outcome === "REJECTED" ? (
                        <RejectedIcon size={16} />
                      ) : (
                        <PendingIcon size={16} />
                      )}
                      {attempt.outcome === "VERIFIED"
                        ? "Đã xác minh"
                        : attempt.outcome === "REJECTED"
                          ? "Đã từ chối"
                          : "Chờ duyệt"}
                    </StaffStatusBadge>
                  </dd>
                </div>
                <div>
                  <dt>Người duyệt</dt>
                  <dd>
                    {attempt.reviewerId == null
                      ? "Chưa có thông tin"
                      : `Mã người duyệt: ${attempt.reviewerId}`}
                  </dd>
                </div>
                <div>
                  <dt>Thời điểm xét duyệt</dt>
                  <dd>{dossierDate(attempt.reviewedAt)}</dd>
                </div>
                {attempt.rejectionReason && (
                  <div className="admin-company-fields-wide verification-rejection">
                    <dt>Lý do từ chối</dt>
                    <dd>{attempt.rejectionReason}</dd>
                  </div>
                )}
              </dl>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
