import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { EmailVerificationPanel } from "@/components/auth/EmailVerification";
import { LeaveCompanyButton } from "@/components/LeaveCompanyButton";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAccountIdentity, useRefreshIdentity } from "@/hooks/useAccountIdentity";
import {
  updateAccount,
  accountError,
  changePassword,
  validNewPassword,
  type ClosureAction,
} from "@/services/accountControl";
import { ClosureDialog } from "@/components/account/ClosureDialog";
import "@/components/account/account.css";

export function AccountPage({ role = "candidate" }: { role?: "candidate" | "recruiter" }) {
  const user = useAuthUser();
  const account = useAccountIdentity();
  const refreshIdentity = useRefreshIdentity();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [notice, setNotice] = useState("");
  const [operation, setOperation] = useState<"identity" | "password" | null>(null);
  const lock = useRef(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeSection, setActiveSection] = useState("identity");
  const [closure, setClosure] = useState<ClosureAction | null>(null);
  useEffect(() => {
    if (account.data) {
      setFirstName(account.data.firstName);
      setLastName(account.data.lastName);
      setPhone(account.data.phoneNumber || "");
    }
  }, [account.data]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    setIdentityError("");
    setNotice("");
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      firstName.trim().length > 100 ||
      lastName.trim().length > 100
    ) {
      setIdentityError(
        "Họ và tên đều bắt buộc, mỗi trường tối đa 100 ký tự sau khi bỏ khoảng trắng ở hai đầu.",
      );
      return;
    }
    lock.current = true;
    setOperation("identity");
    try {
      const result = await updateAccount({
        firstName,
        lastName,
        phoneNumber: phone.trim() ? phone.trim() : null,
      });
      client.setQueryData(["account", user?.id], result);
      setNotice("Đã lưu thông tin chung cho tài khoản và hồ sơ ứng viên.");
      try {
        await refreshIdentity();
      } catch {
        setNotice(
          "Đã lưu thông tin. Chưa đồng bộ được danh tính mới; hãy tải lại tài khoản trước khi tiếp tục.",
        );
      }
    } catch (cause) {
      setIdentityError(accountError(cause, "identity"));
    } finally {
      lock.current = false;
      setOperation(null);
    }
  }
  async function password(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current || !account.data?.emailVerified) return;
    setPasswordError("");
    if (!validNewPassword(newPassword)) {
      setPasswordError("Mật khẩu mới cần 8–128 ký tự, có chữ hoa, chữ thường và chữ số.");
      return;
    }
    if (newPassword !== repeatPassword) {
      setPasswordError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    lock.current = true;
    setOperation("password");
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      client.clear();
      await navigate({ to: "/login", search: { notice: "password-changed" }, replace: true });
    } catch (cause) {
      setPasswordError(accountError(cause, "password"));
    } finally {
      lock.current = false;
      setOperation(null);
    }
  }
  if (user?.role !== "USER")
    return (
      <main className="account-page p-6">
        <h1>Cài đặt tài khoản</h1>
        <p>Tính năng này chỉ dành cho người dùng tại cổng công khai.</p>
      </main>
    );
  const data = account.data;
  const membership = user.activeMembership;
  const blockers = data?.closureBlockers || [];
  return (
    <AdminShell title="Cài đặt tài khoản" role={role}>
      <div className="account-page">
        <div className="workspace-heading account-overview">
          <div>
            <h1>
              <ShieldCheck size={26} aria-hidden="true" /> Cài đặt tài khoản
            </h1>
            <p>Thông tin và bảo mật dùng chung cho tìm việc và tuyển dụng.</p>
          </div>
        </div>
        {account.isPending && <p role="status">Đang tải tài khoản…</p>}
        {account.isError && (
          <div className="account-section">
            <p role="alert" className="account-feedback account-error">
              {accountError(account.error)}
            </p>
            <button
              className="account-button account-button--quiet"
              onClick={() => void account.refetch()}
            >
              Tải lại tài khoản
            </button>
          </div>
        )}
        {data && (
          <div className="account-sections">
            <nav className="account-index" aria-label="Mục cài đặt">
              {[
                { id: "identity", label: "Thông tin cá nhân" },
                { id: "verification", label: "Xác minh email" },
                { id: "security", label: "Mật khẩu" },
                { id: "lifecycle", label: "Trạng thái tài khoản" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={activeSection === item.id ? "location" : undefined}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div>
              <section id="identity" className="account-section" aria-labelledby="identity-title">
                <h2 id="identity-title">Thông tin cá nhân</h2>
                <p>
                  Thay đổi họ, tên và số điện thoại tại đây cũng cập nhật thông tin chung trên hồ sơ
                  ứng viên.
                </p>
                <form onSubmit={save} className="account-form" aria-busy={operation === "identity"}>
                  <div className="account-fields">
                    {[
                      {
                        id: "account-last-name",
                        label: "Họ",
                        value: lastName,
                        change: setLastName,
                        auto: "family-name",
                      },
                      {
                        id: "account-first-name",
                        label: "Tên",
                        value: firstName,
                        change: setFirstName,
                        auto: "given-name",
                      },
                    ].map((field) => (
                      <div className="account-field" key={field.id}>
                        <label htmlFor={field.id}>
                          {field.label} <span aria-hidden="true">*</span>
                        </label>
                        <input
                          id={field.id}
                          value={field.value}
                          onChange={(e) => field.change(e.target.value)}
                          autoComplete={field.auto}
                          required
                          maxLength={100}
                          disabled={!!operation}
                          aria-describedby="identity-error"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="account-field">
                    <label htmlFor="account-phone">
                      Số điện thoại <span className="account-hint">(không bắt buộc)</span>
                    </label>
                    <input
                      id="account-phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!!operation}
                      aria-describedby="account-phone-hint identity-error"
                    />
                    <p id="account-phone-hint" className="account-hint">
                      Dùng số di động Việt Nam dạng 0… hoặc +84… Để trống và lưu để xóa số điện
                      thoại.
                    </p>
                  </div>
                  <div className="account-fields">
                    <div className="account-field">
                      <label htmlFor="account-username">Tên đăng nhập</label>
                      <input id="account-username" value={data.username} readOnly />
                    </div>
                    <div className="account-field">
                      <label htmlFor="account-email">Email đã đăng ký</label>
                      <input id="account-email" value={data.email} readOnly />
                    </div>
                  </div>
                  <p className="account-hint">
                    Tên đăng nhập và email được giữ cố định, không thể thay đổi.
                  </p>
                  {identityError && (
                    <p id="identity-error" role="alert" className="account-feedback account-error">
                      {identityError}
                    </p>
                  )}
                  {notice && (
                    <p role="status" className="account-feedback">
                      {notice}
                    </p>
                  )}
                  <div className="account-actions">
                    <button className="account-button" disabled={!!operation}>
                      {operation === "identity" ? "Đang lưu…" : "Lưu thông tin"}
                    </button>
                  </div>
                </form>
              </section>
              <section
                id="verification"
                className="account-section"
                aria-labelledby="verification-title"
              >
                <h2 id="verification-title">Xác minh email</h2>
                {data.emailVerified ? (
                  <p className="account-state account-state--verified">
                    <CheckCircle2 size={18} aria-hidden="true" /> Email {data.email} đã được xác
                    minh.
                  </p>
                ) : (
                  <>
                    <p className="account-state">
                      <Mail size={18} aria-hidden="true" /> Email chưa được xác minh
                    </p>
                    <EmailVerificationPanel purpose="account" />
                  </>
                )}
              </section>
              <section id="security" className="account-section" aria-labelledby="security-title">
                <h2 id="security-title">Đổi mật khẩu</h2>
                <p>
                  Sau khi đổi mật khẩu, mọi phiên đăng nhập sẽ kết thúc. Bạn cần đăng nhập lại bằng
                  mật khẩu mới.
                </p>
                {!data.emailVerified ? (
                  <p className="account-feedback">
                    Hãy{" "}
                    <a className="text-primary underline" href="#verification">
                      xác minh email đã đăng ký
                    </a>{" "}
                    trước khi đổi mật khẩu.
                  </p>
                ) : (
                  <form
                    className="account-form"
                    onSubmit={password}
                    aria-busy={operation === "password"}
                  >
                    <PasswordInput
                      id="account-current-password"
                      label="Mật khẩu hiện tại"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      autoComplete="current-password"
                      disabled={!!operation}
                    />
                    <PasswordInput
                      id="account-new-password"
                      label="Mật khẩu mới"
                      value={newPassword}
                      onChange={setNewPassword}
                      autoComplete="new-password"
                      disabled={!!operation}
                      hint="8–128 ký tự, có chữ hoa, chữ thường và chữ số."
                    />
                    <PasswordInput
                      id="account-repeat-password"
                      label="Xác nhận mật khẩu mới"
                      value={repeatPassword}
                      onChange={setRepeatPassword}
                      autoComplete="new-password"
                      disabled={!!operation}
                    />
                    {passwordError && (
                      <p role="alert" className="account-feedback account-error">
                        {passwordError}
                      </p>
                    )}
                    <div className="account-actions">
                      <button className="account-button" disabled={!!operation}>
                        {operation === "password" ? "Đang đổi mật khẩu…" : "Đổi mật khẩu"}
                      </button>
                    </div>
                  </form>
                )}
              </section>
              <section id="lifecycle" className="account-section" aria-labelledby="lifecycle-title">
                <h2 id="lifecycle-title">Trạng thái tài khoản</h2>
                <p>
                  Tạm ngừng truy cập hoặc gửi yêu cầu xóa. Mỗi thao tác cần mật khẩu hiện tại, mã
                  email riêng và xác nhận hậu quả.
                </p>
                {(!data.closureEligible || blockers.length > 0) && (
                  <div className="account-blockers" role="note">
                    <strong>Chưa thể đóng tài khoản</strong>
                    {blockers.includes("EMAIL_VERIFICATION_REQUIRED") && (
                      <p>
                        <a href="#verification">Xác minh email đã đăng ký</a> trước khi tiếp tục.
                      </p>
                    )}
                    {blockers.includes("COMPANY_OWNERSHIP_EXISTS") && (
                      <p>
                        Bạn đang sở hữu công ty nên chưa thể đóng tài khoản. Hiện chưa có quy trình
                        chuyển quyền sở hữu hoặc đóng công ty.
                      </p>
                    )}
                    {blockers.includes("ACTIVE_COMPANY_MEMBERSHIP_EXISTS") && (
                      <>
                        <p>
                          {membership?.companyRole === "RECRUITER"
                            ? "Bạn cần rời công ty trước khi đóng tài khoản. Việc rời công ty không tự động được hoàn tác khi kích hoạt lại tài khoản."
                            : membership?.companyRole === "OWNER"
                              ? "Chủ sở hữu không thể rời công ty để đóng tài khoản."
                              : "Bạn còn tư cách thành viên công ty. Vai trò hiện tại chưa có quy trình rời hoặc gỡ tư cách thành viên được hỗ trợ."}
                        </p>
                        {membership?.companyRole === "RECRUITER" && (
                          <LeaveCompanyButton companyName={membership.companyName} />
                        )}
                      </>
                    )}
                    {blockers.some(
                      (b) =>
                        ![
                          "EMAIL_VERIFICATION_REQUIRED",
                          "COMPANY_OWNERSHIP_EXISTS",
                          "ACTIVE_COMPANY_MEMBERSHIP_EXISTS",
                        ].includes(b),
                    ) && (
                      <p>Tài khoản có hạn chế khác. Hãy tải lại trạng thái hoặc liên hệ hỗ trợ.</p>
                    )}
                    <button
                      type="button"
                      disabled={account.isFetching}
                      className="account-button account-button--quiet"
                      onClick={() =>
                        void refreshIdentity().catch(() =>
                          setIdentityError("Chưa tải được trạng thái tài khoản. Hãy thử tải lại."),
                        )
                      }
                    >
                      Tải lại điều kiện tài khoản
                    </button>
                  </div>
                )}
                <div className="account-lifecycle-row">
                  <div>
                    <h3>Tạm ngừng tài khoản</h3>
                    <p>
                      Dừng truy cập ngay và ẩn hồ sơ ứng viên. Có thể yêu cầu kích hoạt lại nếu đủ
                      điều kiện.
                    </p>
                  </div>
                  <button
                    className="account-button account-button--quiet"
                    disabled={!!operation || !data.closureEligible || blockers.length > 0}
                    onClick={() => setClosure("deactivation")}
                  >
                    Tạm ngừng tài khoản
                  </button>
                </div>
                <div className="account-lifecycle-row">
                  <div>
                    <h3>Yêu cầu xóa tài khoản</h3>
                    <p>
                      Gửi yêu cầu đang chờ xử lý. Lịch sử vẫn được giữ lại và chưa có ngày xóa vĩnh
                      viễn được cam kết.
                    </p>
                  </div>
                  <button
                    className="account-button account-button--delete"
                    disabled={!!operation || !data.closureEligible || blockers.length > 0}
                    onClick={() => setClosure("deletion")}
                  >
                    Yêu cầu xóa tài khoản
                  </button>
                </div>
              </section>
              {membership && (
                <Link className="account-button account-button--quiet" to="/rec">
                  Về không gian tuyển dụng
                </Link>
              )}
            </div>
          </div>
        )}
        {closure && data && (
          <ClosureDialog
            action={closure}
            email={data.email}
            close={() => setClosure(null)}
            refresh={async () => {
              const result = await account.refetch();
              if (result.error) throw result.error;
              await refreshIdentity();
            }}
          />
        )}
      </div>
    </AdminShell>
  );
}
