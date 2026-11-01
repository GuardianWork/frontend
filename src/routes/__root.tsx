import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  redirect,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import modernCss from "../modern.css?url";
import sitePolishCss from "../site-polish.css?url";
import { IS_STAFF_PORTAL, staffPortalHref } from "../lib/portal";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-2 px-6 py-12">
      <div className="max-w-md text-center">
        <p className="mb-4 text-2xl font-semibold text-primary">404</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Không tìm thấy trang</h1>
        <p className="mt-2 text-[15px] leading-7 text-ink-2">
          Trang bạn tìm không còn ở địa chỉ này. Hãy quay lại trang chủ để tiếp tục.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary min-h-11 px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-2 px-6 py-12">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Chưa thể tải trang</h1>
        <p className="mt-2 text-[15px] leading-7 text-ink-2">
          Đã có lỗi khi tải nội dung. Bạn có thể thử lại hoặc quay về trang chủ.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary min-h-11 px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Thử tải lại
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background min-h-11 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ location }) => {
    const path = location.pathname;
    const canonical = path
      .replace(/^\/candidate(?=\/|$)/, "/can")
      .replace(/^\/recruiter(?=\/|$)/, "/rec");
    if (!IS_STAFF_PORTAL && canonical !== path)
      throw redirect({
        href: canonical + location.searchStr + (location.hash ? `#${location.hash}` : ""),
        replace: true,
      });
    const staffDestination =
      path === "/admin/job-approvals" ? "/staff/jobs" : path.replace(/^\/admin(?=\/|$)/, "/staff");
    const staffPath = /^\/(staff|admin)(?:\/|$)/.test(path);
    if (!IS_STAFF_PORTAL && staffPath) {
      const destination = staffDestination;
      throw redirect({
        href: staffPortalHref(`${destination}${location.searchStr}`),
        replace: true,
      });
    }
    if (IS_STAFF_PORTAL && /^\/admin(?:\/|$)/.test(path)) {
      throw redirect({
        href: staffDestination + location.searchStr,
        replace: true,
      });
    }
    if (IS_STAFF_PORTAL && path !== "/login" && !/^\/staff(?:\/|$)/.test(path)) {
      throw redirect({ to: "/login", replace: true });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GuardianWork | Việc làm đa ngành và tuyển dụng tại Việt Nam" },
      {
        name: "description",
        content:
          "Tìm việc làm đa ngành tại Việt Nam: kinh doanh, tiếp thị, kế toán, nhân sự, vận hành và công nghệ. Kết nối ứng viên với doanh nghiệp trên GuardianWork.",
      },
      {
        property: "og:title",
        content: "GuardianWork | Việc làm đa ngành và tuyển dụng tại Việt Nam",
      },
      {
        property: "og:description",
        content:
          "Khám phá việc làm đa ngành và kết nối với doanh nghiệp tại Việt Nam cùng GuardianWork.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: modernCss },
      { rel: "stylesheet", href: sitePolishCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { ThemeProvider } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import { CandidateProvider } from "../context/CandidateContext";
import { RecruiterProvider } from "../context/RecruiterContext";
import { AuthGate } from "../components/auth/AuthGate";

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="h-full antialiased font-sans">
      <head>
        <HeadContent />
      </head>
      <body
        data-portal={IS_STAFF_PORTAL ? "staff" : "public"}
        className="min-h-full flex flex-col bg-paper text-ink"
      >
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { AUTH_SESSION_EVENT, hasAuthSession } from "../services/auth";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    const clearPrivateCache = () => {
      if (!hasAuthSession()) queryClient.clear();
    };
    window.addEventListener(AUTH_SESSION_EVENT, clearPrivateCache);
    return () => window.removeEventListener(AUTH_SESSION_EVENT, clearPrivateCache);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <CandidateProvider>
            <RecruiterProvider>
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <AuthGate>
                <Outlet />
              </AuthGate>
            </RecruiterProvider>
          </CandidateProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
