import { ApiError, apiRequest } from "./api.ts";

/**
 * Candidate-facing company discovery.
 *
 * The backend owns public company visibility: it groups the same public postings
 * that job search exposes and returns screen-ready summaries. This module only
 * maps backend enum values to Vietnamese labels and applies Vietnam formatting.
 */

const PAGE_SIZE = 20;
const MAX_PAGES = 10;

export interface PublicCompany {
  id: number;
  name: string;
}

export interface CompanyCount {
  label: string;
  count: number;
}

export interface CompanySalaryRange {
  minimum: number;
  maximum: number;
  currency: string;
  payPeriod: string;
  label: string;
}

export interface CompanyRole {
  id: number;
  title: string;
  location: string | null;
  industry: string | null;
  employmentType: string | null;
  employmentTypeLabel: string;
  workArrangement: string | null;
  workArrangementLabel: string;
  salary: CompanySalaryRange | null;
  headcount: number | null;
  deadline: string | null;
  description: string | null;
  applicationsAvailable: boolean;
  /** Applicants so far, or null when the API does not disclose it. */
  applicationCount: number | null;
}

export interface CompanySalaryBand {
  currency: string;
  payPeriod: string;
  minimum: number;
  maximum: number;
  count: number;
}

export interface CompanySummary {
  roleCount: number;
  locations: CompanyCount[];
  industries: CompanyCount[];
  employmentTypes: CompanyCount[];
  workArrangements: CompanyCount[];
  salaryBands: CompanySalaryBand[];
  disclosedSalaryCount: number;
  headcountTotal: number;
  deadlines: string[];
}

export interface PublicCompanyDirectoryEntry extends PublicCompany {
  summary: CompanySummary;
}

export type PublicCompanyInfo = PublicCompanyDirectoryEntry;

export interface PublicCompanyRolesPage {
  roles: CompanyRole[];
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
}

interface ApiPage<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface ApiCompanyCount {
  label: string;
  count: number;
}

interface ApiCompanySalaryBand {
  currency: string;
  payPeriod: string;
  minimum: number;
  maximum: number;
  count: number;
}

interface ApiCompanySummary {
  roleCount: number;
  locations: ApiCompanyCount[];
  industries: ApiCompanyCount[];
  employmentTypes: ApiCompanyCount[];
  workArrangements: ApiCompanyCount[];
  salaryBands: ApiCompanySalaryBand[];
  disclosedSalaryCount: number;
  headcountTotal: number;
  deadlines: string[];
}

interface ApiCompanyRole {
  id: number;
  title: string | null;
  location: string | null;
  industry: string | null;
  employmentType: string | null;
  workArrangement: string | null;
  salary: Omit<CompanySalaryRange, "label"> | null;
  headcount: number | null;
  deadline: string | null;
  description: string | null;
  applicationsAvailable: boolean;
  /**
   * Exposed by the public roles API (`GET /api/companies/public/{id}/roles`): exact total of
   * applications for the posting, `0` when nobody applied yet. Mapped defensively in case an
   * older backend deploy omits it.
   */
  applicationCount?: number | null;
}

interface ApiCompanyDirectoryEntry {
  id: number;
  name: string;
  summary: ApiCompanySummary;
}

type ApiCompanyInfo = ApiCompanyDirectoryEntry;

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  TEMPORARY: "Thời vụ",
};

const WORK_ARRANGEMENT_LABELS: Record<string, string> = {
  ONSITE: "Tại văn phòng",
  HYBRID: "Linh hoạt",
  REMOTE: "Từ xa",
};

const PAY_PERIOD_LABELS: Record<string, string> = {
  HOUR: "giờ",
  DAY: "ngày",
  MONTH: "tháng",
  YEAR: "năm",
};

export function employmentTypeLabel(value?: string | null) {
  if (!value) return "Việc làm";
  return EMPLOYMENT_TYPE_LABELS[value] ?? value;
}

export function workArrangementLabel(value?: string | null) {
  if (!value) return "Chưa công khai";
  return WORK_ARRANGEMENT_LABELS[value] ?? value;
}

export function payPeriodLabel(value?: string) {
  if (!value) return "tháng";
  return PAY_PERIOD_LABELS[value.toUpperCase()] ?? value.toLowerCase();
}

export function formatMoney(value: number) {
  return Math.round(value).toLocaleString("vi-VN").replace(/,/g, ".");
}

/** A compact "15 – 25 triệu" reading for the dossier summary. */
export function compactSalary(band: CompanySalaryBand): string {
  const unit = payPeriodLabel(band.payPeriod);
  if (band.currency === "VND" && (band.payPeriod || "MONTH").toUpperCase() === "MONTH") {
    const short = (value: number) => {
      const millions = value / 1_000_000;
      return millions.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
    };
    return band.minimum === band.maximum
      ? `${short(band.minimum)} triệu`
      : `${short(band.minimum)} – ${short(band.maximum)} triệu`;
  }
  return band.minimum === band.maximum
    ? `${formatMoney(band.minimum)} ${band.currency}/${unit}`
    : `${formatMoney(band.minimum)} – ${formatMoney(band.maximum)} ${band.currency}/${unit}`;
}

/** The full salary label used in facts and role rows. */
export function salaryBandLabel(band: Omit<CompanySalaryBand, "count">): string {
  const unit = payPeriodLabel(band.payPeriod);
  return band.minimum === band.maximum
    ? `${formatMoney(band.minimum)} ${band.currency}/${unit}`
    : `${formatMoney(band.minimum)} – ${formatMoney(band.maximum)} ${band.currency}/${unit}`;
}

function toSummary(summary: ApiCompanySummary): CompanySummary {
  return {
    roleCount: summary.roleCount ?? 0,
    locations: summary.locations ?? [],
    industries: summary.industries ?? [],
    employmentTypes: (summary.employmentTypes ?? []).map((item) => ({
      ...item,
      label: employmentTypeLabel(item.label),
    })),
    workArrangements: (summary.workArrangements ?? []).map((item) => ({
      ...item,
      label: workArrangementLabel(item.label),
    })),
    salaryBands: summary.salaryBands ?? [],
    disclosedSalaryCount: summary.disclosedSalaryCount ?? 0,
    headcountTotal: summary.headcountTotal ?? 0,
    deadlines: summary.deadlines ?? [],
  };
}

function toRole(role: ApiCompanyRole): CompanyRole {
  return {
    id: role.id,
    title: role.title?.trim() || "Tin tuyển dụng",
    location: role.location?.trim() || null,
    industry: role.industry?.trim() || null,
    employmentType: role.employmentType ?? null,
    employmentTypeLabel: employmentTypeLabel(role.employmentType),
    workArrangement: role.workArrangement ?? null,
    workArrangementLabel: workArrangementLabel(role.workArrangement),
    salary: role.salary
      ? {
          ...role.salary,
          label: salaryBandLabel({
            minimum: role.salary.minimum,
            maximum: role.salary.maximum,
            currency: role.salary.currency,
            payPeriod: role.salary.payPeriod,
          }),
        }
      : null,
    headcount: typeof role.headcount === "number" && role.headcount > 0 ? role.headcount : null,
    deadline: role.deadline ?? null,
    description: role.description?.trim() || null,
    applicationsAvailable: role.applicationsAvailable !== false,
    applicationCount:
      typeof role.applicationCount === "number" &&
      Number.isSafeInteger(role.applicationCount) &&
      role.applicationCount >= 0
        ? role.applicationCount
        : null,
  };
}

function toDirectoryEntry(entry: ApiCompanyDirectoryEntry): PublicCompanyDirectoryEntry {
  return {
    id: entry.id,
    name: entry.name,
    summary: toSummary(entry.summary),
  };
}

async function companyPage(keyword: string, page: number) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(PAGE_SIZE),
  });
  const trimmed = keyword.trim();
  if (trimmed) query.set("keyword", trimmed);
  return (await apiRequest(
    `/companies/public?${query.toString()}`,
  )) as ApiPage<ApiCompanyDirectoryEntry>;
}

/** Search every publicly visible company, one backend page at a time. */
export async function searchPublicCompanies({
  keyword = "",
  maxPages = MAX_PAGES,
}: {
  keyword?: string;
  maxPages?: number;
} = {}): Promise<PublicCompanyDirectoryEntry[]> {
  const first = await companyPage(keyword, 0);
  const entries = Array.isArray(first?.content) ? [...first.content] : [];
  if (!entries.length || first.last) return entries.map(toDirectoryEntry);

  const totalPages = Math.min(
    maxPages,
    typeof first.totalPages === "number" && first.totalPages > 0 ? first.totalPages : maxPages,
  );
  if (totalPages <= 1) return entries.map(toDirectoryEntry);

  const pages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      companyPage(keyword, index + 1).catch(() => null),
    ),
  );
  for (const page of pages) {
    if (Array.isArray(page?.content)) entries.push(...page.content);
  }
  return entries.map(toDirectoryEntry);
}

/** Public company information for the dossier general/info tab. */
export async function findPublicCompanyInfo(companyId: number): Promise<PublicCompanyInfo | null> {
  if (!Number.isSafeInteger(companyId) || companyId <= 0) return null;
  let data: ApiCompanyInfo;
  try {
    data = (await apiRequest(`/companies/public/${companyId}`)) as ApiCompanyInfo;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
  return toDirectoryEntry(data);
}

/** Paginated visible roles for the dossier opening roles tab. */
export async function findPublicCompanyRoles(
  companyId: number,
  page = 0,
  size = 10,
): Promise<PublicCompanyRolesPage | null> {
  if (!Number.isSafeInteger(companyId) || companyId <= 0) return null;
  let data: ApiPage<ApiCompanyRole>;
  try {
    data = (await apiRequest(
      `/companies/public/${companyId}/roles?${new URLSearchParams({
        page: String(page),
        size: String(size),
      })}`,
    )) as ApiPage<ApiCompanyRole>;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
  return {
    roles: (data.content ?? []).map(toRole),
    pagination: {
      pageNumber: data.pageNumber,
      pageSize: data.pageSize,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      first: data.first,
      last: data.last,
    },
  };
}
