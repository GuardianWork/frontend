import type { JobContent } from "@/services/jobs";

export const LABOR_CODE_URL = "https://vanban.chinhphu.vn/?pageid=27160&docid=198540";
export const LEGAL_REFERENCES: Record<string, string> = {
  "Yêu cầu đặt cọc": "Điều 17 khoản 2 — Bộ luật Lao động 2019",
  "Giữ giấy tờ gốc": "Điều 17 khoản 1 — Bộ luật Lao động 2019",
  "Điều kiện cá nhân": "Điều 3 khoản 8, Điều 8 khoản 1 — Bộ luật Lao động 2019",
  "Tiền lương tăng ca": "Điều 98 — Bộ luật Lao động 2019",
  "Thời gian thử việc": "Điều 25 — Bộ luật Lao động 2019",
};
const rules = [
  { label: "Yêu cầu đặt cọc", pattern: /đặt cọc|ký quỹ|nộp (?:tiền|phí)/iu },
  {
    label: "Giữ giấy tờ gốc",
    pattern: /giữ.{0,50}(?:bản gốc|bản chính|giấy tờ)|(?:nộp|giao).{0,30}(?:bản gốc|bản chính)/iu,
  },
  {
    label: "Điều kiện cá nhân",
    pattern: /chỉ tuyển (?:nam|nữ)|chưa kết hôn|không.{0,25}sinh con/iu,
  },
  {
    label: "Tiền lương tăng ca",
    pattern:
      /(?:tăng ca|làm thêm).{0,60}không.{0,20}trả|không.{0,20}trả.{0,40}(?:tăng ca|làm thêm)/iu,
  },
  { label: "Thời gian thử việc", pattern: /thử việc/iu },
];

/** Local keyword screening only. Matches require human interpretation, including negation. */
export function reviewJobContent(content: JobContent) {
  const fields = [
    content.title,
    content.description,
    ...(content.screeningQuestions ?? []).map((question) => question.prompt),
  ];
  const excerpts = fields
    .filter((field): field is string => typeof field === "string")
    .flatMap((field) => field.replace(/<[^>]*>/g, " ").split(/\n|(?<=[.!?])\s+/u))
    .map((line) => line.trim())
    .filter(Boolean);
  return rules.flatMap((rule) => {
    const excerpt = excerpts.find((line) => rule.pattern.test(line));
    return excerpt
      ? [{ label: rule.label, excerpt, legalReference: LEGAL_REFERENCES[rule.label] }]
      : [];
  });
}
