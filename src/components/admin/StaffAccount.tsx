import { ChevronDown, UserRound } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import "./staff.css";

export function StaffAccount({ summary = false }: { summary?: boolean }) {
  const user = useAuthUser();
  if (!user) return null;
  const name =
    [user.lastName, user.firstName].filter(Boolean).join(" ") || user.username || user.email;
  const fields = (
    <dl className="staff-account-fields">
      <div>
        <dt>Tên đăng nhập</dt>
        <dd>{user.username || "—"}</dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd>{user.email}</dd>
      </div>
      <div>
        <dt>Mã tài khoản</dt>
        <dd>#{user.id}</dd>
      </div>
      <div>
        <dt>Vai trò</dt>
        <dd>Platform staff</dd>
      </div>
    </dl>
  );
  if (summary)
    return (
      <section className="staff-account-summary" aria-label="Thông tin staff đang đăng nhập">
        <div className="staff-account-heading">
          <span className="staff-account-avatar" aria-hidden="true">
            <UserRound size={22} />
          </span>
          <div>
            <h2>{name}</h2>
            <p>Tài khoản đang đăng nhập</p>
          </div>
        </div>
        {fields}
      </section>
    );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="staff-account-trigger"
          aria-label={`Thông tin tài khoản ${name}`}
        >
          <span className="staff-account-avatar" aria-hidden="true">
            <UserRound size={19} />
          </span>
          <span className="staff-account-trigger-text">
            <strong>{name}</strong>
            <span>{user.email}</span>
          </span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="staff-account-popover"
        aria-label="Thông tin tài khoản"
      >
        <h2>{name}</h2>
        {fields}
      </PopoverContent>
    </Popover>
  );
}
