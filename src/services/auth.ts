export type AccountPurpose = "candidate" | "recruiter";

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
}

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export function parseAccountPurpose(search: Record<string, unknown>): { role?: AccountPurpose } {
  return { role: search.role === "recruiter" ? "recruiter" : "candidate" };
}

async function authRequest(path: string, body: object): Promise<unknown> {
  const baseUrl = (import.meta.env?.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Không thể kết nối dịch vụ tài khoản. Vui lòng thử lại sau.");
  }
  if (response.status === 401)
    throw new Error("Email, tên đăng nhập hoặc mật khẩu không chính xác.");
  if (response.status === 409) throw new Error("Email hoặc tên đăng nhập đã được sử dụng.");
  if (response.status === 403)
    throw new Error("Tài khoản chưa được phép đăng nhập. Vui lòng liên hệ bộ phận hỗ trợ.");
  if (response.status === 400)
    throw new Error("Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.");
  if (!response.ok) throw new Error("Dịch vụ tài khoản hiện chưa sẵn sàng. Vui lòng thử lại sau.");
  try {
    const result = await response.json();
    if (!result || typeof result !== "object" || !result.data) throw new Error();
    return result.data;
  } catch {
    throw new Error("Phản hồi từ dịch vụ tài khoản không hợp lệ. Vui lòng thử lại sau.");
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<AuthUser>;
  return (
    typeof user.id === "number" && typeof user.email === "string" && typeof user.role === "string"
  );
}

export async function registerAccount(input: RegistrationInput): Promise<AuthUser> {
  const result = await authRequest("register", {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  if (!isAuthUser(result)) throw new Error("Phản hồi đăng ký không hợp lệ. Vui lòng thử lại sau.");
  return result;
}

export async function loginAccount(
  usernameOrEmail: string,
  password: string,
): Promise<AuthSession> {
  const result = await authRequest("login", { usernameOrEmail: usernameOrEmail.trim(), password });
  const session = result as Partial<AuthSession> | null;
  if (
    !session ||
    typeof session.accessToken !== "string" ||
    !session.accessToken ||
    typeof session.refreshToken !== "string" ||
    !session.refreshToken ||
    !isAuthUser(session.user)
  ) {
    throw new Error("Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại sau.");
  }
  return session as AuthSession;
}

export function getLoginDestination(user: AuthUser, purpose: AccountPurpose) {
  if (user.role === "ADMIN") return "/admin" as const;
  return purpose === "recruiter" ? ("/recruiter" as const) : ("/candidate/jobs" as const);
}

export const AUTH_SESSION_KEY = "guardianwork_auth_session";

export function saveAuthSession(session: AuthSession): void {
  try {
    sessionStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ ...session, expiresAt: Date.now() + session.expiresIn * 1000 }),
    );
  } catch {
    throw new Error(
      "Không thể lưu phiên đăng nhập. Vui lòng cho phép trình duyệt lưu dữ liệu và thử lại.",
    );
  }
}

/** End the local session first; revocation must not delay returning to login. */
export async function logoutAccount(): Promise<void> {
  let session: Partial<AuthSession> | null = null;
  try {
    const stored = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (stored) session = JSON.parse(stored);
  } catch {
    // An unreadable session should still be removed.
  }
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  if (!session?.refreshToken) return;
  const baseUrl = (import.meta.env?.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
  try {
    await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      keepalive: true,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // The local session is already cleared when the API is unavailable.
  }
}
