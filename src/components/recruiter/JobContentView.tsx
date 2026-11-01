import { JobReviewDetails } from "./JobReviewDetails";
import type { JobContent } from "@/services/jobs";
import {
  textSections,
  employmentTypes,
  workArrangements,
  payPeriods,
  questionTypes,
  formatJobDate,
} from "@/lib/job-content";
import { JobDescription } from "./JobDescription";
export function JobContentView({
  content,
  onEdit,
  editDisabled = false,
}: {
  content: JobContent;
  onEdit?: (step: number, field?: string) => void;
  editDisabled?: boolean;
}) {
  if (onEdit)
    return (
      <article className="jp-content-view jp-review-details">
        <JobReviewDetails content={content} onEdit={onEdit} disabled={editDisabled} />
      </article>
    );
  const pay = content.compensation;
  return (
    <article className="jp-content-view">
      <h3>{content.title || "Chưa có chức danh"}</h3>
      <div className="jp-job-facts">
        <span>
          {content.workArrangement === "REMOTE" ? "Khu vực làm việc từ xa: " : ""}
          {content.location || "Chưa có địa điểm"}
        </span>
        {content.employmentType && <span>{employmentTypes[content.employmentType]}</span>}
        {content.workArrangement && <span>{workArrangements[content.workArrangement]}</span>}
        {content.headcount && <span>Tuyển {content.headcount} người</span>}
        <span>Hạn ứng tuyển: {formatJobDate(content.deadline)}</span>
      </div>
      <p className="jp-salary">
        {!pay
          ? "Chưa có thông tin lương"
          : !pay.disclosed
            ? "Không công khai mức lương"
            : `${pay.minimum?.toLocaleString("vi-VN") ?? "—"} – ${pay.maximum?.toLocaleString("vi-VN") ?? "—"} ${pay.currency ?? ""} / ${payPeriods[pay.payPeriod ?? ""] ?? "—"}`}
      </p>
      {textSections.map(([key, label]) => (
        <section key={key}>
          <h4>{label}</h4>
          <JobDescription value={content[key] || "Chưa bổ sung nội dung."} />
        </section>
      ))}
      {!!content.screeningQuestions?.length && (
        <section>
          <h4>Câu hỏi sàng lọc</h4>
          <ol>
            {content.screeningQuestions.map((q) => (
              <li key={q.key}>
                <strong>{q.prompt || "Chưa có câu hỏi"}</strong> · {questionTypes[q.type]}
                {q.required ? " · Bắt buộc" : ""}
                {q.options && (
                  <ul>
                    {q.options.map((option, i) => (
                      <li key={i}>{option}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
