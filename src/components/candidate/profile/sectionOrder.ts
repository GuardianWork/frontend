export const PROFILE_SECTION_IDS = ["about", "experience", "education", "skills"] as const;

export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

export const PROFILE_SECTION_TITLES: Record<ProfileSectionId, string> = {
  about: "Giới thiệu bản thân",
  experience: "Kinh nghiệm làm việc",
  education: "Học vấn",
  skills: "Kỹ năng",
};

const STORAGE_KEY = "guardianwork.profile-section-order";

export function normalizeSectionOrder(value: unknown): ProfileSectionId[] {
  if (!Array.isArray(value)) return [...PROFILE_SECTION_IDS];

  const seen = new Set<ProfileSectionId>();
  const order: ProfileSectionId[] = [];

  for (const item of value) {
    if (typeof item !== "string") continue;
    if (!PROFILE_SECTION_IDS.includes(item as ProfileSectionId)) continue;
    const id = item as ProfileSectionId;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }

  for (const id of PROFILE_SECTION_IDS) {
    if (!seen.has(id)) order.push(id);
  }

  return order;
}

export function readProfileSectionOrder(): ProfileSectionId[] {
  if (typeof window === "undefined") return [...PROFILE_SECTION_IDS];
  try {
    return normalizeSectionOrder(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return [...PROFILE_SECTION_IDS];
  }
}

export function writeProfileSectionOrder(order: ProfileSectionId[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSectionOrder(order)));
  } catch {
    // Storage can be unavailable in private mode; the order still works for this session.
  }
}
