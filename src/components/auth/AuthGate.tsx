import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ApiError } from "@/services/api";
import { hasAuthSession, loadCurrentUser } from "@/services/auth";
import { loadCompanyVerification } from "@/services/companyVerification";

/** Restore identity from /me before showing an authenticated workspace. */
export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const area = /^\/(candidate|recruiter|admin)(?:\/|$)/.exec(pathname)?.[1] ?? "";
  const navigate = useNavigate();
  const [state, setState] = useState<{ area: string; ready: boolean; error: string }>({
    area: "",
    ready: false,
    error: "",
  });
  const [retry, setRetry] = useState(0);
  const reload = useCallback(() => setRetry((value) => value + 1), []);
  useEffect(() => {
    if (!area) {
      setState({ area: "", ready: false, error: "" });
      return;
    }
    let cancelled = false;
    setState({ area, ready: false, error: "" });
    const restore = async () => {
      try {
        if (!hasAuthSession()) throw new ApiError("Vui lòng đăng nhập để tiếp tục.", 401);
        const user = await loadCurrentUser();
        if (area === "admin" && user.role !== "ADMIN")
          throw new ApiError("Tài khoản hiện tại không có quyền quản trị.", 403);
        if (area === "recruiter" && user.activeMembership) await loadCompanyVerification();
        if (!cancelled) setState({ area, ready: true, error: "" });
      } catch (error) {
        if (cancelled) return;
        if ((error instanceof ApiError && error.status === 401) || !hasAuthSession()) {
          void navigate({
            to: "/login",
            search: { role: area === "recruiter" ? "recruiter" : "candidate" },
            replace: true,
          });
        } else
          setState({
            area,
            ready: false,
            error: error instanceof Error ? error.message : "Không thể tải tài khoản.",
          });
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, [area, navigate, retry]);
  if (!area || (state.area === area && state.ready && hasAuthSession())) return children;
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p role={state.error ? "alert" : "status"} className="text-sm leading-6">
        {state.error || "Đang tải thông tin tài khoản…"}
      </p>
      {state.error && (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reload}
            className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary"
          >
            Thử lại
          </button>
          <Link
            to="/login"
            search={{ role: area === "recruiter" ? "recruiter" : "candidate" }}
            className="rounded-lg border border-warm-border px-4 py-3 text-sm"
          >
            Đăng nhập lại
          </Link>
        </div>
      )}
    </main>
  );
}
