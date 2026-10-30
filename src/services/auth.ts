import { ApiError, apiRequest, getApiBaseUrl } from "./api.ts";

export type AccountPurpose = "candidate" | "recruiter";
export interface ActiveMembership {
  companyId: number;
  companyName: string;
  companyRole: string;
  joinedAt: string;
}
export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  activeMembership?: ActiveMembership | null;
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
type StoredSession = AuthSession & { expiresAt: number };
export const AUTH_SESSION_KEY = "guardianwork_auth_session";
export const AUTH_SESSION_EVENT = "guardianwork-auth-session";

export interface AccountPurposeSearch {
  role?: AccountPurpose;
  /** Same-origin path to return to after signing in (e.g. a public job detail). */
  next?: string;
}

export function safeInternalPath(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/")) return undefined;
  if (value.startsWith("//") || value.includes("\\")) return undefined;
  return value.slice(0, 512);
}

export function parseAccountPurpose(search: Record<string, unknown>): AccountPurposeSearch {
  const next = safeInternalPath(search.next);
  return {
    role: search.role === "recruiter" ? "recruiter" : "candidate",
    ...(next ? { next } : {}),
  };
}
function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<AuthUser>;
  return (
    Number.isSafeInteger(user.id) && typeof user.email === "string" && typeof user.role === "string"
  );
}
function isAuthSession(value: unknown): value is AuthSession {
  const session = value as Partial<AuthSession> | null;
  return Boolean(
    session &&
    typeof session.accessToken === "string" &&
    session.accessToken &&
    typeof session.refreshToken === "string" &&
    session.refreshToken &&
    typeof session.expiresIn === "number" &&
    Number.isFinite(session.expiresIn) &&
    session.expiresIn > 0 &&
    session.tokenType === "Bearer" &&
    isAuthUser(session.user),
  );
}
function readSession(): StoredSession | null {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}
function emitSessionChange() {
  if (typeof window !== "undefined") window.dispatchEvent?.(new Event(AUTH_SESSION_EVENT));
}
function storeSession(session: StoredSession) {
  try {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch {
    throw new Error(
      "Không thể lưu phiên đăng nhập. Vui lòng cho phép trình duyệt lưu dữ liệu và thử lại.",
    );
  }
  emitSessionChange();
}
export function saveAuthSession(session: AuthSession): void {
  storeSession({ ...session, expiresAt: Date.now() + session.expiresIn * 1000 });
}
export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  emitSessionChange();
}
export function hasAuthSession() {
  const session = readSession();
  return Boolean(session?.accessToken && session?.refreshToken);
}
export function getCurrentUser(): AuthUser | null {
  const session = readSession();
  return session?.accessToken && session.expiresAt > Date.now() ? session.user : null;
}
export async function registerAccount(input: RegistrationInput): Promise<AuthUser> {
  let result: unknown;
  try {
    result = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        username: input.username.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409)
      throw new Error("Email hoặc tên đăng nhập đã được sử dụng.");
    throw error;
  }
  if (!isAuthUser(result)) throw new Error("Phản hồi đăng ký không hợp lệ. Vui lòng thử lại sau.");
  return result;
}
export async function loginAccount(
  usernameOrEmail: string,
  password: string,
): Promise<AuthSession> {
  let result: unknown;
  try {
    result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ usernameOrEmail: usernameOrEmail.trim(), password }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      throw new Error("Email, tên đăng nhập hoặc mật khẩu không chính xác.");
    if (error instanceof ApiError && error.status === 403)
      throw new Error("Tài khoản chưa được phép đăng nhập. Vui lòng liên hệ bộ phận hỗ trợ.");
    throw error;
  }
  if (!isAuthSession(result))
    throw new Error("Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại sau.");
  return result;
}
export function isStaffUser(user: Pick<AuthUser, "role"> | null | undefined): boolean {
  return user?.role === "STAFF";
}

export function getLoginDestination(user: AuthUser, purpose: AccountPurpose) {
  if (isStaffUser(user)) return "/staff" as const;
  if (user.role === "ADMIN") return "/admin" as const;
  return purpose === "recruiter"
    ? user.activeMembership
      ? ("/recruiter" as const)
      : ("/recruiter/verification" as const)
    : ("/jobs" as const);
}

let refreshing: { token: string; promise: Promise<AuthSession> } | null = null;
export async function refreshAuthSession(): Promise<AuthSession> {
  const previous = readSession();
  if (!previous?.refreshToken) throw new ApiError("Vui lòng đăng nhập để tiếp tục.", 401);
  if (refreshing?.token === previous.refreshToken) return refreshing.promise;
  const promise = (async () => {
    try {
      const result = await apiRequest("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: previous.refreshToken }),
      });
      if (!isAuthSession(result)) throw new ApiError("Phản hồi làm mới phiên không hợp lệ.");
      if (readSession()?.refreshToken !== previous.refreshToken)
        throw new ApiError("Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.", 401);
      // /refresh does not include activeMembership; /me remains authoritative.
      saveAuthSession({
        ...result,
        user: { ...result.user, activeMembership: previous.user.activeMembership },
      });
      return result;
    } catch (error) {
      if (
        error instanceof ApiError &&
        [400, 401, 403].includes(error.status) &&
        readSession()?.refreshToken === previous.refreshToken
      )
        clearAuthSession();
      throw error;
    }
  })();
  refreshing = { token: previous.refreshToken, promise };
  try {
    return await promise;
  } finally {
    if (refreshing?.promise === promise) refreshing = null;
  }
}
export async function getAccessToken(): Promise<string> {
  const session = readSession();
  if (!session?.accessToken) throw new ApiError("Vui lòng đăng nhập để tiếp tục.", 401);
  if (session.expiresAt <= Date.now() + 10000) return (await refreshAuthSession()).accessToken;
  return session.accessToken;
}
export async function authenticatedRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  const token = await getAccessToken();
  const request = (accessToken: string) =>
    apiRequest(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
    });
  try {
    return await request(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    if (!hasAuthSession()) throw error;
    const current = readSession();
    const refreshedToken =
      current?.accessToken !== token
        ? await getAccessToken()
        : (await refreshAuthSession()).accessToken;
    try {
      return await request(refreshedToken);
    } catch (retryError) {
      if (
        retryError instanceof ApiError &&
        retryError.status === 401 &&
        readSession()?.accessToken === refreshedToken
      )
        clearAuthSession();
      throw retryError;
    }
  }
}
export async function loadCurrentUser(): Promise<AuthUser> {
  const result = await authenticatedRequest("/auth/me");
  const user = result as AuthUser;
  const membership = user?.activeMembership;
  if (
    !isAuthUser(user) ||
    !(
      membership === null ||
      (membership &&
        Number.isSafeInteger(membership.companyId) &&
        typeof membership.companyName === "string" &&
        typeof membership.companyRole === "string")
    )
  )
    throw new ApiError("Thông tin tài khoản trả về không hợp lệ. Vui lòng thử lại.");
  const session = readSession();
  if (!session || session.user.id !== user.id)
    throw new ApiError("Phiên đăng nhập đã thay đổi.", 401);
  storeSession({ ...session, user });
  return user;
}
/** Clear both local tokens immediately; revoke the refresh token on the backend. */
export async function logoutAccount(): Promise<void> {
  const session = readSession();
  clearAuthSession();
  if (!session?.refreshToken) return;
  try {
    await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      keepalive: true,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // The local session is already cleared when the API is unavailable.
  }
}
