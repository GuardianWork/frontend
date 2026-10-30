import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ApiError } from "@/services/api";
import { AUTH_SESSION_EVENT, hasAuthSession, isStaffUser, loadCurrentUser } from "@/services/auth";
import {
  EmployerOnboardingProvider,
  useEmployerOnboarding,
} from "@/context/EmployerOnboardingContext";
import { EmployerOnboardingPanel } from "@/components/EmployerOnboardingPanel";
import { RecruiterShell } from "@/components/RecruiterShell";
import { loadEmployerOnboarding, type EmployerOnboarding } from "@/services/employerOnboarding";
import { getMemberEmailSecret, getInvitationSecret } from "@/lib/member-email-secret";

function RecruiterAccess({ children }: { children: ReactNode }) {
  const context = useEmployerOnboarding();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const stage = context?.onboarding.stage;
  const companyPage = pathname === "/recruiter/verification";
  const invitationsPage = pathname === "/recruiter/members";
  const allowed =
    stage === "VERIFIED" ||
    (stage === "COMPANY_ACTION_REQUIRED" && (companyPage || invitationsPage)) ||
    ((stage === "PENDING" || stage === "REJECTED") && companyPage);
  if (!allowed)
    return (
      <RecruiterShell title="Thiết lập tuyển dụng">
        <EmployerOnboardingPanel />
      </RecruiterShell>
    );
  return children;
}

/** Restore identity from /me before showing an authenticated workspace. */
export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const area = /^\/(candidate|recruiter|admin|staff)(?:\/|$)/.exec(pathname)?.[1] ?? "";
  const navigate = useNavigate();
  const [state, setState] = useState<{ area: string; ready: boolean; error: string }>({
    area: "",
    ready: false,
    error: "",
  });
  const [onboarding, setOnboarding] = useState<EmployerOnboarding | null>(null);
  const [retry, setRetry] = useState(0);
  const reload = useCallback(() => setRetry((value) => value + 1), []);
  useEffect(() => {
    const sessionChanged = () => {
      if (!hasAuthSession()) reload();
    };
    window.addEventListener(AUTH_SESSION_EVENT, sessionChanged);
    return () => window.removeEventListener(AUTH_SESSION_EVENT, sessionChanged);
  }, [reload]);
  useEffect(() => {
    if (
      (getMemberEmailSecret() || getInvitationSecret()) &&
      area !== "recruiter" &&
      pathname !== "/login"
    ) {
      void navigate({
        to: hasAuthSession()
          ? getInvitationSecret()
            ? "/recruiter/members"
            : "/recruiter/verification"
          : "/login",
        search: { role: "recruiter" },
        replace: true,
      });
    }
  }, [area, pathname, navigate]);
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
        if ((area === "admin" || area === "staff") && !isStaffUser(user))
          throw new ApiError("Tài khoản hiện tại không có quyền truy cập Platform staff.", 403);
        if (area === "recruiter") {
          const next = await loadEmployerOnboarding();
          if (cancelled) return;
          setOnboarding(next);
        }
        if (!cancelled) setState({ area, ready: true, error: "" });
      } catch (error) {
        if (cancelled) return;
        if ((error instanceof ApiError && error.status === 401) || !hasAuthSession()) {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          void navigate({
            to: "/login",
            search:
              area === "staff"
                ? {}
                : {
                    role: area === "recruiter" ? "recruiter" : "candidate",
                    ...(returnTo && !returnTo.startsWith("/login") ? { next: returnTo } : {}),
                  },
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
  if (!area) return children;
  if (state.area === area && state.ready && hasAuthSession()) {
    if (area === "recruiter" && onboarding)
      return (
        <EmployerOnboardingProvider key={retry} initial={onboarding}>
          <RecruiterAccess>{children}</RecruiterAccess>
        </EmployerOnboardingProvider>
      );
    return children;
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      {state.error && (
        <h1 className="text-2xl font-semibold tracking-tight">Chưa thể mở không gian làm việc</h1>
      )}
      <p role={state.error ? "alert" : "status"} className="text-[15px] leading-7 text-ink-2">
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
            search={
              area === "staff" ? {} : { role: area === "recruiter" ? "recruiter" : "candidate" }
            }
            className="rounded-lg border border-warm-border px-4 py-3 text-sm"
          >
            Đăng nhập lại
          </Link>
        </div>
      )}
    </main>
  );
}
