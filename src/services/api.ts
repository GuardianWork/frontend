/** VITE_API_BASE_URL accepts a backend origin or a URL ending in /api. */
export function getApiBaseUrl() {
  const configured = (import.meta.env?.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
  return configured.endsWith("/api") ? configured : `${configured}/api`;
}

export class ApiError extends Error {
  status: number;
  retryAfterSeconds?: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...init.headers,
      },
      signal: init.signal || AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError("Không thể kết nối dịch vụ. Vui lòng kiểm tra kết nối và thử lại.");
  }
  return response;
}

export async function parseApiResponse(response: Response): Promise<unknown> {
  let body: { status?: number; message?: string; data?: unknown } | null = null;
  try {
    body = await response.json();
  } catch {
    // Proxies may return HTML instead of the API envelope.
  }
  const status = !response.ok ? response.status : (body?.status ?? response.status);
  if (status >= 400) {
    const error = new ApiError(
      body?.message || "Không thể hoàn tất yêu cầu. Vui lòng thử lại.",
      status,
    );
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter && /^\d+$/.test(retryAfter)) error.retryAfterSeconds = Number(retryAfter);
    throw error;
  }
  if (!body || !("data" in body)) {
    throw new ApiError("Phản hồi từ dịch vụ không hợp lệ. Vui lòng thử lại sau.");
  }
  return body.data;
}

export async function apiRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  return parseApiResponse(await apiFetch(path, init));
}
