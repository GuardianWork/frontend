import { GlobeIcon, MenuIcon, CloseIcon, ArrowRightIcon } from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import { Link, useHydrated, useRouterState } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCandidate } from "@/context/CandidateContext";
import { isStaffUser } from "@/services/auth";
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
  const menuToggle = useRef<HTMLButtonElement>(null);
  const hydrated = useHydrated();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentHref = useRouterState({ select: (state) => state.location.href });
  const landing = variant === "landing";
  const en = locale === "en";
  const displayName = user ? `${user.lastName} ${user.firstName}`.trim() : "";
  const initials = user
    ? `${user.lastName.charAt(0)}${user.firstName.charAt(0)}`.toUpperCase()
    : "";
  const isActive = (to: string) => pathname === to;
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
        menuToggle.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileOpen]);
  // Guests get public discovery only; the candidate workspace links need a session.
  const links = user
    ? [
        { to: "/can/jobs", label: dict.navWorkbench.jobs },
        { to: "/can/profile", label: dict.navWorkbench.profile },
        { to: "/can/copilot", label: dict.navWorkbench.legalChat },
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
          {user?.role === "USER" && (
            <Link to="/can/account" className="career-header__login">
              {en ? "Account settings" : "Cài đặt tài khoản"}
            </Link>
          )}
          <button
            disabled={!hydrated}
            className="career-language"
            aria-label={en ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
            onClick={() => setLocale(en ? "vn" : "en")}
          >
            <GlobeIcon size={17} />
            <span>{en ? "EN" : "VI"}</span>
          </button>
          {user ? (
            <Link
              to="/can/profile"
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
              <ArrowRightIcon size={15} aria-hidden="true" />
            </Link>
          ) : (
            <Link className="career-header__employer" to="/recruit">
              Recruiter Hub
              <ArrowRightIcon size={15} aria-hidden="true" />
            </Link>
          )}
          <button
            ref={menuToggle}
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
            {mobileOpen ? <CloseIcon size={23} /> : <MenuIcon size={23} />}
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
          {user?.role === "USER" && (
            <Link to="/can/account" onClick={() => setMobileOpen(false)}>
              Cài đặt tài khoản
            </Link>
          )}
          {user && isStaffUser(user) && (
            <Link to="/compliance" onClick={() => setMobileOpen(false)}>
              Admin Console
            </Link>
          )}
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
          {isStaffUser(user) && <Link to="/compliance">Admin Console</Link>}
        </div>
      )}
    </header>
  );
}
