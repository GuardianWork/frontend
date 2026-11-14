import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { createFileRoute } from "@tanstack/react-router";
import { askLegalQuestion, type LegalChatReport } from "@/services/legalChat";
import { ApiError } from "@/services/api";
import { AdminShell } from "@/components/AdminShell";
import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Scale,
} from "lucide-react";
import "@/components/candidate/legal-chat.css";

export const Route = createFileRoute("/can/copilot")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
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

type QueryPreset = { id: string; question: string; badge: string };
const PRESETS: QueryPreset[] = [
  {
    id: "q-1",
    badge: "Điều 25",
    question:
      "Công ty yêu cầu tôi thử việc 3 tháng cho vị trí kỹ sư yêu cầu trình độ đại học. Theo Điều 25 Bộ luật Lao động 2019, tôi cần kiểm tra điều kiện gì?",
  },
  {
    id: "q-2",
    badge: "Điều 98",
    question:
      "Theo Điều 98 Bộ luật Lao động 2019, làm thêm giờ ngày lễ được tính lương như thế nào?",
  },
  {
    id: "q-3",
    badge: "Điều 35",
    question:
      "Theo Điều 35 Bộ luật Lao động 2019, người làm theo hợp đồng không xác định thời hạn cần báo trước khi nghỉ việc bao lâu và có ngoại lệ nào?",
  },
  {
    id: "q-4",
    badge: "Điều 46",
    question: "Theo Điều 46 Bộ luật Lao động 2019, điều kiện và cách tính trợ cấp thôi việc là gì?",
  },
  {
    id: "q-5",
    badge: "Điều 127",
    question:
      "Theo Điều 127 Bộ luật Lao động 2019, công ty có được phạt tiền và trừ lương thay cho xử lý kỷ luật không?",
  },
];
type Exchange = {
  id: number;
  question: string;
  answer: string;
  status: "pending" | "completed" | "error";
  report?: LegalChatReport;
  error?: string;
};
type Conversation = { id: number; title: string; exchanges: Exchange[]; draft: string };
const topicNames = [
  "Thời gian thử việc",
  "Lương làm thêm ngày lễ",
  "Báo trước khi nghỉ việc",
  "Trợ cấp thôi việc",
  "Phạt tiền và trừ lương",
];
const starterNames = [
  "Thử việc 3 tháng có đúng luật?",
  "Làm ngày lễ được tính lương thế nào?",
  "Nghỉ việc cần báo trước bao lâu?",
  "Tôi có được trợ cấp thôi việc không?",
];
const emptyConversation = (id: number): Conversation => ({
  id,
  title: "Cuộc trò chuyện mới",
  exchanges: [],
  draft: "",
});

function CandidateCopilotPage() {
  const [conversations, setConversations] = useState<Conversation[]>([emptyConversation(0)]);
  const [activeId, setActiveId] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copyError, setCopyError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(true);
  const nextId = useRef(1);
  const requestController = useRef<AbortController | null>(null);
  const [requesting, setRequesting] = useState(false);
  useEffect(() => () => requestController.current?.abort(), []);
  const composer = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const active = conversations.find((conversation) => conversation.id === activeId)!;
  const recent = conversations.filter(
    (conversation) => conversation.exchanges.length > 0 || conversation.draft.trim(),
  );
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
    setCopiedId(null);
    setCopyError("");
  }, [activeId, active.exchanges]);
  useEffect(() => {
    const field = composer.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 160)}px`;
  }, [active.draft, activeId]);

  const updateDraft = (draft: string) =>
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === activeId ? { ...conversation, draft } : conversation,
      ),
    );
  const send = async (question: string, retryId?: number) => {
    const trimmed = question.trim();
    if (!trimmed || requestController.current || Array.from(trimmed).length > 2000) return;
    const conversationId = activeId;
    const id = retryId ?? nextId.current++;
    const controller = new AbortController();
    requestController.current = controller;
    setRequesting(true);
    const exchange: Exchange = { id, question: trimmed, answer: "", status: "pending" };
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: conversation.exchanges.length ? conversation.title : trimmed,
              exchanges: retryId
                ? conversation.exchanges.map((item) => (item.id === id ? exchange : item))
                : [...conversation.exchanges, exchange],
              draft: retryId ? conversation.draft : "",
            }
          : conversation,
      ),
    );
    composer.current?.focus();
    const update = (patch: Partial<Exchange>) =>
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                exchanges: conversation.exchanges.map((item) =>
                  item.id === id ? { ...item, ...patch } : item,
                ),
              }
            : conversation,
        ),
      );
    try {
      const report = await askLegalQuestion(trimmed, controller.signal);
      if (!controller.signal.aborted)
        update({ status: "completed", answer: report.answer, report });
    } catch (error) {
      if (!controller.signal.aborted)
        update({
          status: "error",
          error:
            error instanceof ApiError && error.status === 429
              ? "Trợ lý đang xử lý nhiều yêu cầu. Hãy đợi một lát rồi thử lại."
              : "Chưa thể nhận phản hồi từ dịch vụ AI. Câu hỏi của bạn được giữ lại; hãy thử lại sau.",
        });
    } finally {
      if (!controller.signal.aborted) {
        requestController.current = null;
        setRequesting(false);
      }
    }
  };
  const newConversation = () => {
    if (active.exchanges.length || active.draft) {
      const blank = conversations.find(
        (conversation) => !conversation.exchanges.length && !conversation.draft,
      );
      if (blank) setActiveId(blank.id);
      else {
        const next = emptyConversation(nextId.current++);
        setConversations((previous) => [next, ...previous]);
        setActiveId(next.id);
      }
    }
    composer.current?.focus();
  };
  const copyAnswer = async (exchange: Exchange) => {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(exchange.answer);
      clearTimeout(copyTimer.current);
      setCopiedId(exchange.id);
      copyTimer.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopyError("Không thể sao chép tự động. Hãy chọn nội dung câu trả lời để sao chép.");
    }
  };

  return (
    <AdminShell title="Trợ lý pháp lý" role="candidate">
      <div
        className={`legal-chat${historyOpen ? "" : " legal-chat--history-closed"}${active.exchanges.length ? "" : " legal-chat--empty"}`}
      >
        <aside
          id="legal-chat-history"
          className="legal-chat-rail"
          aria-label="Cuộc trò chuyện và chủ đề"
        >
          <div className="legal-chat-rail-title">
            <MessageSquare size={17} aria-hidden="true" /> Không gian trò chuyện
          </div>
          <button className="legal-chat-new" type="button" onClick={newConversation}>
            <Plus size={18} aria-hidden="true" />
            Cuộc trò chuyện mới
          </button>
          <section className="legal-chat-history" aria-labelledby="chat-history-heading">
            <h2 id="chat-history-heading">Cuộc trò chuyện</h2>
            {recent.length ? (
              <ul>
                {recent.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      aria-current={activeId === conversation.id ? "true" : undefined}
                      onClick={() => setActiveId(conversation.id)}
                      title={
                        conversation.exchanges.length ? conversation.title : conversation.draft
                      }
                    >
                      <MessageSquare size={16} aria-hidden="true" />
                      <span>
                        {conversation.exchanges.length ? conversation.title : conversation.draft}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Các câu hỏi của bạn sẽ xuất hiện ở đây.</p>
            )}
            <p className="legal-chat-session-note">Chỉ lưu trong phiên đang mở.</p>
          </section>
          <details className="legal-chat-topics">
            <summary>
              Chủ đề tham khảo <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <ul>
              {PRESETS.map((preset, index) => (
                <li key={preset.id}>
                  <button
                    type="button"
                    onClick={() => void send(preset.question)}
                    disabled={requesting}
                  >
                    <span>{topicNames[index]}</span>
                    <span>{preset.badge}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
          <a className="legal-chat-source" href="https://vbpl.vn" target="_blank" rel="noreferrer">
            <BookOpen size={16} aria-hidden="true" />
            <span>Cổng VBPL Quốc gia</span>
            <ArrowUpRight size={15} aria-hidden="true" />
            <span className="sr-only"> (mở tab mới)</span>
          </a>
        </aside>
        <section className="legal-chat-main" aria-labelledby="legal-chat-title">
          <header className="legal-chat-header">
            <button
              className="legal-chat-history-toggle"
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              aria-label={historyOpen ? "Ẩn lịch sử trò chuyện" : "Hiện lịch sử trò chuyện"}
              aria-expanded={historyOpen}
              aria-controls="legal-chat-history"
            >
              {historyOpen ? (
                <PanelLeftClose size={18} aria-hidden="true" />
              ) : (
                <PanelLeftOpen size={18} aria-hidden="true" />
              )}
            </button>
            <div>
              <h1 id="legal-chat-title">Trợ lý pháp lý</h1>
              <p>Hiểu rõ hơn về quyền lợi lao động của bạn.</p>
            </div>
            <details className="legal-chat-method">
              <summary>
                Tra cứu bằng AI
                <ChevronDown size={14} aria-hidden="true" />
              </summary>
              <p>
                Tra cứu Bộ luật Lao động 2019 từ dữ liệu pháp luật đã cấu hình. Trích dẫn được đối
                chiếu với nguồn truy xuất; hiệu lực điều khoản cần kiểm tra thêm. Mỗi câu hỏi được
                xử lý độc lập: hãy nêu đầy đủ tình huống.
              </p>
            </details>
          </header>
          <div
            ref={transcript}
            className={`legal-chat-transcript${active.exchanges.length ? "" : " legal-chat-transcript--empty"}`}
            role="region"
            aria-label="Nội dung cuộc trò chuyện"
            tabIndex={0}
          >
            {!active.exchanges.length ? (
              <div className="legal-chat-welcome">
                <Scale
                  className="legal-chat-welcome-icon"
                  size={32}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h2>Bạn đang băn khoăn điều gì?</h2>
                <p>
                  Cùng bạn hiểu rõ quyền lợi lao động.
                  <br />
                  Hỏi về hợp đồng, tiền lương hay tình huống bạn đang gặp.
                </p>
                <div className="legal-chat-starters">
                  {PRESETS.slice(0, 4).map((preset, index) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => void send(preset.question)}
                      disabled={requesting}
                    >
                      <span>{starterNames[index]}</span>
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="legal-chat-messages">
                {active.exchanges.map((exchange) => {
                  return (
                    <div key={exchange.id} className="legal-chat-exchange">
                      <div className="legal-chat-question">
                        <span className="sr-only">Bạn: </span>
                        <p>{exchange.question}</p>
                      </div>
                      <article
                        className="legal-chat-answer"
                        aria-label="Phản hồi AI"
                        aria-busy={exchange.status === "pending"}
                      >
                        <div className="legal-chat-answer-label">
                          <Scale size={18} aria-hidden="true" />
                          <span>GuardianWork</span>
                          <span>
                            {exchange.status === "pending"
                              ? "Đang tra cứu…"
                              : exchange.status === "error"
                                ? "Chưa có phản hồi"
                                : "Nội dung do AI tạo"}
                          </span>
                        </div>
                        {exchange.status === "pending" && (
                          <p className="legal-chat-pending" role="status">
                            <span className="legal-chat-typing" aria-hidden="true">
                              <i />
                              <i />
                              <i />
                            </span>
                            Đang tra cứu căn cứ và tạo câu trả lời. Bạn có thể chuyển cuộc trò
                            chuyện trong lúc chờ.
                          </p>
                        )}
                        {exchange.status === "error" && (
                          <div role="alert">
                            <p>{exchange.error}</p>
                            <button
                              type="button"
                              disabled={requesting}
                              onClick={() => void send(exchange.question, exchange.id)}
                            >
                              Thử lại câu hỏi
                            </button>
                          </div>
                        )}
                        {exchange.status === "completed" && (
                          <>
                            <div className="legal-chat-answer-text">
                              <ReactMarkdown
                                components={{
                                  h1: ({ children }) => <h3>{children}</h3>,
                                  h2: ({ children }) => <h3>{children}</h3>,
                                  a: ({ children, href }) => (
                                    <a href={href} target="_blank" rel="noreferrer">
                                      {children}
                                      <span className="sr-only"> (mở tab mới)</span>
                                    </a>
                                  ),
                                }}
                              >
                                {exchange.answer}
                              </ReactMarkdown>
                            </div>
                            {exchange.report?.status === "INSUFFICIENT_CONTEXT" && (
                              <p className="legal-chat-generic-note">
                                Hãy bổ sung tình huống hoặc điều khoản để tra cứu lại.
                              </p>
                            )}
                            {!!exchange.report?.citations.length && (
                              <details className="legal-chat-citations">
                                <summary>
                                  <BookOpen size={15} aria-hidden="true" />
                                  Căn cứ được truy xuất · {exchange.report.citations.length} trích
                                  dẫn
                                  <ChevronDown size={14} aria-hidden="true" />
                                </summary>
                                <ul>
                                  {exchange.report.citations.map((citation, index) => (
                                    <li key={`${citation.nodeId}:${index}`}>
                                      <strong>{citation.label}</strong>
                                      <span>{citation.documentNumber}</span>
                                      <blockquote>{citation.quote}</blockquote>
                                      <span>
                                        {citation.effectiveStatus || "Chưa rõ trạng thái văn bản"} ·{" "}
                                        {citation.applicability === "UNVERIFIED"
                                          ? "Cần xác minh hiệu lực điều khoản"
                                          : "Đã đối chiếu phiên bản"}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            )}
                            {exchange.report?.warnings.map((warning, index) => (
                              <p key={index} className="legal-chat-generic-note">
                                {warning}
                              </p>
                            ))}
                          </>
                        )}
                        {exchange.status === "completed" && (
                          <button
                            type="button"
                            className="legal-chat-copy"
                            disabled={exchange.status !== "completed"}
                            onClick={() => void copyAnswer(exchange)}
                          >
                            {copiedId === exchange.id ? (
                              <Check size={15} aria-hidden="true" />
                            ) : (
                              <Copy size={15} aria-hidden="true" />
                            )}
                            {copiedId === exchange.id ? "Đã sao chép" : "Sao chép câu trả lời"}
                          </button>
                        )}
                      </article>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <footer className="legal-chat-compose-area">
            <div className="legal-chat-live sr-only" role="status">
              {requesting
                ? "Đang tra cứu và chờ phản hồi AI."
                : active.exchanges.length
                  ? `Đã cập nhật cuộc trò chuyện với ${active.exchanges.length} câu hỏi.`
                  : "Sẵn sàng nhận câu hỏi."}
            </div>
            {copyError && (
              <p className="legal-chat-copy-error" role="alert">
                {copyError}
              </p>
            )}
            <form
              className="legal-chat-composer"
              onSubmit={(event) => {
                event.preventDefault();
                void send(active.draft);
              }}
            >
              <label className="sr-only" htmlFor="legal-chat-input">
                Câu hỏi về hợp đồng hoặc thử việc
              </label>
              <textarea
                ref={composer}
                id="legal-chat-input"
                rows={2}
                maxLength={2000}
                value={active.draft}
                onChange={(event) => updateDraft(event.target.value)}
                placeholder="Hỏi về hợp đồng, thử việc, tiền lương…"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void send(active.draft);
                  }
                }}
                aria-describedby="legal-chat-input-hint"
              />
              <div className="legal-chat-compose-tools">
                <span id="legal-chat-input-hint">Enter để gửi · Shift + Enter để xuống dòng</span>
                <button
                  type="submit"
                  aria-label="Gửi câu hỏi"
                  disabled={requesting || !active.draft.trim()}
                >
                  <ArrowUp size={20} aria-hidden="true" />
                </button>
              </div>
            </form>
            <p className="legal-chat-disclaimer">
              Nội dung do AI tạo, chỉ mang tính tham khảo. Mỗi câu hỏi cần nêu đầy đủ tình huống.
              Hiệu lực điều khoản cần được đối chiếu; không thay thế tư vấn của luật sư.
            </p>
          </footer>
        </section>
      </div>
    </AdminShell>
  );
}
