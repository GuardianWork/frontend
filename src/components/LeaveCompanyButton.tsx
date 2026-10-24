import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { clearAuthSession, loadCurrentUser } from "@/services/auth";
import { leaveCompany, leaveCompanyError } from "@/services/companyMembership";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function LeaveCompanyButton({ companyName }: { companyName: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  async function confirmLeave() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      await leaveCompany();
    } catch (cause) {
      setError(leaveCompanyError(cause));
      busy.current = false;
      setPending(false);
      return;
    }
    // The membership has ended even if the subsequent identity refresh fails.
    // Clear stale credentials in that case so the old company is never retained.
    try {
      await loadCurrentUser();
    } catch {
      clearAuthSession();
    }
    await navigate({ to: "/vn", replace: true });
  }
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
      >
        <LogOut size={18} aria-hidden="true" /> Rời công ty
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy.current) setOpen(value);
        }}
      >
        <DialogContent className="sm:max-w-md" aria-busy={pending}>
          <DialogHeader>
            <DialogTitle>Rời công ty?</DialogTitle>
            <DialogDescription className="break-words">
              Bạn sẽ mất quyền truy cập không gian tuyển dụng của {companyName}. Để tham gia lại,
              bạn cần lời mời mới từ chủ sở hữu.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm leading-6 text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-lg border border-warm-border px-4 text-sm disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void confirmLeave()}
              className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
            >
              {pending ? "Đang rời công ty…" : "Xác nhận rời công ty"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
