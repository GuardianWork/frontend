import { authenticatedFetch, authenticatedRequest } from "./auth.ts";
import { parseApiResponse } from "./api.ts";
import { AdminApiError, staffError } from "./adminCompanies.ts";

export interface VerificationAttempt {
  attemptId: string;
  companyId: number;
  companyName: string;
  taxCode: string;
  workAddress: string;
  submitterPosition: string;
  representation: "LEGAL_REPRESENTATIVE" | "AUTHORIZED_REPRESENTATIVE";
  declarationText: string;
  declarationVersion: string;
  documentId: string;
  submittedAt: string;
  outcome: "VERIFIED" | "REJECTED" | null;
  rejectionReason: string | null;
  reviewerId: number | null;
  reviewedAt: string | null;
}
export async function getVerificationHistory(
  companyId: number,
  signal?: AbortSignal,
): Promise<VerificationAttempt[]> {
  try {
    const data = await authenticatedRequest(`/staff/companies/${companyId}/verification-history`, {
      signal,
    });
    if (
      !Array.isArray(data) ||
      !data.every(
        (item) =>
          item &&
          item.companyId === companyId &&
          typeof item.attemptId === "string" &&
          typeof item.documentId === "string",
      )
    )
      throw new AdminApiError("Lịch sử hồ sơ trả về không hợp lệ.");
    return data;
  } catch (error) {
    throw staffError(error);
  }
}
/** Only same-origin document routes use API credentials; external URLs stay plain links. */
export function certificateTarget(value: string | null): { documentId?: string; href?: string } {
  if (!value) return {};
  try {
    const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(value, origin);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return {};
    if (url.origin === origin) {
      const match = /^\/(?:api\/)?company-verification-documents\/([^/]+)$/.exec(url.pathname);
      if (match) return { documentId: decodeURIComponent(match[1]) };
      // Unknown internal API paths cannot be opened without authentication.
      if (url.pathname.startsWith("/api/")) return {};
    }
    return { href: url.href };
  } catch {
    return {};
  }
}
export async function fetchEvidence(documentId: string): Promise<{ blob: Blob; filename: string }> {
  try {
    const response = await authenticatedFetch(
      `/company-verification-documents/${encodeURIComponent(documentId)}`,
    );
    if (!response.ok) await parseApiResponse(response);
    const disposition = response.headers.get("Content-Disposition") || "";
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
    const plain = /filename="([^"]+)"|filename=([^;]+)/i.exec(disposition);
    let filename = plain?.[1] || plain?.[2]?.trim() || `verification-${documentId}`;
    if (encoded) {
      try {
        filename = decodeURIComponent(encoded);
      } catch {
        /* Use the fallback filename. */
      }
    }
    filename = Array.from(filename, (char) =>
      char.charCodeAt(0) < 32 || char === "/" || char === "\\" ? "_" : char,
    ).join("");
    return { blob: await response.blob(), filename };
  } catch (error) {
    throw staffError(error);
  }
}
export async function downloadEvidence(documentId: string) {
  const { blob, filename } = await fetchEvidence(documentId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
