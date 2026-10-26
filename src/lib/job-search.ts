import type { JobItem } from "./job-listings";

/** URL-backed search state for the public job browser (UC-CAN-07 / UC-CAN-08). */
export interface JobSearchParams {
  q?: string;
  location?: string;
  industry?: string;
  salary?: string;
  mode?: string;
  experience?: string;
  job?: string;
  page?: string;
}

export const JOB_SEARCH_KEYS = [
  "q",
  "location",
  "industry",
  "salary",
  "mode",
  "experience",
  "job",
  "page",
] as const;

export function parseJobSearch(search: Record<string, unknown>): JobSearchParams {
  const values: JobSearchParams = {};
  for (const key of JOB_SEARCH_KEYS) {
    const value = search[key];
    if (typeof value === "string") values[key] = value;
  }
  return jobSearch(values);
}

/** Drops empty values so a bare /jobs URL stays canonical (no `?q=&location=`). */
export function jobSearch(values: JobSearchParams): JobSearchParams {
  const next: JobSearchParams = {};
  for (const key of JOB_SEARCH_KEYS) {
    const value = values[key];
    if (typeof value !== "string" || !value) continue;
    if (key === "page" && (value === "0" || !/^\d+$/.test(value))) continue;
    next[key] = value;
  }
  return next;
}

/** Diacritic-insensitive matching so "ke toan" still finds "Kế toán". */
export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export const SALARY_BANDS = [
  { value: "", label: "Mọi mức lương" },
  { value: "duoi-15", label: "Dưới 15 triệu" },
  { value: "15-30", label: "15 – 30 triệu" },
  { value: "30-50", label: "30 – 50 triệu" },
  { value: "tren-50", label: "Trên 50 triệu" },
] as const;

export const EXPERIENCE_BANDS = [
  { value: "", label: "Mọi kinh nghiệm" },
  { value: "chua-neu", label: "Chưa nêu yêu cầu" },
  { value: "duoi-3", label: "Dưới 3 năm" },
  { value: "3-5", label: "3 – 5 năm" },
  { value: "tren-5", label: "Trên 5 năm" },
] as const;

export const WORK_MODES = [
  { value: "", label: "Mọi hình thức" },
  { value: "onsite", label: "Tại văn phòng" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Làm việc từ xa" },
] as const;

export const WORK_MODE_LABELS: Record<string, string> = {
  onsite: "Tại văn phòng",
  hybrid: "Hybrid",
  remote: "Làm việc từ xa",
};

/** Reads the advertised range in millions of VND, e.g. "60.000.000 - 85.000.000" → [60, 85]. */
export function salaryRangeInMillions(job: JobItem): { min: number; max: number } | null {
  const amounts = job.salaryRange.match(/\d{1,3}(?:\.\d{3})+/g);
  if (!amounts?.length) return null;
  const millions = amounts
    .map((amount) => Number(amount.replace(/\./g, "")) / 1_000_000)
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!millions.length) return null;
  return { min: Math.min(...millions), max: Math.max(...millions) };
}

export function salaryBandOf(job: JobItem): string {
  const range = salaryRangeInMillions(job);
  if (!range) return "";
  if (range.min < 15) return "duoi-15";
  if (range.min < 30) return "15-30";
  if (range.min < 50) return "30-50";
  return "tren-50";
}

export function workModeOf(job: JobItem): "onsite" | "hybrid" | "remote" {
  const location = normalizeSearchText(job.location);
  if (location.includes("tu xa")) return "remote";
  if (location.includes("hybrid")) return "hybrid";
  return "onsite";
}

/** Minimum years stated in the listing itself; null when the listing states none. */
export function statedExperienceYears(job: JobItem): number | null {
  const text = job.requirements.join(" ");
  const matches = [...text.matchAll(/(\d+)\s*năm/gi)].map((match) => Number(match[1]));
  const valid = matches.filter((value) => Number.isFinite(value));
  return valid.length ? Math.min(...valid) : null;
}

export function experienceBandOf(job: JobItem): string {
  const years = statedExperienceYears(job);
  if (years === null) return "chua-neu";
  if (years < 3) return "duoi-3";
  if (years <= 5) return "3-5";
  return "tren-5";
}

export function jobMatchesSearch(job: JobItem, search: JobSearchParams): boolean {
  const keyword = normalizeSearchText((search.q ?? "").trim());
  if (keyword) {
    const haystack = normalizeSearchText(
      [
        job.title,
        job.company,
        job.department,
        job.industry ?? "",
        job.description,
        ...job.requirements,
      ].join(" "),
    );
    if (!haystack.includes(keyword)) return false;
  }

  const location = normalizeSearchText((search.location ?? "").trim());
  if (location && !normalizeSearchText(job.location).includes(location)) return false;

  if (search.industry && job.industry !== search.industry) return false;
  if (search.salary && salaryBandOf(job) !== search.salary) return false;
  if (search.mode && workModeOf(job) !== search.mode) return false;
  if (search.experience && experienceBandOf(job) !== search.experience) return false;

  return true;
}

export function filterJobs(jobs: readonly JobItem[], search: JobSearchParams): JobItem[] {
  return jobs.filter((job) => jobMatchesSearch(job, search));
}

export function hasActiveFilters(search: JobSearchParams): boolean {
  return Boolean(
    search.q ||
    search.location ||
    search.industry ||
    search.salary ||
    search.mode ||
    search.experience,
  );
}

export function similarJobs(jobs: readonly JobItem[], job: JobItem, limit = 3): JobItem[] {
  const others = jobs.filter((candidate) => candidate.id !== job.id);
  const sameField = others.filter((candidate) => candidate.industry === job.industry);
  return [...sameField, ...others.filter((candidate) => !sameField.includes(candidate))].slice(
    0,
    limit,
  );
}

export function industryOptions(jobs: readonly JobItem[]): string[] {
  const seen = new Set<string>();
  for (const job of jobs) {
    if (job.industry) seen.add(job.industry);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, "vi"));
}
