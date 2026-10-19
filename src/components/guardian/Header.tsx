import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Globe, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCandidate } from "@/context/CandidateContext";

export function Header({
  variant = "standard",
}: {
  variant?: "landing" | "workbench" | "standard";
}) {
  const { locale, setLocale, dict } = useLanguage();
  const { appliedJobs, savedJobs } = useCandidate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const landing = variant === "landing";
  const en = locale === "en";
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const links = [
    { to: "/candidate/jobs", label: dict.navWorkbench.jobs },
    { to: "/candidate/profile", label: dict.navWorkbench.profile },
    { to: "/candidate/copilot", label: dict.navWorkbench.legalChat },
  ];
  return (
    <header className="career-header">
      <div className="career-container career-header__row">
        <Link to="/vn" className="career-brand" aria-label="GuardianWork">
          <span className="career-brand__symbol">
            <ShieldCheck size={24} />
          </span>
          <span>
            Guardian<span className="career-brand__accent">Work</span>
          </span>
        </Link>
        <nav
          className="career-header__nav"
          aria-label={en ? "Main navigation" : "Điều hướng chính"}
        >
          {links.map(({ to, label }) => (
            <Link key={to} to={to} aria-current={pathname === to ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="career-header__tools">
          <button
            className="career-language"
            aria-label={en ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
            onClick={() => setLocale(en ? "vn" : "en")}
          >
            <Globe size={17} />
            <span>{en ? "EN" : "VI"}</span>
          </button>
          <Link className="career-header__login" to="/login">
            {dict.nav.logIn}
          </Link>
          {landing ? (
            <Link className="career-header__employer" to="/register" search={{ role: "recruiter" }}>
              {dict.nav.forCompanies}
            </Link>
          ) : (
            <Link className="career-header__employer" to="/recruit">
              Recruiter Hub
            </Link>
          )}
          <button
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
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
              {label}
            </Link>
          ))}
          <Link to="/recruit" onClick={() => setMobileOpen(false)}>
            {dict.nav.forCompanies}
          </Link>
          <Link to="/compliance" onClick={() => setMobileOpen(false)}>
            Admin Console
          </Link>
          <Link to="/login" onClick={() => setMobileOpen(false)}>
            {dict.nav.logIn}
          </Link>
          <Link to="/register" search={{ role: "candidate" }} onClick={() => setMobileOpen(false)}>
            {en ? "Create candidate account" : "Đăng ký tìm việc"}
          </Link>
        </nav>
      )}
      {!landing && (
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
