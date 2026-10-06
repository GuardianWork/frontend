import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance Queue — GuardianWork Admin" },
      {
        name: "description",
        content:
          "Review AI-flagged job descriptions for potential risk clauses under Labor Code 2019.",
      },
    ],
  }),
  component: CompliancePage,
});

type Item = {
  title: string;
  company: string;
  badge: "Critical" | "Warning" | "Review";
  time: string;
  reason: string;
  reasonIcon: string;
  active?: boolean;
};

const ITEMS: Item[] = [
  {
    title: "Senior Rust Engineer",
    company: "Acme Corp • San Francisco, CA (Vietnam Hub)",
    badge: "Critical",
    time: "Flagged 2h ago",
    reason: "Non-compete clause (Điều 35)",
    reasonIcon: "policy",
    active: true,
  },
  {
    title: "Marketing Director",
    company: "Global Reach Ltd • TP. Hồ Chí Minh",
    badge: "Warning",
    time: "Flagged 5h ago",
    reason: "Age discrimination risk",
    reasonIcon: "gavel",
  },
  {
    title: "Warehouse Associate",
    company: "LogisTech Inc • Bình Dương",
    badge: "Review",
    time: "Flagged 1d ago",
    reason: "Physical requirement phrasing",
    reasonIcon: "accessibility_new",
  },
];

function badgeClass(b: Item["badge"]) {
  if (b === "Critical") return "text-error bg-error-container";
  if (b === "Warning") return "text-secondary bg-secondary-container";
  return "text-on-primary bg-primary-container";
}

function CompliancePage() {
  return (
    <AdminShell title="Compliance Queue" role="admin">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-charcoal-text mb-2 tracking-tight">
          Compliance Queue
        </h2>
        <p className="text-base text-charcoal-83 max-w-2xl">
          Review AI-flagged job descriptions for potential risk clauses. Rà soát tự động theo Bộ
          luật Lao động 2019 và chuẩn mực quốc tế.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-paper-white p-3 rounded-xl border border-warm-border">
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-error-container text-on-error-container text-xs font-semibold rounded-full">
                High Risk (3)
              </span>
              <span className="px-3 py-1 bg-surface-container text-charcoal-text text-xs font-semibold rounded-full">
                Pending (12)
              </span>
            </div>
            <button className="text-charcoal-83 hover:text-charcoal-text flex items-center gap-1 text-sm font-medium">
              <Icon name="filter_list" className="!text-base" /> Filter
            </button>
          </div>

          {ITEMS.map((it) => (
            <div
              key={it.title}
              className={
                it.active
                  ? "bg-paper-white p-5 rounded-xl border-l-4 border-l-error border border-warm-border shadow-sm cursor-pointer"
                  : "bg-paper-white p-5 rounded-xl border border-warm-border hover:shadow-sm transition-shadow cursor-pointer opacity-80 hover:opacity-100"
              }
            >
              <div className="flex justify-between items-start mb-2 gap-3">
                <h3 className="font-semibold text-lg leading-tight text-charcoal-text">
                  {it.title}
                </h3>
                <span
                  className={`font-semibold text-[10px] uppercase tracking-wider px-2 py-1 rounded ${badgeClass(it.badge)}`}
                >
                  {it.badge}
                </span>
              </div>
              <p className="text-sm text-charcoal-83 mb-4">{it.company}</p>
              <div className="flex items-center gap-2 text-xs text-charcoal-40">
                <Icon name="schedule" className="!text-[14px]" /> {it.time}
                <span className="mx-1">•</span>
                <Icon name={it.reasonIcon} className="!text-[14px]" /> {it.reason}
              </div>
            </div>
          ))}
        </div>

        {/* Review pane */}
        <div className="lg:col-span-7">
          <div className="bg-paper-white rounded-xl border border-warm-border shadow-sm h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-warm-border flex justify-between items-center gap-3">
              <div>
                <h3 className="text-lg font-semibold text-charcoal-text">
                  Review: Senior Rust Engineer
                </h3>
                <p className="text-sm text-charcoal-83 mt-1">Acme Corp ID: #JD-9921</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-charcoal-83 text-sm font-medium rounded-lg hover:bg-surface-container transition-colors">
                  Ignore
                </button>
                <button className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:opacity-90 transition-all">
                  Apply Fixes
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              <div className="mb-10">
                <h4 className="font-semibold text-sm text-charcoal-40 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Icon name="description" className="!text-[18px]" />
                  Flagged Section
                </h4>
                <p className="leading-relaxed text-charcoal-text text-lg">
                  ...We are looking for a rockstar engineer to join our fast-paced team.{" "}
                  <span className="bg-error-container/60 text-error font-medium px-1 border-b border-error">
                    The candidate must agree to a 24-month non-compete clause preventing employment
                    at any competing software firm globally following termination.
                  </span>{" "}
                  Additionally, candidates should be digital natives...
                </p>
              </div>

              <div className="bg-parchment-bg border border-warm-border border-l-4 border-l-primary p-5 rounded-lg mb-10 flex gap-4">
                <Icon name="smart_toy" className="text-primary mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-charcoal-text mb-1">
                    AI Compliance Note
                  </h5>
                  <p className="text-sm text-charcoal-83 leading-snug mb-2">
                    Overly broad non-compete clauses violate Vietnam Labor Code 2019 (Điều 35 quyền
                    tự do việc làm) and international FTC guidelines. Recommend narrowing scope to
                    specific trade secret protections.
                  </p>
                  <button className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                    View Legal Guideline <Icon name="open_in_new" className="!text-[14px]" />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-charcoal-40 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Icon name="auto_fix_high" className="!text-[18px] text-primary" />
                  Suggested Revision
                </h4>
                <div className="bg-parchment-bg rounded-lg p-6 border border-warm-border">
                  <p className="leading-relaxed text-charcoal-text text-lg">
                    ...We are looking for a highly skilled engineer to join our fast-paced team.{" "}
                    <span className="bg-secondary-container/60 text-charcoal-text font-medium px-1 border-b border-secondary">
                      The candidate must agree to protect company trade secrets and proprietary
                      algorithms as outlined in our standard confidentiality agreement.
                    </span>{" "}
                    Additionally, candidates should have deep technical expertise...
                  </p>
                  <div className="mt-4 flex justify-end">
                    <button className="text-xs font-medium text-charcoal-83 flex items-center gap-1 hover:text-charcoal-text transition-colors">
                      <Icon name="content_copy" className="!text-base" /> Copy to clipboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
