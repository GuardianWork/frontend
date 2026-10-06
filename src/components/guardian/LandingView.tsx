import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLanguage } from "@/context/LanguageContext";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FileUp, CheckCircle, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export function LandingView() {
  const { dict } = useLanguage();
  const navigate = useNavigate();
  const [uploadedCv, setUploadedCv] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSimulateCv = (fileName: string) => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadedCv(fileName);
    }, 600);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        setUploadedCv(file.name);
      }, 700);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink transition-colors selection:bg-accent selection:text-accent-ink">
      <Header variant="landing" />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section
          aria-label="Hero marquee and dual-path cards"
          className="relative min-h-[90vh] pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-paper"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at 50% 20%, var(--color-paper-3) 0%, transparent 60%)",
            }}
            aria-hidden="true"
          />

          {/* Headline */}
          <div className="relative z-10 max-w-4xl mx-auto text-center pt-8 sm:pt-14 pb-12 sm:pb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-2 border border-rule font-mono text-xs font-semibold text-ink-2 mb-6 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span>Bộ luật Lao động 2019 · AI Compliance Shield</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-ink leading-[1.08] mb-6">
              {dict.landing.title}
              <br />
              <em className="font-normal italic text-accent">{dict.landing.titleAccent}</em>
            </h1>
            <p className="font-body text-base sm:text-lg md:text-xl text-ink-2 max-w-4xl mx-auto leading-relaxed">
              {dict.landing.description}
            </p>
          </div>

          {/* Dual-Path Cards */}
          <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Card Left: For Companies (Dark Ink Style) */}
            <div className="bg-ink text-paper rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between border border-rule/20 shadow-2xl relative overflow-hidden group">
              <div
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none"
                aria-hidden="true"
              />
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-accent font-bold mb-3">
                  {dict.landing.forCompanies}
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  <span className="text-paper">{dict.landing.findNextHire}</span>
                  <em className="italic font-normal text-accent">
                    {dict.landing.findNextHireAccent}
                  </em>
                </h2>
                <p className="font-body text-sm sm:text-base text-paper/80 leading-relaxed mb-6 max-w-md">
                  {dict.landing.companiesDesc}
                </p>
                <Link
                  to="/recruit"
                  className="btn whitespace-nowrap !h-9 !gap-1.5 !px-4 !text-xs font-bold inline-flex items-center mt-2 shadow-md cursor-pointer"
                >
                  <span>{dict.landing.startHiring}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Reach Agent Live Simulation */}
              <div className="mt-10 rounded-2xl bg-paper/10 border border-paper/15 p-4 text-paper/95 backdrop-blur-xs shadow-inner">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-accent mb-3 pb-2 border-b border-paper/10">
                  <span>Reach Agent · Đang hoạt động</span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                    Hoạt động
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-paper/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-emerald/20 text-emerald flex items-center justify-center font-bold text-xs shrink-0">
                        PS
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="font-bold truncate text-paper">Priya Shah</div>
                        <div className="text-[10px] text-paper/60 truncate">
                          Sr DevOps @ Notion · 7 YOE
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald/20 text-emerald font-bold shrink-0">
                      ĐÃ PHẢN HỒI
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-paper/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                        MB
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="font-bold truncate text-paper">Marcus Bennett</div>
                        <div className="text-[10px] text-paper/60 truncate">
                          Staff @ Stripe · 9 YOE
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-paper/15 text-paper/80 font-bold shrink-0">
                      ĐÃ GỬI PITCH
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Right: For Candidates (Paper-2 Style) */}
            <div className="bg-paper-2 text-ink rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between border border-rule shadow-md relative overflow-hidden group hover:border-rule-2 transition-all">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-accent font-bold mb-3">
                  {dict.landing.forCandidates}
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  <span className="text-ink">{dict.landing.findNextJob}</span>
                  <em className="italic font-normal text-accent">
                    {dict.landing.findNextJobAccent}
                  </em>
                </h2>
                <p className="font-body text-sm sm:text-base text-ink-2 leading-relaxed mb-6 max-w-md">
                  {dict.landing.candidatesDesc}
                </p>
                <Link
                  to="/jobs"
                  className="btn whitespace-nowrap !h-9 !gap-1.5 !px-4 !text-xs font-bold inline-flex items-center mt-2 shadow-md cursor-pointer"
                >
                  <span>{dict.landing.exploreJobs}</span>
                  <span aria-hidden="true">→</span>
                </Link>

                {/* CV Dropzone & Sample Files */}
                <div className="relative mt-6 rounded-2xl border-2 border-dashed p-3.5 transition-all border-rule bg-paper hover:border-ink hover:bg-paper-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-paper-2 border border-rule flex items-center justify-center shrink-0 font-mono text-sm">
                        📄
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-ink truncate">
                          {uploadedCv ? (
                            <span className="text-emerald flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> {uploadedCv} (Đã trích xuất!)
                            </span>
                          ) : (
                            dict.landing.dropCvTitle
                          )}
                        </div>
                        <div className="text-[10px] text-ink-3 font-mono">
                          {uploading ? "AI đang phân tích..." : dict.landing.noSignUp}
                        </div>
                      </div>
                    </div>
                    <label
                      htmlFor="diptych-cv-input"
                      className="px-3 py-1.5 rounded-full border border-ink bg-paper text-ink font-mono text-[11px] font-bold uppercase tracking-wider cursor-pointer hover:bg-paper-2 shrink-0 transition-colors"
                    >
                      {dict.landing.uploadBtn}
                    </label>
                    <input
                      id="diptych-cv-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileInput}
                      className="sr-only"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-rule/50">
                    <span className="font-mono text-[10px] text-ink-3 font-semibold uppercase">
                      {dict.landing.sampleCv}:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSimulateCv("Senior_DevOps.pdf")}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-paper border border-rule hover:border-ink text-ink-2 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span className="text-accent font-bold">⚡</span>
                      <span>Senior_DevOps.pdf</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateCv("Fullstack_Lead.docx")}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-paper border border-rule hover:border-ink text-ink-2 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span className="text-accent font-bold">⚡</span>
                      <span>Fullstack_Lead.docx</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Matched Feed */}
              <div className="mt-8 rounded-2xl bg-paper border border-rule p-4 shadow-sm text-ink">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-ink-3 mb-3 pb-2 border-b border-rule">
                  <span>{dict.landing.matchedFeed}</span>
                  <span className="text-accent font-bold">2 {dict.landing.newJobs}</span>
                </div>
                <div className="flex flex-col gap-2 font-mono text-xs">
                  <Link
                    to="/jobs"
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-paper-2 hover:bg-paper-3 transition-colors cursor-pointer border border-transparent hover:border-rule"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded bg-emerald text-white font-black text-[10px] flex items-center justify-center shrink-0">
                        CH
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="font-bold text-ink truncate">Senior Backend Engineer</div>
                        <div className="text-[10px] text-ink-3 truncate">
                          Chime · Remote · $3,500–$4,800/mo
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-accent/20 text-accent font-bold shrink-0">
                      MỚI
                    </span>
                  </Link>

                  <Link
                    to="/jobs"
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-paper-2 hover:bg-paper-3 transition-colors cursor-pointer border border-transparent hover:border-rule"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded bg-accent text-accent-ink font-black text-[10px] flex items-center justify-center shrink-0">
                        LV
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="font-bold text-ink truncate">Founding Product Engineer</div>
                        <div className="text-[10px] text-ink-3 truncate">
                          Lovable · HCMC · $2,800–$4,000/mo
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald/20 text-emerald font-bold shrink-0">
                      ĐÃ XÁC MINH
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Role Browser */}
        <section
          id="roles"
          aria-label="Browse IT roles"
          className="role-browser-section border-t border-rule"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="role-browser__head">
              <h2 className="role-browser__title">
                {dict.roleBrowser.title.split("\n")[0]}
                <br />
                {dict.roleBrowser.title.split("\n")[1] || "một trung tâm xác thực."}
              </h2>
              <p className="role-browser__desc">{dict.roleBrowser.desc}</p>
            </div>

            <div className="role-browser__grid" role="list">
              {/* Backend - Large */}
              <Link
                to="/jobs"
                className="role-browser__cell role-browser__cell--large group cursor-pointer"
                role="listitem"
              >
                <div className="role-browser__cell-count">
                  2,840 {dict.roleBrowser.backendCount.replace("{count}", "").trim()}
                </div>
                <div className="role-browser__cell-label">{dict.roleBrowser.backend}</div>
                <div className="role-browser__tags">
                  <span className="role-browser__tag">Node.js</span>
                  <span className="role-browser__tag">Java</span>
                  <span className="role-browser__tag">Go</span>
                  <span className="role-browser__tag">Python</span>
                </div>
                <div className="role-browser__arrow" aria-hidden="true">
                  →
                </div>
              </Link>

              {/* Frontend - Small */}
              <Link
                to="/jobs"
                className="role-browser__cell role-browser__cell--small group cursor-pointer"
                role="listitem"
              >
                <div className="role-browser__cell-count">
                  1,920 {dict.roleBrowser.frontendCount.replace("{count}", "").trim()}
                </div>
                <div className="role-browser__cell-label">{dict.roleBrowser.frontend}</div>
                <div className="role-browser__tags">
                  <span className="role-browser__tag">React</span>
                  <span className="role-browser__tag">Vue</span>
                  <span className="role-browser__tag">TypeScript</span>
                </div>
                <div className="role-browser__arrow" aria-hidden="true">
                  →
                </div>
              </Link>

              {/* Mobile - Small */}
              <Link
                to="/jobs"
                className="role-browser__cell role-browser__cell--small group cursor-pointer"
                role="listitem"
              >
                <div className="role-browser__cell-count">
                  980 {dict.roleBrowser.mobileCount.replace("{count}", "").trim()}
                </div>
                <div className="role-browser__cell-label">{dict.roleBrowser.mobile}</div>
                <div className="role-browser__tags">
                  <span className="role-browser__tag">iOS</span>
                  <span className="role-browser__tag">Android</span>
                  <span className="role-browser__tag">Flutter</span>
                </div>
                <div className="role-browser__arrow" aria-hidden="true">
                  →
                </div>
              </Link>

              {/* DevOps - Medium (Accent) */}
              <Link
                to="/jobs"
                className="role-browser__cell role-browser__cell--medium role-browser__cell--accent group cursor-pointer"
                role="listitem"
              >
                <div className="role-browser__cell-count role-browser__cell-count--light">
                  1,340 {dict.roleBrowser.devopsCount.replace("{count}", "").trim()}
                </div>
                <div className="role-browser__cell-label role-browser__cell-label--light">
                  {dict.roleBrowser.devops}
                </div>
                <div className="role-browser__tags">
                  <span className="role-browser__tag role-browser__tag--light">AWS</span>
                  <span className="role-browser__tag role-browser__tag--light">Kubernetes</span>
                  <span className="role-browser__tag role-browser__tag--light">Terraform</span>
                </div>
                <div className="role-browser__arrow" aria-hidden="true">
                  →
                </div>
              </Link>

              {/* Data & ML - Medium */}
              <Link
                to="/jobs"
                className="role-browser__cell role-browser__cell--medium group cursor-pointer"
                role="listitem"
              >
                <div className="role-browser__cell-count">
                  1,100 {dict.roleBrowser.dataMlCount.replace("{count}", "").trim()}
                </div>
                <div className="role-browser__cell-label">{dict.roleBrowser.dataMl}</div>
                <div className="role-browser__tags">
                  <span className="role-browser__tag">PyTorch</span>
                  <span className="role-browser__tag">Spark</span>
                  <span className="role-browser__tag">dbt</span>
                </div>
                <div className="role-browser__arrow" aria-hidden="true">
                  →
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section
          id="how-it-works"
          aria-label="How GuardianWork works"
          className="how-it-works-section"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="how-it-works__title">{dict.howItWorks.title}</h2>
            <div className="how-it-works__steps" role="list">
              {/* Step 1 */}
              <div className="how-it-works__step how-it-works__step--bordered" role="listitem">
                <span className="how-it-works__step-num" aria-hidden="true">
                  01
                </span>
                <div className="how-it-works__step-content">
                  <h3 className="how-it-works__step-title">{dict.howItWorks.step1Title}</h3>
                  <p className="how-it-works__step-body">{dict.howItWorks.step1Body}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="how-it-works__step how-it-works__step--bordered" role="listitem">
                <span className="how-it-works__step-num" aria-hidden="true">
                  02
                </span>
                <div className="how-it-works__step-content">
                  <h3 className="how-it-works__step-title">{dict.howItWorks.step2Title}</h3>
                  <p className="how-it-works__step-body">{dict.howItWorks.step2Body}</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="how-it-works__step" role="listitem">
                <span className="how-it-works__step-num" aria-hidden="true">
                  03
                </span>
                <div className="how-it-works__step-content">
                  <h3 className="how-it-works__step-title">{dict.howItWorks.step3Title}</h3>
                  <p className="how-it-works__step-body">{dict.howItWorks.step3Body}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
