import { notFound } from "@tanstack/react-router";
import type { ReviewFilter } from "@/services/staffJobs";
import type { VerificationFilter } from "@/services/adminCompanies";
import type { AccountType } from "@/services/staffAccounts";
import { safeInternalPath } from "@/services/auth";

declare module "@tanstack/react-router" {
  interface HistoryState {
    staffAccountFocusId?: number;
  }
}

export function requireStaffDetailId(value: string) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw notFound();
}

export function staffReturnPath(value: unknown) {
  const path = safeInternalPath(value);
  if (!path) return undefined;
  const target = new URL(path, "https://staff.guardian.invalid");
  if (
    target.origin !== "https://staff.guardian.invalid" ||
    !/^\/staff(?:\/|$)/.test(target.pathname)
  )
    return undefined;
  return `${target.pathname}${target.search}${target.hash}`;
}

const pageNumber = (value: unknown) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : undefined;

export function staffJobsSearch(search: Record<string, unknown>): {
  status?: ReviewFilter;
  q?: string;
  page?: number;
} {
  return {
    status: ["PENDING_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN", "ALL"].includes(
      String(search.status),
    )
      ? (search.status as ReviewFilter)
      : undefined,
    q: typeof search.q === "string" ? search.q.trim().slice(0, 200) || undefined : undefined,
    page: pageNumber(search.page),
  };
}

export function staffAccountsSearch(search: Record<string, unknown>): {
  type?: AccountType;
  q?: string;
  page?: number;
} {
  return {
    type: search.type === "companies" ? "companies" : undefined,
    q: typeof search.q === "string" ? search.q.trim().slice(0, 200) || undefined : undefined,
    page: pageNumber(search.page),
  };
}

export function staffVerificationsSearch(search: Record<string, unknown>): {
  status: VerificationFilter;
  page: number;
} {
  return {
    status:
      search.status === "ALL" || search.status === "VERIFIED" || search.status === "REJECTED"
        ? search.status
        : "PENDING",
    page: pageNumber(search.page) ?? 0,
  };
}
