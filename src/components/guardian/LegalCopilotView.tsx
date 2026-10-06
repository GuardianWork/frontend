import React, { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {
  Scale,
  Sparkles,
  Paperclip,
  Send,
  ExternalLink,
  ShieldAlert,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  time: string;
  articles?: string[];
}

export function LegalCopilotView() {
  const { dict } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-ai",
      sender: "ai",
      content: `Chào bạn! Tôi là **Vietnamese Labour Law AI Copilot** — Trợ lý AI Tra cứu Pháp luật Lao động và Hợp đồng theo chuẩn **Bộ luật Lao động 2019 (Số: 45/2019/QH14)** và **Luật Ban hành văn bản quy phạm pháp luật**.\n\nHệ thống được thiết kế tuân thủ nghiêm ngặt **Luật Trí tuệ nhân tạo số 134/2025/QH15** và **Nghị định 142/2026/NĐ-CP** (hiệu lực từ 01/03/2026), đảm bảo tính nguyên bản, minh bạch và định danh rõ ràng nội dung do AI tạo ra.\n\nBạn có thể chọn một trong các câu hỏi pháp lý mẫu bên dưới hoặc nhập câu hỏi trực tiếp về hợp đồng, thử việc, làm thêm giờ, hoặc bảo hiểm.`,
      time: "10:14 AM",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetQuestions = dict.mockupData.presetQuestions;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    // Find if it matches one of the preset answers
    const matchedPreset = presetQuestions.find(
      (p) =>
        p.question.toLowerCase() === text.toLowerCase() ||
        p.label.toLowerCase() === text.toLowerCase(),
    );

    setTimeout(() => {
      let replyContent = "";
      if (matchedPreset) {
        replyContent = matchedPreset.answer;
      } else {
        replyContent = `Căn cứ theo **Bộ luật Lao động 2019 (Số: 45/2019/QH14)**:\n\nĐối với câu hỏi của bạn về: "${text}":\n\n1. **Quyền của người lao động:** Được trả lương đầy đủ, đúng hạn; làm việc trong môi trường bảo đảm an toàn, vệ sinh lao động.\n2. **Nghĩa vụ của người sử dụng lao động:** Giao kết hợp đồng lao động bằng văn bản, đóng BHXH, BHYT, BHTN bắt buộc theo Điều 168.\n3. **Giải quyết tranh chấp:** Trường hợp quyền lợi bị xâm phạm, bạn có quyền yêu cầu hòa giải viên lao động hoặc khởi kiện tại Tòa án nhân dân.\n\n*Lưu ý: Thông tin do AI trích dẫn mang tính tham khảo đối chiếu VBQPPL và không thay thế cho văn bản tư vấn pháp lý chính thức.*`;
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        content: replyContent,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-accent selection:text-accent-ink">
      <Header variant="workbench" />

      {/* Sub-nav */}
      <div className="border-b border-rule bg-paper-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <Link
              to="/jobs"
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold bg-paper text-ink-2 hover:text-ink hover:bg-paper-3 border border-rule transition-colors flex items-center gap-1.5"
            >
              <span>01</span>
              <span>{dict.navWorkbench.jobs}</span>
            </Link>
            <Link
              to="/profile"
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold bg-paper text-ink-2 hover:text-ink hover:bg-paper-3 border border-rule transition-colors flex items-center gap-1.5"
            >
              <span>03</span>
              <span>{dict.navWorkbench.profile}</span>
            </Link>
            <Link
              to="/copilot"
              className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold bg-accent text-accent-ink flex items-center gap-1.5 shadow-2xs"
            >
              <span>04</span>
              <span>{dict.navWorkbench.legalChat}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-ink-3">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span>AI Copilot: Trích xuất Bộ luật Lao động 2019</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Title & Badge */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-bold text-accent uppercase tracking-widest">
              05 · Giao diện Cố vấn Pháp lý
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-1 tracking-tight">
              {dict.legalChatbot.copilotTitle}
            </h1>
          </div>
          <span className="font-mono text-xs px-3 py-1.5 rounded-full bg-paper-2 border border-rule text-ink-2 font-semibold self-start sm:self-auto flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-accent" />
            <span>{dict.legalChatbot.laborCodeBadge}</span>
          </span>
        </div>

        {/* Chat Log Container */}
        <div className="flex-1 rounded-2xl border border-rule bg-paper shadow-md flex flex-col min-h-[500px] max-h-[620px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
            {messages.map((m) => {
              const isAi = m.sender === "ai";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1.5 max-w-[92%] sm:max-w-[85%] ${
                    isAi ? "self-start mr-auto" : "self-end ml-auto items-end"
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-[11px] text-ink-3 px-1">
                    {isAi ? (
                      <>
                        <span className="px-2 py-0.5 rounded bg-emerald/10 text-emerald border border-emerald/15 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                          Cung cấp bởi Gemini AI
                        </span>
                        <span>{m.time}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-ink">Bạn (Ứng viên)</span>
                        <span>{m.time}</span>
                      </>
                    )}
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isAi
                        ? "bg-paper-2 border border-rule text-ink rounded-bl-xs"
                        : "bg-ink text-paper rounded-br-xs font-medium"
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed break-words">
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="self-start mr-auto flex items-center gap-2 p-3 rounded-2xl bg-paper-2 border border-rule text-xs font-mono text-ink-3">
                <Sparkles className="w-3.5 h-3.5 text-accent animate-spin" />
                <span>AI đang tra cứu văn bản quy phạm pháp luật...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Transparency Notice Banner */}
        <div className="mt-4 mb-24 px-5 py-3.5 rounded-xl bg-paper-2 border border-rule/60 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-body text-[10px] font-black uppercase tracking-wider text-ink-2 flex items-center gap-1.5">
                <span className="text-amber-500">🛡️</span>
                <span>Tuân thủ Pháp luật AI & VBQPPL</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-paper border border-rule font-mono text-[9px] font-bold text-ink-3">
                Luật AI số 134/2025/QH15
              </span>
              <span className="px-2 py-0.5 rounded bg-paper border border-rule font-mono text-[9px] font-bold text-ink-3">
                Nghị định 142/2026/NĐ-CP
              </span>
            </div>
            <a
              href="https://vbpl.vn"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] font-extrabold text-accent hover:underline flex items-center gap-1"
            >
              <span>Tra cứu Cổng VBPL Quốc gia</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="font-body text-[10px] text-ink-3 leading-relaxed">
            <strong>Thông báo minh bạch:</strong> Thông tin được tạo ra bởi Trợ lý AI dựa trên Bộ
            luật Lao động 2019 và văn bản hướng dẫn thi hành. Không phải là lời khuyên pháp lý hay
            văn bản hành chính có hiệu lực thi hành riêng lẻ.
          </p>
        </div>

        {/* Floating Input Dock with Preset Buttons */}
        <div className="fixed bottom-4 left-0 right-0 z-40 pointer-events-none px-3 sm:px-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {/* Horizontal Preset Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pointer-events-auto">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q.question)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper/95 backdrop-blur-md border border-rule hover:border-accent hover:bg-paper-2 transition-all text-xs font-mono font-bold text-ink shadow-md shrink-0 whitespace-nowrap cursor-pointer active:scale-95"
                >
                  <span className="text-accent font-black">⚡</span>
                  <span>{q.label}</span>
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="pointer-events-auto flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl bg-paper/95 backdrop-blur-md border border-rule shadow-xl transition-all"
            >
              <button
                type="button"
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-paper-2 hover:bg-paper-3 border border-rule text-ink-2 hover:text-accent transition-all active:scale-95 cursor-pointer"
                title="Tải lên tài liệu pháp lý"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Hỏi về hợp đồng, thử việc, tăng ca, bảo hiểm theo Bộ luật Lao động..."
                className="flex-1 px-3 py-2 bg-transparent border-0 font-body text-xs sm:text-sm font-medium text-ink placeholder:text-ink-3 focus:outline-none min-w-0"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="btn !h-9 !px-4.5 !text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <span>Hỏi Trợ lý</span>
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
