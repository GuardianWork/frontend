import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useCandidate } from "@/context/CandidateContext";
import { Menu, X, Palette, Globe, ShieldCheck } from "lucide-react";

export function Header({
  variant = "standard",
}: {
  variant?: "landing" | "workbench" | "standard";
}) {
  const { locale, setLocale, dict } = useLanguage();
  const { theme, setTheme, themes } = useTheme();
  const { profile, appliedJobs, savedJobs, activeTab, setActiveTab } = useCandidate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isLanding =
    variant === "landing" || pathname === "/" || pathname === "/vn" || pathname === "/en";

  return (
    <header
      aria-label="Primary navigation"
      className="nav-n1b sticky top-0 z-40 bg-paper/90 backdrop-blur-md transition-all border-b border-rule/60"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={locale === "en" ? "/en" : "/vn"}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-accent text-accent-ink font-mono text-xs font-black shadow-[1px_1px_0px_var(--color-ink)]">
              GW
            </span>
            <span className="font-display font-extrabold text-xl tracking-tight text-ink group-hover:opacity-90 transition-opacity">
              guardianwork<span className="text-accent">:</span>
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-paper-2 text-ink-3 border border-rule">
            VN · Law 2019
          </span>
        </div>

        {/* Center Navigation */}
        <nav
          aria-label="Site links"
          className="hidden md:flex items-center gap-1 flex-1 justify-center"
        >
          {isLanding ? (
            <>
              <a
                href="#roles"
                className="flex-interactive-row px-4 py-2 rounded-full text-sm font-semibold text-ink-2 hover:text-ink hover:bg-paper-2 transition-all min-h-[40px]"
              >
                {dict.nav.forCompanies}
              </a>
              <a
                href="#how-it-works"
                className="flex-interactive-row px-4 py-2 rounded-full text-sm font-semibold text-ink-2 hover:text-ink hover:bg-paper-2 transition-all min-h-[40px]"
              >
                {dict.nav.forCandidates}
              </a>
              <Link
                to="/recruit"
                className="flex-interactive-row px-4 py-2 rounded-full text-sm font-semibold text-ink-2 hover:text-ink hover:bg-paper-2 transition-all min-h-[40px]"
              >
                Recruiter Hub
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/jobs"
                className={`flex-interactive-row px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[40px] ${
                  pathname.includes("/jobs")
                    ? "bg-accent-subtle text-accent font-bold"
                    : "text-ink-2 hover:text-ink hover:bg-paper-2"
                }`}
              >
                {dict.navWorkbench.jobs}
              </Link>
              <Link
                to="/profile"
                className={`flex-interactive-row px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[40px] ${
                  pathname.includes("/profile")
                    ? "bg-accent-subtle text-accent font-bold"
                    : "text-ink-2 hover:text-ink hover:bg-paper-2"
                }`}
              >
                {dict.navWorkbench.profile}
              </Link>
              <Link
                to="/copilot"
                className={`flex-interactive-row px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[40px] ${
                  pathname.includes("/copilot")
                    ? "bg-accent-subtle text-accent font-bold"
                    : "text-ink-2 hover:text-ink hover:bg-paper-2"
                }`}
              >
                {dict.navWorkbench.legalChat}
              </Link>
              <Link
                to="/recruit"
                className={`flex-interactive-row px-4 py-2 rounded-lg text-sm font-semibold transition-all min-h-[40px] ${
                  pathname.includes("/recruit")
                    ? "bg-accent-subtle text-accent font-bold"
                    : "text-ink-2 hover:text-ink hover:bg-paper-2"
                }`}
              >
                Recruiter Hub
              </Link>
            </>
          )}
        </nav>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Candidate Ledger chip (when not on landing or for quick status) */}
          {!isLanding && (
            <Link
              to="/jobs"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rule bg-paper-2 hover:border-accent hover:bg-paper-3 text-ink-2 font-mono text-xs transition-colors"
              title="View your statutory submission ledger"
            >
              <span>
                {dict.ledger.applied}:{" "}
                <strong className="text-emerald font-bold">{appliedJobs.length}</strong>
              </span>
              <span className="text-rule-2">·</span>
              <span>
                {dict.ledger.saved}:{" "}
                <strong className="text-ink font-bold">{savedJobs.length}</strong>
              </span>
              <span className="text-[10px] font-bold pl-1 border-l text-accent border-rule">
                {dict.ledger.inspect} ↗
              </span>
            </Link>
          )}

          {/* User Profile Chip */}
          {!isLanding && (
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-paper-2 transition-colors border border-transparent hover:border-rule"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-rule bg-paper-3 shrink-0">
                <img
                  src={profile.avatarUrl}
                  alt={profile.shortName}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-body text-xs font-bold text-ink">{profile.shortName}</span>
            </Link>
          )}

          {/* Theme Selector Popover */}
          <div className="relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-paper-2 border border-rule text-ink-2 hover:text-ink hover:bg-paper-3 transition-colors cursor-pointer"
              title="Switch Color Theme"
              aria-label="Color theme switcher"
            >
              <Palette className="w-4 h-4" />
            </button>
            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-paper border border-rule shadow-xl p-2 z-50 flex flex-col gap-1 font-body text-xs">
                <div className="px-2 py-1 font-mono text-[10px] uppercase font-bold text-ink-3 border-b border-rule/50 mb-1">
                  Themes (6)
                </div>
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setThemeMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      theme === t.id
                        ? "bg-accent text-accent-ink font-bold"
                        : "text-ink hover:bg-paper-2"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-rule shadow-inner shrink-0"
                        style={{ backgroundColor: t.preview }}
                      />
                      <span>{t.label}</span>
                    </span>
                    {theme === t.id && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLocale(locale === "vn" ? "en" : "vn")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-paper-2 border border-rule hover:border-ink text-ink font-mono text-xs font-bold transition-all cursor-pointer"
            title="Switch Language (VN / EN)"
          >
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span>{locale.toUpperCase()}</span>
          </button>

          {/* Action buttons on Landing */}
          {isLanding ? (
            <>
              <Link
                to="/login"
                className="hidden sm:flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold text-ink-2 hover:text-ink hover:bg-paper-2 transition-all min-h-[40px] cursor-pointer"
              >
                {dict.nav.logIn}
              </Link>
              <Link
                to="/jobs"
                className="hidden sm:flex flex-interactive-row px-4 py-2 rounded-full border border-rule bg-paper text-ink text-sm font-semibold hover:border-ink hover:bg-paper-2 transition-all min-h-[40px] shadow-2xs cursor-pointer"
              >
                {dict.nav.findJob}
              </Link>
              <Link
                to="/recruit"
                className="flex-interactive-row gap-1.5 px-4.5 py-2 rounded-full bg-ink text-paper text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm min-h-[40px] cursor-pointer"
              >
                {dict.nav.startHiring}
              </Link>
            </>
          ) : (
            <Link
              to="/compliance"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-2 border border-rule hover:border-ink text-ink-2 hover:text-ink font-mono text-xs font-semibold transition-colors"
              title="Open Admin Compliance Console"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald" />
              <span>Admin Console</span>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-paper-2 border border-rule text-ink hover:bg-paper-3 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-rule bg-paper px-4 py-6 flex flex-col gap-3 shadow-xl">
          <Link
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-ink hover:bg-paper-2"
          >
            {dict.navWorkbench.jobs}
          </Link>
          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-ink hover:bg-paper-2"
          >
            {dict.navWorkbench.profile}
          </Link>
          <Link
            to="/copilot"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-ink hover:bg-paper-2"
          >
            {dict.navWorkbench.legalChat}
          </Link>
          <Link
            to="/recruit"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-ink hover:bg-paper-2"
          >
            Recruiter Hub (Sourcing & Pipeline)
          </Link>
          <Link
            to="/compliance"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-ink hover:bg-paper-2 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald" />
            <span>Admin Console</span>
          </Link>
          <div className="pt-3 border-t border-rule flex items-center justify-between">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-accent"
            >
              {dict.nav.logIn} →
            </Link>
            <span className="font-mono text-xs text-ink-3">Bộ luật Lao động 2019</span>
          </div>
        </div>
      )}
    </header>
  );
}
