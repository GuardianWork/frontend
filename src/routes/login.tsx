import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Authentication — GuardianWork" },
      {
        name: "description",
        content: "Verify identity and authenticate into candidate, recruiter, or admin spaces.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"candidate" | "recruiter" | "admin">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemoFill = (type: "candidate" | "recruiter" | "admin") => {
    setRole(type);
    if (type === "candidate") {
      setEmail("an.nguyen@guardianwork.vn");
      setPassword("guardian2026demo");
    } else if (type === "recruiter") {
      setEmail("marcus.recruiter@notion.vn");
      setPassword("guardian2026demo");
    } else {
      setEmail("admin@guardianwork.vn");
      setPassword("admin2026demo");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === "candidate") {
        navigate({ to: "/candidate/jobs" });
      } else if (role === "recruiter") {
        navigate({ to: "/recruiter" });
      } else {
        navigate({ to: "/admin" });
      }
    }, 400);
  };

  return (
    <AdminShell title="Authentication">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
          Identity & Role Verification
        </h2>
        <p className="text-base text-charcoal-83 max-w-2xl">
          Bảo mật đa tầng với định danh điện tử, phân quyền theo 3 phân hệ: Ứng viên IT, Doanh
          nghiệp tuyển dụng, và Quản trị viên hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl">
        {/* Left Pane: Info & Quick autofill */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-paper-white p-6 rounded-xl border border-warm-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-xs text-green-700 uppercase tracking-wider">
                Protected Portal
              </span>
            </div>
            <h3 className="text-xl font-bold text-charcoal-text leading-tight mb-2">
              Xác minh danh tính.
              <br />
              <span className="text-primary font-normal">Bảo vệ quyền lợi pháp lý.</span>
            </h3>
            <p className="text-xs text-charcoal-83 leading-relaxed mb-6">
              Mọi tài khoản GuardianWork đều được mã hóa với xác thực pháp lý đa tầng theo chuẩn Bộ
              luật Lao động 2019.
            </p>

            <div className="space-y-2 pt-4 border-t border-warm-border">
              <span className="font-semibold text-[11px] text-charcoal-40 uppercase block mb-1">
                Tài khoản Demo Một chạm
              </span>
              <button
                type="button"
                onClick={() => handleDemoFill("candidate")}
                className="w-full p-3 rounded-lg bg-surface-container-low hover:bg-surface-container border border-warm-border text-left transition-colors flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-semibold text-charcoal-text">Cổng Ứng viên (/candidate)</div>
                  <div className="text-[10px] text-charcoal-40 font-mono">
                    an.nguyen@guardianwork.vn
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-paper-white border border-warm-border font-mono text-[10px] font-bold">
                  Fill
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill("recruiter")}
                className="w-full p-3 rounded-lg bg-surface-container-low hover:bg-surface-container border border-warm-border text-left transition-colors flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-semibold text-charcoal-text">
                    Cổng Doanh nghiệp (/recruiter)
                  </div>
                  <div className="text-[10px] text-charcoal-40 font-mono">
                    marcus.recruiter@notion.vn
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-paper-white border border-warm-border font-mono text-[10px] font-bold">
                  Fill
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill("admin")}
                className="w-full p-3 rounded-lg bg-primary text-on-primary hover:opacity-90 border border-primary text-left transition-all flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-semibold">Cổng Quản trị (/admin)</div>
                  <div className="text-[10px] text-on-primary/70 font-mono">
                    admin@guardianwork.vn
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white/20 font-mono text-[10px] font-bold">
                  Fill
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Form */}
        <div className="lg:col-span-7">
          <div className="bg-paper-white p-8 rounded-xl border border-warm-border shadow-sm flex flex-col justify-center">
            {/* Tabs */}
            <div className="flex p-1 bg-surface-container-low rounded-lg border border-warm-border mb-6">
              <button
                type="button"
                onClick={() => setRole("candidate")}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                  role === "candidate"
                    ? "bg-paper-white text-charcoal-text shadow-sm border border-warm-border"
                    : "text-charcoal-40 hover:text-charcoal-text"
                }`}
              >
                Cổng Ứng viên
              </button>
              <button
                type="button"
                onClick={() => setRole("recruiter")}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                  role === "recruiter"
                    ? "bg-paper-white text-charcoal-text shadow-sm border border-warm-border"
                    : "text-charcoal-40 hover:text-charcoal-text"
                }`}
              >
                Doanh nghiệp
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                  role === "admin"
                    ? "bg-paper-white text-charcoal-text shadow-sm border border-warm-border"
                    : "text-charcoal-40 hover:text-charcoal-text"
                }`}
              >
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                  Địa chỉ Email định danh
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-40">
                    <Icon name="mail" className="!text-base" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal-40 uppercase block mb-1">
                  Mật khẩu bảo mật
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-40">
                    <Icon name="lock" className="!text-base" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-warm-border rounded-lg text-sm text-charcoal-text focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-charcoal-83">
                  <input type="checkbox" defaultChecked className="rounded border-warm-border" />
                  <span>Duy trì đăng nhập an toàn</span>
                </label>
                <a href="#" className="font-semibold text-primary hover:underline">
                  Quên mật khẩu?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <Icon name="sync" className="!text-base animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <Icon name="verified" className="!text-base" />
                    <span>
                      Đăng nhập vào{" "}
                      {role === "candidate"
                        ? "Cổng Ứng Viên"
                        : role === "recruiter"
                          ? "Cổng Tuyển Dụng"
                          : "Cổng Admin"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
