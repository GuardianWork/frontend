import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { logoutAccount } from "@/services/auth";

export function LogoutButton() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    const revocation = logoutAccount();
    void revocation.catch(() => {});
    try {
      await navigate({ to: "/login", search: { role: "candidate" }, replace: true });
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      aria-label="Đăng xuất"
      disabled={loading}
      onClick={handleLogout}
      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-warm-border bg-paper-white px-2.5 py-2 text-xs font-semibold text-charcoal-83 transition-colors hover:bg-surface-container hover:text-charcoal-text disabled:opacity-50"
    >
      <LogOut size={17} />
      <span className="hidden sm:inline">{loading ? "Đang đăng xuất…" : "Đăng xuất"}</span>
    </button>
  );
}
