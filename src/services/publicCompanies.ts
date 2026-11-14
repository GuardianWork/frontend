import { searchPublicJobs, type PublicJobSearchResult } from "./publicJobs.ts";

/**
 * Candidate-facing company discovery.
 *
 * The platform publishes a posting only for a company that passed verification
 * and a staff review, so the public job stream is the authoritative source for
 * what a candidate may learn about a company: who they are, what they hire for
 * and the employment terms they disclose.
 *
 * Everything here is derived from those public postings. We deliberately do not
 * invent company size, founding year, headquarters or benefits that the company
 * has not published.
 */

const PAGE_SIZE = 20;

/** How many public posting pages a company read may scan. */
const MAX_PAGES = 10;

export interface PublicCompany {
  id: number;
  name: string;
  postings: PublicJobSearchResult[];
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
  posting: PublicJobSearchResult;
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
}

export interface CompanyCount {
  label: string;
  count: number;
}

export interface CompanySalaryBand {
  currency: string;
  payPeriod: string;
  minimum: number;
  maximum: number;
  count: number;
  total: number;
}

export interface CompanySummary {
  roles: CompanyRole[];
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

export interface CompanyIntroduction {
  paragraphs: string[];
  roleTitle: string;
  jobId: number;
}

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

export function employmentTypeLabel(value?: string) {
  if (!value) return "Việc làm";
  return EMPLOYMENT_TYPE_LABELS[value] ?? value;
}

export function workArrangementLabel(value?: string) {
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
export function salaryBandLabel(band: Omit<CompanySalaryBand, "count" | "total">): string {
  const unit = payPeriodLabel(band.payPeriod);
  return band.minimum === band.maximum
    ? `${formatMoney(band.minimum)} ${band.currency}/${unit}`
    : `${formatMoney(band.minimum)} – ${formatMoney(band.maximum)} ${band.currency}/${unit}`;
}

function salaryRangeOf(posting: PublicJobSearchResult): CompanySalaryRange | null {
  const compensation = posting.content?.compensation;
  if (!compensation?.disclosed) return null;
  if (typeof compensation.minimum !== "number" || typeof compensation.maximum !== "number")
    return null;
  const currency = compensation.currency ?? "VND";
  const payPeriod = (compensation.payPeriod ?? "MONTH").toUpperCase();
  return {
    minimum: compensation.minimum,
    maximum: compensation.maximum,
    currency,
    payPeriod,
    label: salaryBandLabel({
      minimum: compensation.minimum,
      maximum: compensation.maximum,
      currency,
      payPeriod,
    }),
  };
}

export function postingSalaryRange(posting: PublicJobSearchResult): string | null {
  return salaryRangeOf(posting)?.label ?? null;
}

function deadlineOf(posting: PublicJobSearchResult): string | null {
  const raw = posting.approvedDeadline ?? posting.content?.deadline;
  if (!raw) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  return match ? match[1] : raw;
}

function buildRole(posting: PublicJobSearchResult): CompanyRole {
  const content = posting.content ?? {};
  return {
    id: posting.id,
    posting,
    title: content.title?.trim() || "Tin tuyển dụng",
    location: content.location?.trim() || null,
    industry: content.industry?.trim() || null,
    employmentType: content.employmentType ?? null,
    employmentTypeLabel: employmentTypeLabel(content.employmentType),
    workArrangement: content.workArrangement ?? null,
    workArrangementLabel: workArrangementLabel(content.workArrangement),
    salary: salaryRangeOf(posting),
    headcount:
      typeof content.headcount === "number" && content.headcount > 0 ? content.headcount : null,
    deadline: deadlineOf(posting),
    description: content.description?.trim() || null,
    applicationsAvailable: posting.applicationsAvailable !== false,
  };
}

function addCount(map: Map<string, number>, label?: string | null) {
  const value = label?.trim();
  if (!value) return;
  map.set(value, (map.get(value) ?? 0) + 1);
}

function toCounts(map: Map<string, number>): CompanyCount[] {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function sortRoles(roles: CompanyRole[]): CompanyRole[] {
  return [...roles].sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline) || a.id - b.id;
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return a.id - b.id;
  });
}

/** Everything the public postings disclose about how a company hires. */
export function readCompanySummary(company: PublicCompany): CompanySummary {
  const roles = sortRoles(company.postings.map(buildRole));
  const locations = new Map<string, number>();
  const industries = new Map<string, number>();
  const employmentTypes = new Map<string, number>();
  const workArrangements = new Map<string, number>();
  const bands = new Map<string, CompanySalaryBand>();
  const deadlines = new Set<string>();
  let headcountTotal = 0;

  for (const role of roles) {
    addCount(locations, role.location);
    addCount(industries, role.industry);
    addCount(employmentTypes, role.employmentTypeLabel);
    addCount(workArrangements, role.workArrangementLabel);
    if (role.headcount) headcountTotal += role.headcount;
    if (role.deadline) deadlines.add(role.deadline);
    if (!role.salary) continue;
    const key = `${role.salary.currency}|${role.salary.payPeriod}`;
    const existing = bands.get(key);
    if (existing) {
      existing.minimum = Math.min(existing.minimum, role.salary.minimum);
      existing.maximum = Math.max(existing.maximum, role.salary.maximum);
      existing.count += 1;
      continue;
    }
    bands.set(key, {
      currency: role.salary.currency,
      payPeriod: role.salary.payPeriod,
      minimum: role.salary.minimum,
      maximum: role.salary.maximum,
      count: 1,
      total: roles.length,
    });
  }

  return {
    roles,
    roleCount: roles.length,
    locations: toCounts(locations),
    industries: toCounts(industries),
    employmentTypes: toCounts(employmentTypes),
    workArrangements: toCounts(workArrangements),
    salaryBands: [...bands.values()]
      .map((band) => ({ ...band, total: roles.length }))
      .sort((a, b) => b.count - a.count || a.minimum - b.minimum),
    disclosedSalaryCount: roles.filter((role) => role.salary).length,
    headcountTotal,
    deadlines: [...deadlines].sort(),
  };
}

/**
 * The clearest company introduction available in the public postings.
 * Job descriptions are per-role, so the source role is returned for attribution.
 */
export function companyIntroduction(company: PublicCompany): CompanyIntroduction | null {
  let best: CompanyIntroduction | null = null;
  let bestLength = 0;
  for (const posting of company.postings) {
    const description = posting.content?.description?.trim();
    if (!description) continue;
    const paragraphs = description
      .split(/\n{2,}/)
      .map((part) =>
        part
          .replace(/^#+\s*/gm, "")
          .replace(/^[-*•]\s+/gm, "")
          .trim(),
      )
      .filter((part) => part.length >= 48 && !/^https?:\/\//.test(part))
      .slice(0, 2);
    if (!paragraphs.length) continue;
    const length = paragraphs.join(" ").length;
    if (length <= bestLength) continue;
    best = {
      paragraphs,
      roleTitle: posting.content?.title?.trim() || "Tin tuyển dụng",
      jobId: posting.id,
    };
    bestLength = length;
  }
  if (!best) return null;
  return {
    ...best,
    paragraphs: best.paragraphs.map((part) =>
      part.length > 700 ? `${part.slice(0, 697).trimEnd()}…` : part,
    ),
  };
}

async function collectPostings(maxPages = MAX_PAGES): Promise<PublicJobSearchResult[]> {
  const first = await searchPublicJobs({ page: 0, size: PAGE_SIZE });
  const postings = Array.isArray(first?.content) ? [...first.content] : [];
  if (!postings.length || first.last) return postings;

  const totalPages = Math.min(
    maxPages,
    typeof first.totalPages === "number" && first.totalPages > 0 ? first.totalPages : maxPages,
  );
  if (totalPages <= 1) return postings;

  const pages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      searchPublicJobs({ page: index + 1, size: PAGE_SIZE }).catch(() => null),
    ),
  );
  for (const page of pages) {
    if (Array.isArray(page?.content)) postings.push(...page.content);
  }
  return postings;
}

/** Every company visible in the public posting stream, with their postings. */
export async function listPublicCompanies(maxPages = MAX_PAGES): Promise<PublicCompany[]> {
  const postings = await collectPostings(maxPages);
  const byId = new Map<number, PublicCompany>();
  for (const posting of postings) {
    const id = posting?.company?.id;
    const name = posting?.company?.name;
    if (typeof id !== "number" || !name) continue;
    const existing = byId.get(id);
    if (existing) existing.postings.push(posting);
    else byId.set(id, { id, name, postings: [posting] });
  }
  return [...byId.values()].sort(
    (a, b) => b.postings.length - a.postings.length || a.name.localeCompare(b.name),
  );
}

/** The public postings of one company, or null when the company is not published. */
export async function findPublicCompany(
  companyId: number,
  maxPages = MAX_PAGES,
): Promise<PublicCompany | null> {
  if (!Number.isSafeInteger(companyId) || companyId <= 0) return null;
  const postings = await collectPostings(maxPages);
  const matching = postings.filter((posting) => posting?.company?.id === companyId);
  if (!matching.length) return null;
  const name = matching[0].company?.name ?? "";
  return { id: companyId, name, postings: matching };
}
