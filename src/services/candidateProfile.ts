import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";
export interface CandidateProfile {
  id: string;
  userId: number;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  skills: string[];
  experienceSummary: string | null;
  educationSummary: string | null;
  isPublic: boolean;
}
function parseProfile(value: unknown): CandidateProfile {
  const profile = value as CandidateProfile;
  if (
    !profile ||
    !Number.isSafeInteger(profile.userId) ||
    typeof profile.fullName !== "string" ||
    !(
      profile.phoneNumber === null ||
      (typeof profile.phoneNumber === "string" && /^\+84\d+$/.test(profile.phoneNumber))
    )
  )
    throw new ApiError("Thông tin liên hệ không hợp lệ. Vui lòng tải lại hồ sơ.");
  return profile;
}
export async function loadCandidateProfile(): Promise<CandidateProfile> {
  return parseProfile(await authenticatedRequest("/v1/candidates/profile", { cache: "no-store" }));
}
export async function updateCandidatePhone(
  profile: CandidateProfile,
  phone: string,
): Promise<CandidateProfile> {
  // Preserve other profile fields; clearing the phone clears the shared account contact.
  const { fullName, avatarUrl, skills, experienceSummary, educationSummary, isPublic } = profile;
  return parseProfile(
    await authenticatedRequest("/v1/candidates/profile", {
      method: "PUT",
      body: JSON.stringify({
        fullName,
        phoneNumber: phone.trim() || null,
        avatarUrl,
        skills,
        experienceSummary,
        educationSummary,
        isPublic,
      }),
    }),
  );
}
