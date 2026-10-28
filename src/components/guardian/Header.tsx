import { useEffect, useState } from "react";
import { Link, useHydrated, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, X, Globe, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCandidate } from "@/context/CandidateContext";
import { useAuthUser } from "@/hooks/useAuthUser";

export function Header({
  variant = "standard",
}: {
  variant?: "landing" | "workbench" | "standard";
}) {
  const { locale, setLocale, dict } = useLanguage();
  const { appliedJobs, savedJobs } = useCandidate();
  const user = useAuthUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hydrated = useHydrated();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentHref = useRouterState({ select: (state) => state.location.href });
  const landing = variant === "landing";
  const en = locale === "en";
  const displayName = user ? `${user.lastName} ${user.firstName}`.trim() : "";
  const initials = user
    ? `${user.lastName.charAt(0)}${user.firstName.charAt(0)}`.toUpperCase()
    : "";
  const isActive = (to: string) =>
    pathname === to || (to === "/candidate/jobs" && pathname === "/jobs");
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  // Guests get public discovery only; the candidate workspace links need a session.
  const links = user
    ? [
        { to: "/candidate/jobs", label: dict.navWorkbench.jobs },
        { to: "/candidate/profile", label: dict.navWorkbench.profile },
        { to: "/candidate/copilot", label: dict.navWorkbench.legalChat },
      ]
    : [{ to: "/jobs", label: dict.nav.findJob }];
  const loginSearch =
    !user && currentHref && !currentHref.startsWith("/login")
      ? { role: "candidate" as const, next: currentHref }
      : { role: "candidate" as const };
  return (
    <header className="career-header">
      <div className="career-container career-header__row">
        <Link to="/vn" className="career-brand" aria-label="GuardianWork">
          <span className="career-brand__symbol">
            <ShieldCheck size={24} />
          </span>
          <span className="career-brand__lockup">
            <span className="career-brand__name">
              Guardian<span className="career-brand__accent">Work</span>
            </span>
            <span className="career-brand__tagline">
              {en ? "Recruitment & labour law" : "Tuyển dụng & pháp lý lao động"}
            </span>
          </span>
        </Link>
        <nav
          className="career-header__nav"
          aria-label={en ? "Main navigation" : "Điều hướng chính"}
        >
          {links.map(({ to, label }) => (
            <Link key={to} to={to} aria-current={isActive(to) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="career-header__tools">
          <button
            disabled={!hydrated}
            className="career-language"
            aria-label={en ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
            onClick={() => setLocale(en ? "vn" : "en")}
          >
            <Globe size={17} />
            <span>{en ? "EN" : "VI"}</span>
          </button>
          {user ? (
            <Link
              to="/candidate/profile"
              className="career-header__account"
              aria-label={en ? `Your profile, ${displayName}` : `Hồ sơ của ${displayName}`}
              title={displayName}
            >
              <span className="career-header__avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="career-header__account-name">{displayName}</span>
            </Link>
          ) : (
            <Link className="career-header__login" to="/login" search={loginSearch}>
              {dict.nav.logIn}
            </Link>
          )}
          {landing ? (
            <Link className="career-header__employer" to="/register" search={{ role: "recruiter" }}>
              {dict.nav.forCompanies}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : (
            <Link className="career-header__employer" to="/recruit">
              Recruiter Hub
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
          <button
            disabled={!hydrated}
            className="career-icon-button career-header__toggle"
            aria-label={
              mobileOpen
                ? en
                  ? "Close navigation"
                  : "Đóng menu"
                : en
                  ? "Open navigation"
                  : "Mở menu"
            }
            aria-controls="career-mobile-nav"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav
          className="career-mobile-nav"
          id="career-mobile-nav"
          aria-label={en ? "Mobile navigation" : "Điều hướng di động"}
        >
          {user && (
            <p className="career-mobile-nav__identity">
              <span className="career-header__avatar" aria-hidden="true">
                {initials}
              </span>
              <span>
                <strong>{displayName}</strong>
                <span>{en ? "Account" : "Tài khoản"}</span>
              </span>
            </p>
          )}
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              aria-current={isActive(to) ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link to="/recruit" onClick={() => setMobileOpen(false)}>
            {dict.nav.forCompanies}
          </Link>
          <Link to="/compliance" onClick={() => setMobileOpen(false)}>
            Admin Console
          </Link>
          {!user && (
            <>
              <Link to="/login" search={loginSearch} onClick={() => setMobileOpen(false)}>
                {dict.nav.logIn}
              </Link>
              <Link
                to="/register"
                search={{ role: "candidate" }}
                onClick={() => setMobileOpen(false)}
              >
                {en ? "Create candidate account" : "Đăng ký tìm việc"}
              </Link>
            </>
          )}
        </nav>
      )}
      {!landing && user && (
        <div className="career-header__ledger">
          <span>
            {dict.ledger.applied}: {appliedJobs.length}
          </span>
          <span>
            {dict.ledger.saved}: {savedJobs.length}
          </span>
          <Link to="/compliance">Admin Console</Link>
        </div>
      )}
    </header>
  );
}
