import { LogoutIcon } from "@/components/icons";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { IS_STAFF_PORTAL } from "@/lib/portal";
import { logoutAccount } from "@/services/auth";
import { useLanguage } from "@/context/LanguageContext";
import { candidateWorkspaceCopy } from "@/lib/candidateWorkspace";

export function LogoutButton() {
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const copy = candidateWorkspaceCopy[locale].chrome;
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    const revocation = logoutAccount();
    void revocation.catch(() => {});
    try {
      await navigate({
        to: "/login",
        search: IS_STAFF_PORTAL ? {} : { role: "candidate" },
        replace: true,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      aria-label={copy.logout}
      disabled={loading}
      onClick={handleLogout}
      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-warm-border bg-paper-white px-2.5 py-2 text-xs font-semibold text-charcoal-83 transition-colors hover:bg-surface-container hover:text-charcoal-text disabled:opacity-50"
    >
      <LogoutIcon size={17} />
      <span className="hidden sm:inline">{loading ? copy.loggingOut : copy.logout}</span>
    </button>
  );
}
