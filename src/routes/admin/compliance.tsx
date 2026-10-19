import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, RotateCcw, Search } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";

type Rule = { id: string; title: string; article: string; terms: string[]; guidance: string };

const LABOR_CODE_URL =
  "https://vanban.chinhphu.vn/?classid=1&docid=198540&pageid=27160&typegroupid=3";

const RULES: Rule[] = [
  {
    id: "deposit",
    title: "Yêu cầu đặt cọc hoặc giữ giấy tờ gốc",
    article: "Điều 17",
    terms: ["đặt cọc", "ký quỹ", "giữ bản chính", "giữ bản gốc", "giữ giấy tờ gốc"],
    guidance:
      "Đối chiếu Điều 17 về hành vi người sử dụng lao động không được thực hiện. Kiểm tra ngữ cảnh và chủ thể đưa ra yêu cầu.",
  },
  {
    id: "overtime",
    title: "Nội dung về tiền lương làm thêm giờ",
    article: "Điều 98",
    terms: [
      "không trả lương làm thêm",
      "không trả tiền làm thêm",
      "không trả tiền tăng ca",
      "không tính lương làm thêm",
    ],
    guidance:
      "Đối chiếu quy định về tiền lương làm thêm giờ, thời điểm làm việc và loại ngày. Chỉ từ khóa không đủ để xác định mức trả đúng.",
  },
  {
    id: "probation",
    title: "Thời gian thử việc cần đối chiếu theo vị trí",
    article: "Điều 25",
    terms: [
      "thử việc 90 ngày",
      "thử việc 3 tháng",
      "thử việc 03 tháng",
      "thử việc 6 tháng",
      "thử việc 180 ngày",
    ],
    guidance:
      "Thời hạn tối đa phụ thuộc tính chất và yêu cầu chuyên môn của công việc; cần kiểm tra nhóm công việc và trường hợp áp dụng theo Điều 25.",
  },
  {
    id: "post-employment",
    title: "Điều khoản hạn chế sau khi nghỉ việc",
    article: "Cần xem xét toàn bộ thỏa thuận",
    terms: [
      "không được làm việc cho đối thủ",
      "cấm làm việc cho đối thủ",
      "không làm cho đối thủ",
      "không được làm trong ngành",
    ],
    guidance:
      "Xem xét đầy đủ phạm vi, thời hạn, đối tượng và căn cứ của điều khoản. Từ khóa này không tự xác định điều khoản hợp pháp hay vi phạm.",
  },
  {
    id: "personal-criteria",
    title: "Điều kiện tuyển dụng gắn với đặc điểm cá nhân",
    article: "Cần rà soát ngữ cảnh",
    terms: [
      "chỉ tuyển nam",
      "chỉ tuyển nữ",
      "không tuyển nữ",
      "không tuyển người đã kết hôn",
      "ngoại hình bắt buộc",
    ],
    guidance:
      "Kiểm tra yêu cầu có liên quan thực chất đến công việc hay không và xem xét ngoại lệ, ngữ cảnh cụ thể trước khi đánh giá.",
  },
];

function scanText(text: string) {
  const normalized = text.toLocaleLowerCase("vi-VN");
  return RULES.flatMap((rule) => {
    const matchedTerms = rule.terms.filter((term) =>
      normalized.includes(term.toLocaleLowerCase("vi-VN")),
    );
    return matchedTerms.length ? [{ ...rule, matchedTerms }] : [];
  });
}

export const Route = createFileRoute("/admin/compliance")({
  head: () => ({
    meta: [
      { title: "Rà soát tin tuyển dụng — GuardianWork" },
      {
        name: "description",
        content: "Công cụ hỗ trợ rà soát từ khóa trong nội dung tin tuyển dụng.",
      },
    ],
  }),
  component: CompliancePage,
});

function CompliancePage() {
  const sampleTitle = "Nhân viên kinh doanh khu vực miền Nam";
  const sampleContent =
    "Ứng viên nhận việc cần đặt cọc đồng phục. Thử việc 3 tháng. Không trả lương làm thêm giờ.";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState("");
  const matches = useMemo(
    () => (hasReviewed ? scanText(`${title}\n${content}`) : []),
    [hasReviewed, title, content],
  );

  function review(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) {
      setError("Hãy nhập nội dung tin tuyển dụng để bắt đầu rà soát.");
      setHasReviewed(false);
      return;
    }
    setError("");
    setHasReviewed(true);
  }

  function clear() {
    setTitle("");
    setContent("");
    setHasReviewed(false);
    setError("");
  }

  return (
    <AdminShell title="Rà soát tin tuyển dụng" role="admin">
      <div className="admin-page-heading">
        <div>
          <h1>Rà soát tin tuyển dụng</h1>
          <p>Tìm dấu hiệu cần xem lại trong tin tuyển dụng thuộc mọi ngành nghề.</p>
        </div>
        <span className="admin-draft-label">Công cụ hỗ trợ</span>
      </div>

      <div className="admin-review-layout">
        <section
          className="admin-panel admin-review-form-panel"
          aria-labelledby="review-form-title"
        >
          <div className="admin-panel-heading">
            <div>
              <h2 id="review-form-title">Nội dung cần rà soát</h2>
              <p>Dữ liệu chỉ được xử lý trong phiên trình duyệt này.</p>
            </div>
          </div>
          <form onSubmit={review}>
            <label className="admin-review-label" htmlFor="job-title">
              Chức danh <span>Tùy chọn</span>
            </label>
            <input
              id="job-title"
              className="admin-review-input"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setHasReviewed(false);
              }}
              placeholder="Ví dụ: Nhân viên kế toán tổng hợp"
            />
            <label className="admin-review-label" htmlFor="job-description">
              Mô tả công việc và điều kiện tuyển dụng <span>Bắt buộc</span>
            </label>
            <textarea
              id="job-description"
              className="admin-review-textarea"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setHasReviewed(false);
              }}
              placeholder="Dán nội dung tin tuyển dụng tại đây…"
              rows={12}
            />
            {error && (
              <p className="admin-review-error" role="alert">
                {error}
              </p>
            )}
            <div className="admin-review-actions">
              <button type="submit" className="admin-review-primary">
                <Search size={16} aria-hidden="true" /> Rà soát nội dung
              </button>
              <button type="button" className="admin-review-clear" onClick={clear}>
                <RotateCcw size={15} aria-hidden="true" /> Xóa nội dung
              </button>
              <button
                type="button"
                className="admin-review-clear"
                onClick={() => {
                  setTitle(sampleTitle);
                  setContent(sampleContent);
                  setHasReviewed(false);
                  setError("");
                }}
              >
                Điền nội dung mẫu
              </button>
            </div>
          </form>
        </section>

        <aside className="admin-review-side">
          <section className="admin-review-note">
            <div className="admin-review-note-icon">
              <AlertTriangle size={18} aria-hidden="true" />
            </div>
            <h2>Cách đọc kết quả</h2>
            <p>
              Công cụ dò các cụm từ đã cấu hình và gợi ý điều khoản để đối chiếu. Kết quả không xác
              định tin có vi phạm pháp luật hay không.
            </p>
            <a href={LABOR_CODE_URL} target="_blank" rel="noreferrer">
              Mở Bộ luật Lao động 2019 <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </section>
          <section className="admin-review-rule-summary" aria-label="Phạm vi rà soát">
            <h2>Phạm vi từ khóa</h2>
            <ul>
              <li>
                <Check size={15} aria-hidden="true" /> Đặt cọc và giấy tờ gốc
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> Tiền lương làm thêm giờ
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> Thời gian thử việc
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> Điều khoản sau khi nghỉ việc
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> Điều kiện tuyển dụng cá nhân
              </li>
            </ul>
          </section>
        </aside>
      </div>

      {hasReviewed && (
        <section
          className="admin-panel admin-review-results"
          aria-live="polite"
          aria-labelledby="review-results-title"
        >
          <div className="admin-panel-heading">
            <div>
              <h2 id="review-results-title">Kết quả rà soát</h2>
              <p>
                {matches.length
                  ? `Có ${matches.length} nhóm dấu hiệu cần xem lại.`
                  : "Không tìm thấy từ khóa trong phạm vi rà soát."}
              </p>
            </div>
            <span
              className={
                matches.length
                  ? "admin-review-count admin-review-count--flagged"
                  : "admin-review-count"
              }
            >
              {matches.length} dấu hiệu
            </span>
          </div>
          {matches.length ? (
            <div className="admin-review-result-list">
              {matches.map((match) => (
                <article className="admin-review-result" key={match.id}>
                  <div className="admin-review-result-head">
                    <span>
                      <AlertTriangle size={16} aria-hidden="true" /> Dấu hiệu cần xem lại
                    </span>
                    <small>{match.article}</small>
                  </div>
                  <h3>{match.title}</h3>
                  <p className="admin-review-matched">
                    Cụm từ tìm thấy: {match.matchedTerms.map((term) => `“${term}”`).join(", ")}
                  </p>
                  <p>{match.guidance}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-review-clear-state">
              <Check size={19} aria-hidden="true" />
              <p>
                Không có cụm từ nào trong danh sách rà soát được tìm thấy. Nội dung vẫn cần được đọc
                theo đầy đủ ngữ cảnh.
              </p>
            </div>
          )}
          <p className="admin-review-disclaimer">
            Đây là bước sàng lọc từ khóa, không phải kết luận pháp lý. Cần rà soát toàn bộ ngữ cảnh,
            loại công việc và trường hợp cụ thể trước khi xử lý tin.
          </p>
        </section>
      )}
    </AdminShell>
  );
}
