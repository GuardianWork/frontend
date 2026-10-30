import { authenticatedRequest } from "./auth";

export type CandidateProfileExperience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type CandidateProfileEducation = {
  institution: string;
  degree: string;
  startYear: string;
  endYear: string;
  description: string;
};

export type CandidateProfileResponse = {
  id: string;
  userId: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  skills: string[];
  experience: CandidateProfileExperience[];
  education: CandidateProfileEducation[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isCandidateProfile(value: unknown): value is CandidateProfileResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.userId === "number" &&
    typeof value.fullName === "string" &&
    Array.isArray(value.skills) &&
    Array.isArray(value.experience) &&
    Array.isArray(value.education)
  );
}

export async function loadCandidateProfile() {
  const result = await authenticatedRequest("/candidates/profile");
  if (!isCandidateProfile(result)) {
    throw new Error("Thông tin hồ sơ trả về không hợp lệ. Vui lòng thử lại sau.");
  }
  return result;
}

export async function saveCandidateProfile(
  request: Omit<CandidateProfileResponse, "id" | "userId" | "createdAt" | "updatedAt">,
) {
  const result = await authenticatedRequest("/candidates/profile", {
    method: "PUT",
    body: JSON.stringify(request),
  });
  if (!isCandidateProfile(result)) {
    throw new Error("Thông tin hồ sơ trả về không hợp lệ. Vui lòng thử lại sau.");
  }
  return result;
}
