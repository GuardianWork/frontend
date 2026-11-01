import { ApiError } from "./api.ts";
import { accountRequest } from "./accountControl.ts";

export interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}
export interface EducationEntry {
  institution: string;
  degree: string;
  startYear: string;
  endYear: string | null;
  description: string | null;
}
export interface CandidateProfile {
  id: string;
  userId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  skills: string[];
  experienceSummary: string | null;
  educationSummary: string | null;
  /** Optional read projections; GW-95 writes preserve the documented summary contract. */
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  isPublic: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}
export interface NormalizedError {
  httpStatus: number;
  code?: number;
  message: string;
  fieldErrors: Record<string, string>;
}
export type UpdateCandidateProfileInput = Pick<
  CandidateProfile,
  | "firstName"
  | "lastName"
  | "phoneNumber"
  | "avatarUrl"
  | "skills"
  | "experienceSummary"
  | "educationSummary"
  | "isPublic"
>;

export function parseCandidateProfile(value: unknown): CandidateProfile {
  const profile = value as CandidateProfile;
  if (
    !profile ||
    !Number.isSafeInteger(profile.userId) ||
    typeof profile.firstName !== "string" ||
    typeof profile.lastName !== "string" ||
    typeof profile.fullName !== "string" ||
    !(
      profile.phoneNumber == null ||
      (typeof profile.phoneNumber === "string" && /^\+84\d+$/.test(profile.phoneNumber))
    )
  )
    throw new ApiError("Thông tin hồ sơ không hợp lệ. Vui lòng tải lại.");
  return {
    ...profile,
    phoneNumber: profile.phoneNumber ?? null,
    experienceSummary: profile.experienceSummary ?? null,
    educationSummary: profile.educationSummary ?? null,
  };
}
export async function loadCandidateProfile(): Promise<CandidateProfile> {
  return parseCandidateProfile(
    await accountRequest("/v1/candidates/profile", { cache: "no-store" }),
  );
}
/** Full identity/profile update: derived fullName and read-only record projections never leave the client. */
export async function updateCandidateProfile(
  input: UpdateCandidateProfileInput,
): Promise<CandidateProfile> {
  return parseCandidateProfile(
    await accountRequest("/v1/candidates/profile", {
      method: "PUT",
      body: JSON.stringify({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phoneNumber: input.phoneNumber?.trim() || null,
        avatarUrl: input.avatarUrl,
        skills: input.skills,
        experienceSummary: input.experienceSummary,
        educationSummary: input.educationSummary,
        isPublic: input.isPublic,
      }),
    }),
  );
}
export async function updateCandidatePhone(profile: CandidateProfile, phone: string) {
  return updateCandidateProfile({ ...profile, phoneNumber: phone.trim() || null });
}
export type CandidateProfileLegacy = CandidateProfile;
export function toLocalPhone(value: string | null | undefined): string {
  if (!value) return "";
  return value.startsWith("+84") ? `0${value.slice(3)}` : value;
}
export function toCanonicalPhone(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim().replace(/[\s.-]/g, "");
  if (!trimmed) return undefined;
  return trimmed.startsWith("0") ? `+84${trimmed.slice(1)}` : trimmed;
}
