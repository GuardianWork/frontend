import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ShieldCheck, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

export function LoginView() {
  const { dict } = useLanguage();
  const navigate = useNavigate();
  const [role, setRole] = useState<"candidate" | "company">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFillDemo = (type: "candidate" | "company") => {
    if (type === "candidate") {
      setRole("candidate");
      setEmail("priya.devops@hcmc-tech.vn");
      setPassword("guardian2026demo");
    } else {
      setRole("company");
      setEmail("marcus.bennett@notion.vn");
      setPassword("guardian2026demo");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === "candidate") {
        navigate({ to: "/jobs" });
      } else {
        navigate({ to: "/recruit" });
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink transition-colors selection:bg-accent selection:text-accent-ink">
      <Header variant="workbench" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Protected Login info & Demo autofill */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-paper-2 border border-rule relative overflow-hidden">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper border border-rule font-mono text-xs font-semibold text-ink mb-6 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                <span>Xác thực Bảo mật · Protected Login</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-[1.1] mb-4">
                Xác minh danh tính.
                <br />
                <span className="text-accent font-bold">Bảo vệ sự nghiệp của bạn.</span>
              </h1>
              <p className="font-body text-xs sm:text-sm text-ink-2 leading-relaxed mb-8">
                Mọi tài khoản GuardianWork đều được bảo vệ với xác thực pháp lý đa tầng. Ứng viên
                giữ quyền ẩn danh nghiêm ngặt cho đến khi xác nhận quan tâm chung theo Điều 98 Bộ
                luật Lao động.
              </p>
            </div>

            {/* Quick Demo Autofill */}
            <div className="rounded-2xl bg-paper p-4 border border-rule shadow-2xs">
              <div className="font-mono text-[11px] uppercase tracking-wider text-ink-3 font-bold mb-3">
                Điền nhanh tài khoản Demo
              </div>
              <div className="flex flex-col gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleFillDemo("candidate")}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-paper-2 hover:bg-paper-3 border border-rule text-left transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-ink">Cổng Ứng viên (Alex / Priya)</div>
                    <div className="text-[10px] text-ink-3 truncate">priya.devops@hcmc-tech.vn</div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-accent px-2 py-0.5 rounded bg-paper border border-rule">
                    Điền
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillDemo("company")}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-ink text-paper hover:opacity-90 text-left transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-paper">Cổng Doanh nghiệp (Recruiter)</div>
                    <div className="text-[10px] text-paper/70 truncate">
                      marcus.bennett@notion.vn
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-accent px-2 py-0.5 rounded bg-paper/20 border border-white/20">
                    Điền
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Sign in Form */}
          <div className="lg:col-span-7 bg-paper border border-rule rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col justify-center">
            {/* Role Tablist */}
            <div
              role="tablist"
              className="grid grid-cols-2 p-1.5 rounded-2xl bg-paper-2 border border-rule mb-8"
            >
              <button
                type="button"
                role="tab"
                onClick={() => setRole("candidate")}
                aria-selected={role === "candidate"}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  role === "candidate"
                    ? "bg-paper text-ink shadow-sm border border-rule"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                <span>Cổng Ứng viên</span>
              </button>
              <button
                type="button"
                role="tab"
                onClick={() => setRole("company")}
                aria-selected={role === "company"}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  role === "company"
                    ? "bg-paper text-ink shadow-sm border border-rule"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                <span>Cổng Doanh nghiệp</span>
              </button>
            </div>

            <div className="mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-1.5">
                {role === "candidate"
                  ? "Đăng nhập không gian ứng viên"
                  : "Đăng nhập cổng tuyển dụng"}
              </h2>
              <p className="font-body text-xs sm:text-sm text-ink-3">
                {role === "candidate"
                  ? "Truy cập các cơ hội việc làm đã xác thực, sổ cái lương và trợ lý pháp lý."
                  : "Triển khai trợ lý AI tìm kiếm nhân tài và quản lý kênh tuyển dụng tuân thủ."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs uppercase tracking-wider font-bold text-ink-2">
                  Email cá nhân hoặc công việc
                </label>
                <input
                  type="email"
                  required
                  placeholder={role === "candidate" ? "priya@example.com" : "hr@company.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-paper-2 border border-rule font-mono text-xs sm:text-sm text-ink placeholder:text-ink-3 focus:outline-2 focus:outline-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs uppercase tracking-wider font-bold text-ink-2">
                    Mật khẩu
                  </label>
                  <button type="button" className="font-mono text-xs text-accent hover:underline">
                    Quên mật khẩu?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-paper-2 border border-rule font-mono text-xs sm:text-sm text-ink placeholder:text-ink-3 focus:outline-2 focus:outline-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 bg-ink text-paper hover:opacity-90 active:scale-[0.99]"
              >
                <span>
                  {loading
                    ? "Đang xác thực..."
                    : role === "candidate"
                      ? "Đăng nhập với tư cách Ứng viên →"
                      : "Đăng nhập với tư cách Doanh nghiệp →"}
                </span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="h-px bg-rule flex-1" />
                <span className="font-mono text-[11px] text-ink-3 uppercase font-bold">Hoặc</span>
                <div className="h-px bg-rule flex-1" />
              </div>

              <button
                type="button"
                onClick={() => {
                  handleFillDemo(role);
                  setTimeout(() => {
                    if (role === "candidate") navigate({ to: "/jobs" });
                    else navigate({ to: "/recruit" });
                  }, 200);
                }}
                className="w-full py-3 px-6 rounded-full border border-rule bg-paper-2 text-ink font-semibold text-xs sm:text-sm hover:bg-paper-3 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>✨ Đăng nhập nhanh một chạm (Demo)</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-rule text-center">
              <p className="font-body text-xs text-ink-3">
                Chưa có tài khoản?{" "}
                <Link to="/" className="font-bold text-accent hover:underline">
                  Tạo hồ sơ xác thực trên trang chủ →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
