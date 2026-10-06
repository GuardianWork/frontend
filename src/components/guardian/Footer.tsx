import React from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { dict } = useLanguage();

  return (
    <footer aria-label="Site footer" className="landing-footer bg-paper-2 border-t border-rule">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="landing-footer__top flex flex-col md:flex-row justify-between items-start gap-8 pb-12 border-b border-rule">
          <div>
            <p className="footer-ft5__statement font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink leading-tight">
              {dict.footer.statement1}
              <br />
              <em className="font-normal italic text-accent">{dict.footer.statement2}</em>
            </p>
          </div>
          <div className="landing-footer__cta-col shrink-0 flex flex-col items-start md:items-end">
            <Link
              to="/jobs"
              className="landing-footer__cta-btn inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-accent text-accent-ink font-bold text-sm shadow-md hover:bg-accent-hover active:scale-[0.98] transition-all"
            >
              {dict.footer.findJobs} →
            </Link>
            <p className="font-mono text-xs text-ink-3 mt-2.5">{dict.footer.noSignUp}</p>
          </div>
        </div>

        <div className="landing-footer__bottom pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <nav aria-label="Footer links" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              to="/jobs"
              className="footer-ft5__meta text-ink-3 hover:text-ink transition-colors"
            >
              {dict.footer.browseRoles}
            </Link>
            <Link
              to="/recruit"
              className="footer-ft5__meta text-ink-3 hover:text-ink transition-colors"
            >
              {dict.footer.forEmployers}
            </Link>
            <a
              href="#how-it-works"
              className="footer-ft5__meta text-ink-3 hover:text-ink transition-colors"
            >
              {dict.footer.howItWorks}
            </a>
            <Link
              to="/copilot"
              className="footer-ft5__meta text-ink-3 hover:text-ink transition-colors"
            >
              AI Legal Copilot
            </Link>
            <Link
              to="/compliance"
              className="footer-ft5__meta text-ink-3 hover:text-ink transition-colors"
            >
              Admin Console
            </Link>
          </nav>
          <p className="footer-ft5__meta text-ink-3 font-mono">{dict.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
