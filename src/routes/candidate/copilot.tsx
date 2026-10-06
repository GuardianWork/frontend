import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/candidate/copilot")({
  head: () => ({
    meta: [
      { title: "AI Legal Copilot — GuardianWork Candidate" },
      {
        name: "description",
        content:
          "AI-assisted legal review for Vietnamese Labour Code 2019, probation ceilings, and overtime compliance.",
      },
    ],
  }),
  component: CandidateCopilotPage,
});

type QueryPreset = {
  id: string;
  label: string;
  category: "Labor Law" | "JD Compliance";
  question: string;
  article: string;
  badge: "Điều 25" | "Điều 98" | "Điều 35" | "Điều 46" | "Điều 127";
  answer: string;
  articlesCited: { dieu: string; doc: string; status: string }[];
};

const PRESETS: QueryPreset[] = [
  {
    id: "q-1",
    label: "Thử việc cao đẳng/đại học [Điều 25]",
    category: "Labor Law",
    article: "Điều 25 & Điều 27 Bộ luật Lao động 2019",
    badge: "Điều 25",
    question:
      "Công ty yêu cầu tôi thử việc 3 tháng cho vị trí kỹ sư yêu cầu trình độ đại học, như vậy có đúng luật không?",
    answer:
      "Căn cứ Điều 25 Bộ luật Lao động 2019 (Số 45/2019/QH14):\nThời gian thử việc do hai bên thỏa thuận căn cứ vào tính chất và mức độ phức tạp của công việc nhưng chỉ được thử việc một lần đối với một công việc và bảo đảm điều kiện sau đây:\n\n1. Không quá 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn, kỹ thuật từ cao đẳng trở lên.\n2. Tiền lương của người lao động trong thời gian thử việc do hai bên thỏa thuận nhưng ít nhất phải bằng 85% mức lương của công việc đó (Điều 27).\n\nKết luận: Yêu cầu thử việc 3 tháng (90 ngày) đối với vị trí kỹ sư đại học là VI PHẠM PHÁP LUẬT. Công ty có thể bị phạt hành chính từ 2.000.000 đến 5.000.000 VNĐ.",
    articlesCited: [
      { dieu: "Điều 25", doc: "Bộ luật Lao động 45/2019/QH14", status: "Còn hiệu lực" },
      { dieu: "Điều 27", doc: "Tiền lương thử việc", status: "Còn hiệu lực" },
    ],
  },
  {
    id: "q-2",
    label: "Lương làm thêm ngày lễ [Điều 98]",
    category: "Labor Law",
    article: "Điều 98 & Nghị định 145/2020/NĐ-CP",
    badge: "Điều 98",
    question:
      "Tôi đi làm thêm vào ngày nghỉ lễ thì được trả lương làm thêm giờ ít nhất bằng bao nhiêu phần trăm?",
    answer:
      "Căn cứ Điều 98 khoản 1 điểm c — Bộ luật số 45/2019/QH14:\n\nNgười lao động làm thêm giờ vào ngày nghỉ lễ, tết, ngày nghỉ có hưởng lương được trả lương tính theo đơn giá tiền lương hoặc tiền lương thực trả theo công việc đang làm như sau:\n\n- Vào ngày thường: Ít nhất bằng 150%\n- Vào ngày nghỉ hằng tuần: Ít nhất bằng 200%\n- Vào ngày nghỉ lễ, tết, ngày nghỉ có hưởng lương: Ít nhất bằng 300% chưa kể tiền lương ngày lễ, tết, ngày nghỉ có hưởng lương đối với người lao động hưởng lương ngày.\n\nNhư vậy, tổng số tiền bạn nhận được khi làm việc vào ngày lễ là ít nhất 400% lương của ngày làm việc bình thường.",
    articlesCited: [
      { dieu: "Điều 98", doc: "Bộ luật Lao động 45/2019/QH14", status: "Còn hiệu lực" },
      { dieu: "Điều 55", doc: "Nghị định 145/2020/NĐ-CP", status: "Còn hiệu lực" },
    ],
  },
  {
    id: "q-3",
    label: "Báo trước nghỉ việc [Điều 35]",
    category: "Labor Law",
    article: "Điều 35 Bộ luật Lao động 2019",
    badge: "Điều 35",
    question:
      "Tôi làm theo hợp đồng không xác định thời hạn, giờ muốn nghỉ việc thì phải báo trước cho công ty bao nhiêu ngày?",
    answer:
      "Căn cứ Điều 35 Bộ luật Lao động 2019 về quyền đơn phương chấm dứt hợp đồng lao động của người lao động:\n\n1. Người lao động làm việc theo hợp đồng lao động không xác định thời hạn có quyền đơn phương chấm dứt hợp đồng lao động nhưng phải báo trước cho người sử dụng lao động ít nhất 45 ngày.\n2. Trường hợp hợp đồng xác định thời hạn từ 12 tháng đến 36 tháng: Báo trước ít nhất 30 ngày.\n3. Trường hợp hợp đồng dưới 12 tháng: Báo trước ít nhất 03 ngày làm việc.\n\nNgười lao động không cần phải nêu lý do nghỉ việc, chỉ cần tuân thủ thời hạn báo trước theo luật định.",
    articlesCited: [
      { dieu: "Điều 35", doc: "Bộ luật Lao động 45/2019/QH14", status: "Còn hiệu lực" },
      { dieu: "Điều 36", doc: "Quyền của người sử dụng LĐ", status: "Còn hiệu lực" },
    ],
  },
  {
    id: "q-4",
    label: "Tính trợ cấp thôi việc [Điều 46]",
    category: "JD Compliance",
    article: "Điều 46 Bộ luật Lao động 2019",
    badge: "Điều 46",
    question:
      "Tôi làm cho công ty được 5 năm rồi nghỉ đúng luật, tôi có được trợ cấp thôi việc không và tính thế nào?",
    answer:
      "Căn cứ Điều 46 Bộ luật Lao động 2019:\n\n1. Điều kiện hưởng: Người lao động đã làm việc thường xuyên từ đủ 12 tháng trở lên khi chấm dứt hợp đồng lao động hợp pháp.\n2. Công thức tính: Mỗi năm làm việc được trợ cấp 0.5 tháng tiền lương (Khoản 1 Điều 46).\n3. Thời gian tính trợ cấp: Tổng thời gian làm việc thực tế trừ đi thời gian đã tham gia Bảo hiểm thất nghiệp (BHTN).\n\nLưu ý: Kể từ 01/01/2009, thời gian bạn đã đóng BHTN sẽ do Quỹ Bảo hiểm xã hội chi trả dưới dạng Trợ cấp thất nghiệp, công ty chỉ chi trả cho khoảng thời gian chưa tham gia BHTN.",
    articlesCited: [
      { dieu: "Điều 46", doc: "Bộ luật Lao động 45/2019/QH14", status: "Còn hiệu lực" },
      { dieu: "Điều 8", doc: "Nghị định 145/2020/NĐ-CP", status: "Còn hiệu lực" },
    ],
  },
  {
    id: "q-5",
    label: "Phạt tiền thay kỷ luật [Điều 127]",
    category: "Labor Law",
    article: "Điều 127 Các hành vi bị nghiêm cấm",
    badge: "Điều 127",
    question:
      "Công ty phạt tiền và trừ lương tôi thay cho việc xử lý kỷ luật. Hành vi này có bị nghiêm cấm không?",
    answer:
      "Căn cứ Điều 127 Khoản 2 Bộ luật Lao động 2019:\n\nCác hành vi bị nghiêm cấm khi xử lý kỷ luật lao động bao gồm:\n- Dùng hình thức phạt tiền, cắt lương thay việc xử lý kỷ luật lao động (Khoản 2).\n- Xâm phạm sức khỏe, danh dự, tính mạng, nhân phẩm của người lao động (Khoản 1).\n- Xử lý kỷ luật lao động đối với người lao động có hành vi vi phạm không được quy định trong nội quy lao động (Khoản 3).\n\nKết luận: Hành vi phạt tiền hoặc trừ lương của công ty là HOÀN TOÀN TRÁI PHÁP LUẬT. Công ty có thể bị phạt hành chính từ 20.000.000 đến 40.000.000 VNĐ và buộc phải hoàn trả số tiền đã thu sai theo Nghị định 12/2022/NĐ-CP.",
    articlesCited: [
      { dieu: "Điều 127", doc: "Bộ luật Lao động 45/2019/QH14", status: "Còn hiệu lực" },
      { dieu: "Điều 19", doc: "Nghị định 12/2022/NĐ-CP", status: "Còn hiệu lực" },
    ],
  },
];

function CandidateCopilotPage() {
  const [activeId, setActiveId] = useState(PRESETS[0].id);
  const [customInput, setCustomInput] = useState("");
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activePreset = PRESETS.find((p) => p.id === activeId) || PRESETS[0];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    setCustomAnswer(
      `Căn cứ Bộ luật Lao động 2019 (Số 45/2019/QH14) & Nghị định 145/2020/NĐ-CP:\n\nĐối với câu hỏi: "${customInput}":\n\n1. Người lao động được bảo vệ quyền lợi hợp pháp về tiền lương, thời giờ làm việc và nghỉ ngơi theo luật định.\n2. Người sử dụng lao động không được áp đặt các điều khoản trái với pháp luật lao động hiện hành.\n3. Trường hợp có tranh chấp, người lao động có quyền khiếu nại tới Thanh tra Sở Lao động hoặc khởi kiện tại Tòa án.`,
    );
  };

  const handleCopy = () => {
    const textToCopy = customAnswer || activePreset.answer;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminShell title="AI Legal Copilot" role="candidate">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
            AI Legal Copilot
          </h2>
          <p className="text-base text-charcoal-83 max-w-2xl">
            Trợ lý AI tra cứu pháp lý chuyên sâu theo Bộ luật Lao động 2019, giải đáp tranh chấp và
            kiểm toán hợp đồng lao động.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://vbpl.vn"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 border border-warm-border bg-paper-white text-charcoal-text text-sm font-medium rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="open_in_new" className="!text-base text-primary" />
            <span>Cổng VBPL Quốc gia</span>
          </a>
          <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Gemini AI Engine · Pháp điển hóa 2019</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Preset queries list */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-paper-white p-3 rounded-xl border border-warm-border">
            <span className="font-semibold text-xs text-charcoal-text uppercase tracking-wider">
              Án lệ & Điều khoản Tra cứu Phổ biến ({PRESETS.length})
            </span>
            <span className="text-xs font-mono text-charcoal-40">VBQPPL 2019</span>
          </div>

          {PRESETS.map((p) => {
            const isActive = p.id === activeId && !customAnswer;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setActiveId(p.id);
                  setCustomAnswer(null);
                }}
                className={
                  isActive
                    ? "bg-paper-white p-5 rounded-xl border-l-4 border-l-primary border border-warm-border shadow-sm cursor-pointer transition-all"
                    : "bg-paper-white p-5 rounded-xl border border-warm-border hover:shadow-sm transition-shadow cursor-pointer opacity-85 hover:opacity-100"
                }
              >
                <div className="flex justify-between items-start mb-2 gap-3">
                  <h3 className="font-semibold text-base leading-snug text-charcoal-text">
                    {p.label}
                  </h3>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container text-charcoal-text shrink-0 border border-warm-border">
                    {p.badge}
                  </span>
                </div>
                <p className="text-xs text-charcoal-83 line-clamp-2 mb-3">{p.question}</p>
                <div className="flex items-center gap-1.5 text-xs text-charcoal-40 font-mono">
                  <Icon name="gavel" className="!text-[14px] text-primary" />
                  <span>{p.article}</span>
                </div>
              </div>
            );
          })}

          {/* Quick query form */}
          <div className="bg-paper-white p-4 rounded-xl border border-warm-border shadow-sm mt-2">
            <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Icon name="search" className="!text-base text-primary" />
              Tra cứu Điều khoản Khác
            </h4>
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập câu hỏi về hợp đồng, thử việc..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-xs text-charcoal-text focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-all shrink-0"
              >
                Hỏi
              </button>
            </form>
          </div>
        </div>

        {/* Right Pane: AI Legal Review Inspector */}
        <div className="lg:col-span-7">
          <div className="bg-paper-white rounded-xl border border-warm-border shadow-sm h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-warm-border flex justify-between items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-charcoal-text">
                  {customAnswer ? "Kết quả Tra cứu Tùy chỉnh" : activePreset.label}
                </h3>
                <p className="text-sm text-charcoal-83 font-medium mt-0.5">
                  {customAnswer ? customInput : activePreset.article}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2 border border-warm-border bg-paper-white hover:bg-surface-container text-charcoal-text text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Icon name="content_copy" className="!text-base" />
                <span>{copied ? "Đã sao chép!" : "Sao chép"}</span>
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {/* Question card */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Icon name="contact_support" className="!text-[18px]" />
                  Tình huống Pháp lý Đặt ra
                </h4>
                <div className="p-4 rounded-lg bg-surface-container-low border border-warm-border text-sm text-charcoal-text font-medium leading-relaxed">
                  "{customAnswer ? customInput : activePreset.question}"
                </div>
              </div>

              {/* AI Compliance Note Callout */}
              <div className="bg-parchment-bg border border-warm-border border-l-4 border-l-primary p-5 rounded-lg flex gap-4">
                <Icon name="smart_toy" className="text-primary mt-0.5 !text-2xl shrink-0" />
                <div>
                  <h5 className="text-sm font-semibold text-charcoal-text mb-1">
                    AI Legal Analysis & Statutory Ground
                  </h5>
                  <p className="text-xs text-charcoal-83 leading-relaxed mb-2 font-mono">
                    Hệ thống trích xuất văn bản hợp nhất số 45/2019/QH14, bảo đảm nguyên tắc bảo vệ
                    quyền và lợi ích hợp pháp của người lao động.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {activePreset.articlesCited.map((c) => (
                      <span
                        key={c.dieu}
                        className="px-2 py-0.5 rounded bg-surface-container text-charcoal-text font-bold"
                      >
                        {c.dieu} ({c.status})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Answer Content */}
              <div>
                <h4 className="font-semibold text-xs text-charcoal-40 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Icon name="gavel" className="!text-[18px] text-primary" />
                  Nội dung Tư vấn & Căn cứ Pháp lý
                </h4>
                <div className="p-6 rounded-lg bg-surface-container-low border border-warm-border text-sm text-charcoal-text leading-relaxed whitespace-pre-line font-body">
                  {customAnswer || activePreset.answer}
                </div>
              </div>

              {/* Disclaimer Notice */}
              <div className="p-4 rounded-lg bg-paper-white border border-warm-border text-xs text-charcoal-40 leading-relaxed flex items-start gap-2">
                <Icon name="info" className="!text-base shrink-0 mt-0.5" />
                <span>
                  <strong>Lưu ý:</strong> Thông tin do AI trích dẫn chỉ mang tính chất tham khảo đối
                  chiếu văn bản quy phạm pháp luật và không thay thế cho văn bản tư vấn pháp lý
                  chính thức của luật sư.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
