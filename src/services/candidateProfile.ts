import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";

export interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  startYear: string;
  endYear?: string | null;
  description?: string | null;
}

export interface CandidateProfile {
  id: string;
  userId: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCandidateProfileInput {
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  skills?: string[];
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  isPublic?: boolean;
}

export interface NormalizedError {
  httpStatus: number;
  code?: number;
  message: string;
  fieldErrors: Record<string, string>;
}

function mapExperience(value: unknown): ExperienceEntry {
  const entry = value as Partial<ExperienceEntry>;
  return {
    company: String(entry?.company ?? ""),
    role: String(entry?.role ?? ""),
    startDate: String(entry?.startDate ?? ""),
    endDate: entry?.endDate ?? null,
    description: entry?.description ?? null,
  };
}

function mapEducation(value: unknown): EducationEntry {
  const entry = value as Partial<EducationEntry>;
  return {
    institution: String(entry?.institution ?? ""),
    degree: String(entry?.degree ?? ""),
    startYear: String(entry?.startYear ?? ""),
    endYear: entry?.endYear ?? null,
    description: entry?.description ?? null,
  };
}

export function parseCandidateProfile(value: unknown): CandidateProfile {
  const profile = value as Partial<CandidateProfile>;
  if (!profile || typeof profile.fullName !== "string") {
    throw new ApiError("Thông tin hồ sơ không hợp lệ. Vui lòng tải lại.", 500);
  }
  return {
    id: String(profile.id ?? ""),
    userId: Number(profile.userId ?? 0),
    email: String(profile.email ?? ""),
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl ?? null,
    phoneNumber: profile.phoneNumber ?? null,
    skills: Array.isArray(profile.skills) ? profile.skills.map(String) : [],
    experience: Array.isArray(profile.experience) ? profile.experience.map(mapExperience) : [],
    education: Array.isArray(profile.education) ? profile.education.map(mapEducation) : [],
    isPublic: Boolean(profile.isPublic),
    createdAt: String(profile.createdAt ?? new Date().toISOString()),
    updatedAt: String(profile.updatedAt ?? new Date().toISOString()),
  };
}

export async function loadCandidateProfile(): Promise<CandidateProfile> {
  return parseCandidateProfile(
    await authenticatedRequest("/v1/candidates/profile", { cache: "no-store" }),
  );
}

export async function updateCandidateProfile(
  input: UpdateCandidateProfileInput,
): Promise<CandidateProfile> {
  const body: Record<string, unknown> = { fullName: input.fullName };
  if (input.phoneNumber !== undefined) body.phoneNumber = input.phoneNumber;
  if (input.avatarUrl !== undefined) body.avatarUrl = input.avatarUrl;
  if (input.skills !== undefined) body.skills = input.skills;
  if (input.experience !== undefined) body.experience = input.experience;
  if (input.education !== undefined) body.education = input.education;
  if (input.isPublic !== undefined) body.isPublic = input.isPublic;
  return parseCandidateProfile(
    await authenticatedRequest("/v1/candidates/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  );
}

export function toLocalPhone(value: string | null | undefined): string {
  if (!value) return "";
  return value.startsWith("+84") ? `0${value.slice(3)}` : value;
}

export function toCanonicalPhone(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/[\s.-]/g, "");
  if (!trimmed) return undefined;
  return trimmed.startsWith("0") ? `+84${trimmed.slice(1)}` : trimmed;
}

// Backward-compatible API for CandidateContact.
export type CandidateProfileLegacy = CandidateProfile;
export async function updateCandidatePhone(
  profile: CandidateProfile,
  phone: string,
): Promise<CandidateProfile> {
  const normalized = phone.trim();
  return updateCandidateProfile({
    fullName: profile.fullName,
    phoneNumber: normalized
      ? normalized.startsWith("0")
        ? `+84${normalized.slice(1)}`
        : normalized
      : null,
    avatarUrl: profile.avatarUrl,
    skills: profile.skills,
    experience: profile.experience,
    education: profile.education,
    isPublic: profile.isPublic,
  });
}

export async function readError(response: Response): Promise<NormalizedError> {
  let body: Record<string, unknown> | null = null;
  try {
    body = await response.json();
  } catch {
    // No JSON body.
  }
  const message = typeof body?.message === "string" ? body.message : "Đã xảy ra lỗi.";
  const prefixedCode = /^(\d{5})\b/.exec(message)?.[1];
  const statusCode =
    typeof body?.status === "number" && body.status >= 10_000 ? body.status : undefined;
  return {
    httpStatus: response.status,
    code: statusCode ?? (prefixedCode ? Number(prefixedCode) : undefined),
    message,
    fieldErrors:
      body?.errors && typeof body.errors === "object"
        ? (body.errors as Record<string, string>)
        : {},
  };
}
