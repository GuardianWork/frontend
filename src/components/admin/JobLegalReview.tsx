import type { StaffJobReview } from "@/services/staffJobs";
import { LABOR_CODE_URL, reviewJobContent } from "@/lib/job-legal-review";
import { StaffStatusBadge } from "./StaffStatusBadge";

export function JobLegalReview({ review }: { review: StaffJobReview }) {
  const findings = reviewJobContent(review.content);
  return (
    <section
      className="admin-panel staff-job-legal-review"
      aria-labelledby="job-legal-review-title"
    >
      <div className="admin-panel-heading">
        <div>
          <h2 id="job-legal-review-title">Rà soát AI theo pháp luật</h2>
          <p>
            Tin #{review.jobId} · Bản v{review.revisionNumber} · Phiên bản dữ liệu{" "}
            {review.revisionVersion}
          </p>
        </div>
      </div>
      <div className="staff-job-legal-body">
        <StaffStatusBadge tone="neutral">Chưa có kết quả AI</StaffStatusBadge>
        <p>
          Dịch vụ AI chưa được kết nối. Kiểm tra sơ bộ dưới đây dùng quy tắc từ khóa trên nội dung
          của bản tin này, không phải kết quả AI.
        </p>
        <h3>Kiểm tra sơ bộ nội dung</h3>
        <StaffStatusBadge tone={findings.length ? "pending" : "info"}>
          {findings.length
            ? `${findings.length} nhóm nội dung cần đối chiếu`
            : "Chưa khớp quy tắc kiểm tra"}
        </StaffStatusBadge>
        {findings.length ? (
          <ol className="staff-job-legal-findings">
            {findings.map((finding) => (
              <li key={finding.label}>
                <h4>{finding.label}</h4>
                <blockquote>{finding.excerpt}</blockquote>
                <a
                  className="staff-legal-reference"
                  href={LABOR_CODE_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {finding.legalReference} (mở tab mới)
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <p>
            Không tìm thấy từ khóa thuộc các nhóm kiểm tra hiện có. Kết quả này không xác nhận tin
            phù hợp pháp luật.
          </p>
        )}
        <p>
          Đọc toàn bộ nội dung, ngữ cảnh và căn cứ pháp luật trước khi phê duyệt hoặc từ chối. Quy
          tắc có thể bỏ sót nội dung hoặc khớp cả câu phủ định.
        </p>
      </div>
    </section>
  );
}
