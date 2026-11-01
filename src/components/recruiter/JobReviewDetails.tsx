import type { ReactNode } from "react";
import { Pencil, Plus } from "lucide-react";
import type { JobContent } from "@/services/jobs";
import {
  employmentTypes,
  workArrangements,
  payPeriods,
  questionTypes,
  formatJobDate,
} from "@/lib/job-content";
import { JobDescription } from "./JobDescription";

export function JobReviewDetails({
  content,
  onEdit,
  disabled,
}: {
  content: JobContent;
  onEdit: (step: number, field?: string) => void;
  disabled: boolean;
}) {
  const action = (step: number, label: string, field?: string, missing = false) => (
    <button
      type="button"
      className="jp-review-edit"
      aria-label={`${missing ? "Bổ sung" : "Chỉnh sửa"} ${label.toLocaleLowerCase("vi")}`}
      title={`${missing ? "Bổ sung" : "Chỉnh sửa"} ${label.toLocaleLowerCase("vi")}`}
      disabled={disabled}
      onClick={() => onEdit(step, field)}
    >
      {missing ? <Plus size={18} aria-hidden="true" /> : <Pencil size={18} aria-hidden="true" />}
    </button>
  );
  const detail = (
    label: string,
    value: ReactNode,
    step: number,
    field: string,
    missing: boolean,
  ) => (
    <div className="jp-review-detail" key={field}>
      <dt>{label}</dt>
      <dd>
        {missing ? (
          <>
            <span className="jp-review-missing">Chưa bổ sung</span>
            {action(step, label, field, true)}
          </>
        ) : (
          value
        )}
      </dd>
    </div>
  );
  const pay = content.compensation;
  const questions = content.screeningQuestions ?? [];
  return (
    <>
      <section aria-label="Thông tin vị trí">
        <div className="jp-review-section-heading">
          <h3>Thông tin vị trí</h3>
          {action(0, "Thông tin vị trí")}
        </div>
        <dl className="jp-review-detail-list">
          {detail("Chức danh công việc", content.title, 0, "title", !content.title?.trim())}
          {detail(
            "Loại công việc",
            employmentTypes[content.employmentType ?? ""] ?? content.employmentType,
            0,
            "employmentType",
            !content.employmentType,
          )}
          {detail(
            "Hình thức làm việc",
            workArrangements[content.workArrangement ?? ""] ?? content.workArrangement,
            0,
            "workArrangement",
            !content.workArrangement,
          )}
          {detail(
            content.workArrangement === "REMOTE" ? "Khu vực làm việc từ xa" : "Địa điểm làm việc",
            content.location,
            0,
            "location",
            !content.location?.trim(),
          )}
          {detail(
            "Hạn ứng tuyển",
            formatJobDate(content.deadline),
            0,
            "deadline",
            !content.deadline,
          )}
        </dl>
      </section>
      <section aria-label="Mô tả công việc">
        <div className="jp-review-section-heading">
          <h3>Mô tả công việc</h3>
          {action(1, "Mô tả công việc", "description", !content.description?.trim())}
        </div>
        {content.description?.trim() ? (
          <JobDescription value={content.description} />
        ) : (
          <p className="jp-review-missing">Chưa bổ sung</p>
        )}
      </section>
      <section aria-label="Thông tin bổ sung">
        <div className="jp-review-section-heading">
          <h3>Thông tin bổ sung</h3>
          {action(2, "Thông tin bổ sung")}
        </div>
        <dl className="jp-review-detail-list">
          {detail(
            "Số lượng tuyển",
            content.headcount === undefined ? null : `${content.headcount} người`,
            2,
            "headcount",
            content.headcount === undefined,
          )}
          {detail(
            "Mức lương",
            pay ? (pay.disclosed ? "Công khai khoảng lương" : "Không công khai mức lương") : null,
            2,
            "compensation-disclosed",
            !pay,
          )}
          {pay?.disclosed && (
            <>
              {detail(
                "Lương tối thiểu",
                pay.minimum?.toLocaleString("vi-VN"),
                2,
                "compensation-minimum",
                pay.minimum === undefined,
              )}
              {detail(
                "Lương tối đa",
                pay.maximum?.toLocaleString("vi-VN"),
                2,
                "compensation-maximum",
                pay.maximum === undefined,
              )}
              {detail("Đơn vị tiền tệ", pay.currency, 2, "compensation-currency", !pay.currency)}
              {detail(
                "Kỳ trả lương",
                pay.payPeriod ? `Theo ${payPeriods[pay.payPeriod]}` : null,
                2,
                "compensation-payPeriod",
                !pay.payPeriod,
              )}
            </>
          )}
        </dl>
        <div className="jp-review-section-heading jp-review-questions-heading">
          <h4>Câu hỏi sàng lọc</h4>
          {!questions.length && action(2, "Câu hỏi sàng lọc", "screeningQuestions", true)}
        </div>
        {!questions.length ? (
          <p className="jp-review-missing">Chưa bổ sung</p>
        ) : (
          <ol className="jp-review-questions">
            {questions.map((question, index) => (
              <li key={question.key}>
                <div className="jp-review-section-heading">
                  <h4>Câu hỏi {index + 1}</h4>
                  {action(
                    2,
                    `Câu hỏi ${index + 1}`,
                    `question-${question.key}-prompt`,
                    !question.prompt.trim(),
                  )}
                </div>
                <dl className="jp-review-detail-list">
                  {detail(
                    "Nội dung câu hỏi",
                    question.prompt,
                    2,
                    `question-${question.key}-prompt`,
                    !question.prompt.trim(),
                  )}
                  {detail(
                    "Kiểu trả lời",
                    questionTypes[question.type],
                    2,
                    `question-${question.key}-type`,
                    false,
                  )}
                  {detail(
                    "Bắt buộc trả lời",
                    question.required ? "Có" : "Không",
                    2,
                    `question-${question.key}-required`,
                    false,
                  )}
                  {question.type === "SINGLE_CHOICE" &&
                    detail(
                      "Đáp án",
                      <ul>
                        {question.options?.map((option, i) => (
                          <li key={i}>{option || "Chưa có nội dung"}</li>
                        ))}
                      </ul>,
                      2,
                      `question-${question.key}-options`,
                      !question.options?.some((option) => option.trim()),
                    )}
                </dl>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
