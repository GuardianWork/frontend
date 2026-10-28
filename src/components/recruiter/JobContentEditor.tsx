import { Plus, Trash2 } from "lucide-react";
import type { JobContent, ScreeningQuestion } from "@/services/jobs";

import {
  textSections,
  employmentTypes,
  workArrangements,
  payPeriods,
  questionTypes,
  formatJobDate,
} from "@/lib/job-content";

function localDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function JobContentEditor({
  content,
  onChange,
  disabled,
}: {
  content: JobContent;
  onChange: (content: JobContent) => void;
  disabled: boolean;
}) {
  const update = (patch: Partial<JobContent>) => onChange({ ...content, ...patch });
  const compensation = content.compensation;
  const questions = content.screeningQuestions ?? [];
  const changeQuestion = (index: number, question: ScreeningQuestion) =>
    update({ screeningQuestions: questions.map((old, i) => (i === index ? question : old)) });
  return (
    <fieldset disabled={disabled} className="jp-editor-fields">
      <section className="jp-form-section" aria-labelledby="job-basic-heading">
        <h3 id="job-basic-heading">Thông tin vị trí</h3>
        <p>Có thể lưu khi chưa hoàn tất. Các mục bên dưới cần được bổ sung trước khi gửi duyệt.</p>
        <label>
          Chức danh công việc
          <input
            name="title"
            value={content.title ?? ""}
            maxLength={200}
            placeholder="Ví dụ: Chuyên viên kinh doanh"
            onChange={(e) => update({ title: e.target.value })}
          />
        </label>
        <div className="jp-field-grid">
          <label>
            Loại công việc
            <select
              value={content.employmentType ?? ""}
              onChange={(e) => update({ employmentType: e.target.value || undefined })}
            >
              <option value="">Chọn loại công việc</option>
              {Object.entries(employmentTypes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hình thức làm việc
            <select
              value={content.workArrangement ?? ""}
              onChange={(e) => update({ workArrangement: e.target.value || undefined })}
            >
              <option value="">Chọn hình thức</option>
              {Object.entries(workArrangements).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Địa điểm làm việc
            <input
              value={content.location ?? ""}
              maxLength={1000}
              onChange={(e) => update({ location: e.target.value })}
              placeholder="Tỉnh / thành phố, địa chỉ làm việc"
            />
          </label>
          <label>
            Số lượng tuyển
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              value={content.headcount ?? ""}
              onChange={(e) =>
                update({ headcount: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </label>
          <label>
            Hạn ứng tuyển
            <input
              type="datetime-local"
              aria-label="Hạn ứng tuyển"
              aria-describedby="job-deadline-hint"
              value={localDateTime(content.deadline)}
              onChange={(e) =>
                update({
                  deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
            />
            <span className="jp-hint" id="job-deadline-hint">
              Theo múi giờ của thiết bị. Hạn phải ở tương lai khi gửi duyệt.
            </span>
          </label>
        </div>
      </section>
      <section className="jp-form-section" aria-labelledby="job-pay-heading">
        <h3 id="job-pay-heading">Lương và đãi ngộ</h3>
        <label>
          Mức lương
          <select
            value={compensation ? String(compensation.disclosed) : ""}
            onChange={(e) =>
              update({
                compensation:
                  e.target.value === ""
                    ? undefined
                    : e.target.value === "true"
                      ? { disclosed: true, currency: "VND", payPeriod: "MONTH" }
                      : { disclosed: false },
              })
            }
          >
            <option value="">Chọn cách hiển thị lương</option>
            <option value="true">Công khai khoảng lương</option>
            <option value="false">Không công khai mức lương</option>
          </select>
        </label>
        {compensation?.disclosed && (
          <div className="jp-field-grid">
            <label>
              Lương tối thiểu
              <input
                type="number"
                min={compensation.currency === "USD" ? "0.01" : "1"}
                step={compensation.currency === "USD" ? "0.01" : "1"}
                value={compensation.minimum ?? ""}
                onChange={(e) =>
                  update({
                    compensation: {
                      ...compensation,
                      minimum: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
            </label>
            <label>
              Lương tối đa
              <input
                type="number"
                min={compensation.minimum ?? 0.01}
                step={compensation.currency === "USD" ? "0.01" : "1"}
                value={compensation.maximum ?? ""}
                onChange={(e) =>
                  update({
                    compensation: {
                      ...compensation,
                      maximum: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
            </label>
            <label>
              Đơn vị tiền tệ
              <select
                value={compensation.currency ?? "VND"}
                onChange={(e) =>
                  update({
                    compensation: { ...compensation, currency: e.target.value as "VND" | "USD" },
                  })
                }
              >
                <option>VND</option>
                <option>USD</option>
              </select>
            </label>
            <label>
              Kỳ trả lương
              <select
                value={compensation.payPeriod ?? "MONTH"}
                onChange={(e) =>
                  update({
                    compensation: {
                      ...compensation,
                      payPeriod: e.target.value as NonNullable<
                        JobContent["compensation"]
                      >["payPeriod"],
                    },
                  })
                }
              >
                {Object.entries(payPeriods).map(([key, label]) => (
                  <option value={key} key={key}>
                    Theo {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>
      <section className="jp-form-section" aria-labelledby="job-content-heading">
        <h3 id="job-content-heading">Nội dung tuyển dụng</h3>
        <p>Viết rõ công việc, tiêu chí tuyển chọn và quyền lợi thực tế của vị trí.</p>
        {textSections.map(([key, label, max]) => (
          <label key={key}>
            {label}
            <textarea
              aria-label={label}
              aria-describedby={`job-${key}-hint`}
              rows={key === "description" || key === "responsibilities" ? 5 : 3}
              maxLength={max}
              value={content[key] ?? ""}
              onChange={(e) => update({ [key]: e.target.value })}
            />
            <span className="jp-hint" id={`job-${key}-hint`}>
              {(content[key] ?? "").length.toLocaleString("vi-VN")} / {max.toLocaleString("vi-VN")}{" "}
              ký tự
            </span>
          </label>
        ))}
      </section>
      <section className="jp-form-section" aria-labelledby="job-questions-heading">
        <h3 id="job-questions-heading">
          Câu hỏi sàng lọc <span className="jp-optional">Không bắt buộc</span>
        </h3>
        <p>Tối đa 10 câu hỏi. Câu hỏi lựa chọn cần từ 2 đến 10 đáp án khác nhau.</p>
        {questions.map((question, index) => (
          <div className="jp-question" key={question.key}>
            <div className="jp-row">
              <h4>Câu hỏi {index + 1}</h4>
              <button
                className="jp-button jp-quiet"
                type="button"
                aria-label={`Xóa câu hỏi ${index + 1}`}
                onClick={() =>
                  update({ screeningQuestions: questions.filter((_, i) => i !== index) })
                }
              >
                <Trash2 size={16} aria-hidden="true" />
                Xóa
              </button>
            </div>
            <label>
              Nội dung câu hỏi {index + 1}
              <textarea
                rows={2}
                maxLength={500}
                value={question.prompt}
                onChange={(e) => changeQuestion(index, { ...question, prompt: e.target.value })}
              />
            </label>
            <label>
              Kiểu trả lời câu {index + 1}
              <select
                value={question.type}
                onChange={(e) => {
                  const type = e.target.value as ScreeningQuestion["type"];
                  changeQuestion(index, {
                    key: question.key,
                    prompt: question.prompt,
                    required: question.required,
                    type,
                    ...(type === "SINGLE_CHOICE" ? { options: ["", ""] } : {}),
                  });
                }}
              >
                {Object.entries(questionTypes).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {question.type === "SINGLE_CHOICE" && (
              <label>
                Đáp án câu {index + 1}
                <textarea
                  rows={4}
                  value={(question.options ?? []).join("\n")}
                  onChange={(e) =>
                    changeQuestion(index, { ...question, options: e.target.value.split("\n") })
                  }
                />
                <span className="jp-hint">Mỗi dòng một đáp án, tối đa 200 ký tự mỗi đáp án.</span>
              </label>
            )}
            <label className="jp-check">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => changeQuestion(index, { ...question, required: e.target.checked })}
              />
              Bắt buộc trả lời
            </label>
          </div>
        ))}
        <button
          className="jp-button"
          type="button"
          disabled={questions.length >= 10}
          onClick={() =>
            update({
              screeningQuestions: [
                ...questions,
                { key: crypto.randomUUID(), type: "SHORT_TEXT", prompt: "", required: false },
              ],
            })
          }
        >
          <Plus size={16} aria-hidden="true" />
          Thêm câu hỏi ({questions.length}/10)
        </button>
      </section>
    </fieldset>
  );
}
export function JobContentView({ content }: { content: JobContent }) {
  const pay = content.compensation;
  return (
    <article className="jp-content-view">
      <h3>{content.title || "Chưa có chức danh"}</h3>
      <div className="jp-job-facts">
        <span>{content.location || "Chưa có địa điểm"}</span>
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
          <p>{content[key] || "Chưa bổ sung nội dung."}</p>
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
