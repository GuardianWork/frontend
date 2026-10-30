import * as React from "react";
import { createRoot } from "react-dom/client";
import * as icons from "@/components/icons";

const names = [
  "JobIcon",
  "ApplicationIcon",
  "TalentSearchIcon",
  "CompanyMembersIcon",
  "VerificationDossierIcon",
  "SubmissionHistoryIcon",
  "PendingIcon",
  "RefreshIcon",
  "CheckIcon",
  "VerifiedIcon",
  "RejectedIcon",
  "CloseIcon",
  "EvidenceIcon",
  "UnavailableEvidenceIcon",
  "SearchIcon",
  "LocationIcon",
  "DownloadIcon",
  "VisibleIcon",
] as const;

export function mountIconReview() {
  const host = document.createElement("main");
  host.id = "icon-review";
  host.style.cssText =
    "box-sizing:border-box;width:100%;max-width:900px;margin:auto;padding:24px;background:white;color:#172D49;font-family:sans-serif";
  document.body.replaceChildren(host);
  createRoot(host).render(
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>GuardianWork · 15 / 16 / 20 / 24 px</h1>
      {names.map((name) => {
        const Icon = icons[name];
        return (
          <div
            id={`icon-${name}`}
            key={name}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(140px, 1fr) repeat(4, 32px)",
              alignItems: "center",
              gap: 8,
              padding: 8,
              borderBottom: "1px solid #DDE5EF",
            }}
          >
            <span style={{ fontSize: 12 }}>{name}</span>
            {[15, 16, 20, 24].map((size) => (
              <Icon key={size} size={size} />
            ))}
          </div>
        );
      })}
    </div>,
  );
}
