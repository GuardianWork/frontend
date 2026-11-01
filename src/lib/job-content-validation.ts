import type { JobContent } from "@/services/jobs";

export const basicJobFieldLabels = {
  title: "Chức danh công việc",
  employmentType: "Loại công việc",
  workArrangement: "Hình thức làm việc",
  location: "Địa điểm làm việc",
  deadline: "Hạn ứng tuyển",
};

export type BasicJobField = keyof typeof basicJobFieldLabels;

export function basicJobErrors(content: JobContent, now = Date.now()) {
  const errors: Partial<Record<BasicJobField, string>> = {};
  for (const field of Object.keys(basicJobFieldLabels) as BasicJobField[]) {
    if (!String(content[field] ?? "").trim()) {
      errors[field] =
        field === "employmentType" || field === "workArrangement" || field === "deadline"
          ? `Vui lòng chọn ${basicJobFieldLabels[field].toLocaleLowerCase("vi")}.`
          : `Vui lòng nhập ${basicJobFieldLabels[field].toLocaleLowerCase("vi")}.`;
    }
  }
  if (content.deadline) {
    const deadline = new Date(content.deadline).getTime();
    if (!Number.isFinite(deadline) || deadline <= now) {
      errors.deadline = "Vui lòng chọn hạn ứng tuyển ở tương lai.";
    }
  }
  return errors;
}

export interface JobEditorIssue {
  field: string;
  label: string;
  message: string;
}

export function jobEditorIssues(
  content: JobContent,
  step?: number,
  now = Date.now(),
): JobEditorIssue[] {
  const issues: JobEditorIssue[] = [];
  const add = (field: string, label: string, message: string) => {
    if (!issues.some((issue) => issue.field === field)) issues.push({ field, label, message });
  };
  if (step === undefined || step === 0) {
    for (const [field, message] of Object.entries(basicJobErrors(content, now))) {
      add(field, basicJobFieldLabels[field as BasicJobField], message);
    }
  }
  if ((step === undefined || step === 1) && !content.description?.trim()) {
    add("description", "Mô tả công việc", "Vui lòng nhập mô tả công việc.");
  }
  if (step === undefined || step === 2) {
    if (
      content.headcount !== undefined &&
      (!Number.isInteger(content.headcount) || content.headcount < 1 || content.headcount > 10000)
    ) {
      add("headcount", "Số lượng tuyển", "Vui lòng nhập số nguyên từ 1 đến 10.000.");
    }
    const pay = content.compensation;
    if (pay?.disclosed) {
      for (const [key, label] of [
        ["minimum", "Lương tối thiểu"],
        ["maximum", "Lương tối đa"],
      ] as const) {
        const value = pay[key];
        if (value === undefined || !Number.isFinite(value) || value <= 0) {
          add(`compensation-${key}`, label, "Vui lòng nhập mức lương lớn hơn 0.");
        } else if (pay.currency === "VND" && !Number.isInteger(value)) {
          add(`compensation-${key}`, label, "Mức lương VND phải là số nguyên.");
        } else if (Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
          add(`compensation-${key}`, label, "Mức lương chỉ được có tối đa 2 chữ số thập phân.");
        }
      }
      if (
        pay.minimum !== undefined &&
        pay.maximum !== undefined &&
        pay.maximum > 0 &&
        pay.maximum < pay.minimum
      ) {
        add(
          "compensation-maximum",
          "Lương tối đa",
          "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.",
        );
      }
    }
    content.screeningQuestions?.forEach((question, index) => {
      if (!question.prompt.trim()) {
        add(
          `question-${question.key}-prompt`,
          `Nội dung câu hỏi ${index + 1}`,
          "Vui lòng nhập nội dung câu hỏi.",
        );
      }
      if (question.type === "SINGLE_CHOICE") {
        const options = (question.options ?? []).map((option) => option.trim());
        if (
          options.length < 2 ||
          options.length > 10 ||
          options.some((option) => !option || Array.from(option).length > 200) ||
          new Set(options).size !== options.length
        ) {
          add(
            `question-${question.key}-options`,
            `Đáp án câu ${index + 1}`,
            "Vui lòng nhập từ 2 đến 10 đáp án khác nhau, mỗi đáp án từ 1 đến 200 ký tự.",
          );
        }
      }
    });
  }
  return issues;
}
