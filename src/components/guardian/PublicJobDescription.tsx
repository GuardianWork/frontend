import type { PublicJobAnalysis } from "@/services/publicJobs";
import { JobDescription } from "@/components/recruiter/JobDescription";
import { JobAnalyzedDescription } from "@/components/recruiter/JobAnalyzedDescription";
import { ScanFindingEvidence } from "@/components/recruiter/JobScanPanel";
import { scanOutcomeLabels, scanSeverityLabels } from "@/lib/job-content";
import "@/components/recruiter/job-detail.css";
import "./public-job-analysis.css";

export function PublicJobDescription({
  value,
  analysis,
  unavailable = false,
}: {
  value: string;
  analysis?: PublicJobAnalysis | null;
  unavailable?: boolean;
}) {
  const report = analysis?.mode === "crawler" ? analysis.report : null;
  const message = unavailable
    ? "Chưa thể tải kết quả phân tích AI. Bạn vẫn có thể đọc tin và ứng tuyển."
    : !analysis
      ? "Chưa có kết quả phân tích AI cho nội dung đang công bố."
      : analysis.mode === "stub"
        ? "Chế độ thử nghiệm — chưa thực hiện phân tích AI."
        : report
          ? `${scanOutcomeLabels[report.outcome]} · ${report.findings.length} phát hiện`
          : "Chưa có kết quả phân tích AI cho nội dung đang công bố.";

  return (
    <div className="public-job-analysis">
      <section className="public-job-analysis__summary" aria-label="Phân tích JD bằng AI">
        <h3>Phân tích JD bằng AI</h3>
        <p role={unavailable ? "alert" : "status"}>{message}</p>
        {analysis?.outdated && (
          <p>
            Kết quả thuộc ngày hoặc dữ liệu phân tích trước đó. Cần đối chiếu lại quy định hiện
            hành.
          </p>
        )}
        {report && (
          <>
            <p>Ngày phân tích: {analysis!.asOfDate.split("-").reverse().join("/")}</p>
            <p>Kết quả AI chỉ mang tính tham khảo, không xác nhận tuân thủ pháp luật.</p>
            {report.warnings.length > 0 && (
              <ul>
                {report.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
      {report?.findings.length ? (
        <JobAnalyzedDescription value={value} findings={report.findings} />
      ) : (
        <JobDescription value={value} />
      )}
      {!!report?.findings.length && (
        <details className="public-job-analysis__report">
          <summary>Xem toàn bộ {report.findings.length} phát hiện</summary>
          {report.findings.map((finding, index) => (
            <article className="jp-scan-finding" key={index}>
              <div className="jp-scan-finding-heading">
                <h4>Phát hiện {index + 1}</h4>
                <span className={`jp-scan-severity jp-scan-severity-${finding.severity}`}>
                  Mức độ: {scanSeverityLabels[finding.severity]}
                </span>
              </div>
              <ScanFindingEvidence finding={finding} />
            </article>
          ))}
        </details>
      )}
    </div>
  );
}
