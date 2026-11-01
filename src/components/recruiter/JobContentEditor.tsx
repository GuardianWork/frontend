import { JobDescriptionEditor } from "./JobDescriptionEditor";
import { Plus, Trash2 } from "lucide-react";
import type { JobContent, ScreeningQuestion } from "@/services/jobs";

import { employmentTypes, workArrangements, payPeriods, questionTypes } from "@/lib/job-content";

function RequiredMark() {
  return (
    <span className="jp-required" aria-hidden="true">
      *
    </span>
  );
}

function localDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function JobContentEditor({
  content,
  onChange,
  disabled,
  step,
  invalidField,
}: {
  content: JobContent;
  onChange: (content: JobContent) => void;
  disabled: boolean;
  step?: number;
  invalidField?: string | null;
}) {
  const fieldAttributes = (field: string, hint?: string) => ({
    "data-job-field": field,
    "aria-invalid": invalidField === field || undefined,
    "aria-describedby":
      [hint, invalidField === field ? "job-workspace-error" : ""].filter(Boolean).join(" ") ||
      undefined,
  });
  const update = (patch: Partial<JobContent>) => onChange({ ...content, ...patch });
  const compensation = content.compensation;
  const questions = content.screeningQuestions ?? [];
  const changeQuestion = (index: number, question: ScreeningQuestion) =>
    update({ screeningQuestions: questions.map((old, i) => (i === index ? question : old)) });
  return (
    <fieldset disabled={disabled} className="jp-editor-fields">
      {(step === undefined || step === 0) && (
        <section className="jp-form-section" aria-labelledby="job-basic-heading">
          <h3 id="job-basic-heading">Thông tin vị trí</h3>
          <p>
            Dấu * đánh dấu trường bắt buộc để gửi duyệt. Bạn vẫn có thể lưu bản nháp chưa hoàn tất.
          </p>
          <label>
            <span>
              Chức danh công việc <RequiredMark />
            </span>
            <input
              {...fieldAttributes("title")}
              aria-required="true"
              aria-label="Chức danh công việc"
              name="title"
              value={content.title ?? ""}
              maxLength={200}
              onChange={(e) => update({ title: e.target.value })}
            />
          </label>
          <div className="jp-field-grid">
            <label>
              <span>
                Loại công việc <RequiredMark />
              </span>
              <select
                {...fieldAttributes("employmentType")}
                aria-required="true"
                aria-label="Loại công việc"
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
              <span>
                Hình thức làm việc <RequiredMark />
              </span>
              <select
                {...fieldAttributes("workArrangement")}
                aria-required="true"
                aria-label="Hình thức làm việc"
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
              <span>
                {content.workArrangement === "REMOTE"
                  ? "Khu vực có thể làm việc từ xa"
                  : "Địa điểm làm việc"}{" "}
                <RequiredMark />
              </span>
              <input
                {...fieldAttributes("location", "job-location-hint")}
                aria-label={
                  content.workArrangement === "REMOTE"
                    ? "Khu vực có thể làm việc từ xa"
                    : "Địa điểm làm việc"
                }
                aria-required="true"
                value={content.location ?? ""}
                maxLength={1000}
                onChange={(e) => update({ location: e.target.value })}
              />
              <span className="jp-hint" id="job-location-hint">
                {content.workArrangement === "REMOTE"
                  ? "Ghi khu vực ứng viên được phép làm việc, ví dụ Việt Nam hoặc Toàn thế giới."
                  : "Ghi địa điểm làm việc tại văn phòng hoặc theo hình thức kết hợp."}
              </span>
            </label>
            <label>
              <span>
                Hạn ứng tuyển <RequiredMark />
              </span>
              <input
                {...fieldAttributes("deadline", "job-deadline-hint")}
                aria-required="true"
                type="date"
                min={localDate(new Date().toISOString())}
                aria-label="Hạn ứng tuyển"
                value={localDate(content.deadline)}
                onChange={(e) =>
                  update({
                    deadline: e.target.value
                      ? new Date(`${e.target.value}T23:59:59.999`).toISOString()
                      : undefined,
                  })
                }
              />
              <span className="jp-hint" id="job-deadline-hint">
                Nhận hồ sơ đến hết ngày đã chọn.
              </span>
            </label>
          </div>
        </section>
      )}
      {(step === undefined || step === 1) && (
        <section className="jp-form-section" aria-labelledby="job-content-heading">
          <h3 id="job-content-heading">
            Mô tả công việc <RequiredMark />
          </h3>
          <JobDescriptionEditor
            invalid={invalidField === "description"}
            value={content.description ?? ""}
            onChange={(description) => update({ description })}
            disabled={disabled}
          />
        </section>
      )}
      {(step === undefined || step === 2) && (
        <section className="jp-form-section" aria-labelledby="job-pay-heading">
          <h3 id="job-pay-heading">
            Thông tin bổ sung <span className="jp-optional">Không bắt buộc</span>
          </h3>
          <label>
            Số lượng tuyển <span className="jp-optional">Không bắt buộc</span>
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              aria-label="Số lượng tuyển"
              value={content.headcount ?? ""}
              onChange={(e) =>
                update({ headcount: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </label>

          <label>
            Mức lương <span className="jp-optional">Không bắt buộc</span>
            <select
              aria-label="Mức lương"
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
              <option value="">Chưa cung cấp thông tin lương</option>
              <option value="true">Công khai khoảng lương</option>
              <option value="false">Không công khai mức lương</option>
            </select>
          </label>
          {compensation?.disclosed && (
            <div className="jp-field-grid">
              <label>
                <span>
                  Lương tối thiểu <RequiredMark />
                </span>
                <input
                  type="number"
                  min={compensation.currency === "USD" ? "0.01" : "1"}
                  step={compensation.currency === "USD" ? "0.01" : "1"}
                  aria-required="true"
                  aria-label="Lương tối thiểu"
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
                <span>
                  Lương tối đa <RequiredMark />
                </span>
                <input
                  type="number"
                  min={compensation.minimum ?? 0.01}
                  step={compensation.currency === "USD" ? "0.01" : "1"}
                  aria-required="true"
                  aria-label="Lương tối đa"
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
                <span>
                  Đơn vị tiền tệ <RequiredMark />
                </span>
                <select
                  aria-required="true"
                  aria-label="Đơn vị tiền tệ"
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
                <span>
                  Kỳ trả lương <RequiredMark />
                </span>
                <select
                  aria-required="true"
                  aria-label="Kỳ trả lương"
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
      )}
      {(step === undefined || step === 2) && (
        <section className="jp-form-section" aria-labelledby="job-questions-heading">
          <h3 id="job-questions-heading">
            Câu hỏi sàng lọc <span className="jp-optional">Không bắt buộc</span>
          </h3>
          <p>
            Tối đa 10 câu hỏi. Khi thêm câu hỏi, cần điền các trường có dấu *. Câu hỏi lựa chọn cần
            từ 2 đến 10 đáp án khác nhau.
          </p>
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
                <span>
                  Nội dung câu hỏi {index + 1} <RequiredMark />
                </span>
                <textarea
                  rows={2}
                  maxLength={500}
                  aria-required="true"
                  aria-label={"Nội dung câu hỏi " + (index + 1)}
                  value={question.prompt}
                  onChange={(e) => changeQuestion(index, { ...question, prompt: e.target.value })}
                />
              </label>
              <label>
                <span>
                  Kiểu trả lời câu {index + 1} <RequiredMark />
                </span>
                <select
                  aria-required="true"
                  aria-label={"Kiểu trả lời câu " + (index + 1)}
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
                  <span>
                    Đáp án câu {index + 1} <RequiredMark />
                  </span>
                  <textarea
                    rows={4}
                    aria-required="true"
                    aria-label={"Đáp án câu " + (index + 1)}
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
                  onChange={(e) =>
                    changeQuestion(index, { ...question, required: e.target.checked })
                  }
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
      )}
    </fieldset>
  );
}
