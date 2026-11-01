/* eslint-disable react-refresh/only-export-components */
import { useAuthUser } from "@/hooks/useAuthUser";
import { useCandidateProfile } from "@/hooks/useAccountIdentity";
import { useRouterState } from "@tanstack/react-router";
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CandidateProfile {
  name: string;
  shortName: string;
  role: string;
  location: string;
  email: string;
  phone: string;
  salaryExpectation: string;
  experienceYears: number;
  gender: string;
  birthDate: string;
  avatarUrl: string;
  cvFileName: string;
  cvStatus: string;
}

export interface CandidateExperience {
  title: string;
  company: string;
  from: string;
  to: string;
  description: string;
}

export interface CandidateEducation {
  degree: string;
  school: string;
  from: string;
  to: string;
  description?: string;
}

export interface CandidateProfileDetails {
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  isPublic: boolean;
  skills: string[];
  experience: string;
  experiences: CandidateExperience[];
  education: CandidateEducation[];
}

export const MAX_CV_COUNT = 5;

const APPLIED_JOBS_KEY = "guardianwork_candidate_applied_jobs";

function readStoredApplications(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(APPLIED_JOBS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function persistApplications(ids: string[]) {
  try {
    window.localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(ids));
  } catch {
    // Storage can be unavailable; the in-memory list still covers this session.
  }
}
export const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;

export type CandidateCvFormat = "PDF" | "DOC" | "DOCX";

export interface CandidateCv {
  id: string;
  fileName: string;
  label: string;
  format: CandidateCvFormat;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  isDefault: boolean;
  usedInApplications: number;
  previewUrl?: string;
}

export interface CandidateCvInput {
  fileName: string;
  label: string;
  format: CandidateCvFormat;
  mimeType: string;
  sizeBytes: number;
  previewUrl?: string;
}

export type CandidateTab = "jobs" | "company" | "profile" | "copilot";

interface CandidateContextType {
  profile: CandidateProfile;
  setProfile: React.Dispatch<React.SetStateAction<CandidateProfile>>;
  profileDetails: CandidateProfileDetails;
  setProfileDetails: React.Dispatch<React.SetStateAction<CandidateProfileDetails>>;
  cvs: CandidateCv[];
  addCv: (input: CandidateCvInput) => CandidateCv | null;
  removeCv: (id: string) => void;
  renameCv: (id: string, label: string) => void;
  setDefaultCv: (id: string) => "updated" | "already" | "missing";
  appliedJobs: string[];
  savedJobs: string[];
  applyJob: (jobId: string) => void;
  saveJob: (jobId: string) => void;
  isApplied: (jobId: string) => boolean;
  isSaved: (jobId: string) => boolean;
  activeTab: CandidateTab;
  setActiveTab: (tab: CandidateTab) => void;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
}

const DEFAULT_PROFILE: CandidateProfile = {
  name: "Nguyen Van An (Alex)",
  shortName: "Nguyen",
  role: "Kỹ sư Hệ thống & Full-Stack Cấp cao",
  location: "TP. Hồ Chí Minh, Việt Nam",
  email: "an.nguyen@guardianwork.vn",
  phone: "+84 987 654 321",
  salaryExpectation: "150 triệu VND/tháng ($6,000/tháng) hoặc tương đương + Cổ phần",
  experienceYears: 8,
  gender: "Male",
  birthDate: "1996-10-15",
  avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Nguyen Van An (Alex)",
  cvFileName: "Nguyen_Van_An_CV_2026_Verified.pdf",
  cvStatus: "Vừa xong (đã trích xuất 42 kỹ năng & 4 vai trò)",
};

const DEFAULT_PROFILE_DETAILS: CandidateProfileDetails = {
  firstName: "",
  lastName: "",
  fullName: DEFAULT_PROFILE.name,
  phone: "0987654321",
  email: DEFAULT_PROFILE.email,
  avatarUrl: null,
  isPublic: true,
  skills: [
    "Go",
    "Kubernetes",
    "TypeScript",
    "React / Next.js",
    "Distributed Systems",
    "PostgreSQL",
    "Tailwind CSS",
    "SOC2 Security",
    "gRPC / REST",
  ],
  experience:
    "8 năm kinh nghiệm xây dựng hệ thống phân tán, điều phối vi dịch vụ và phát triển sản phẩm web.",
  experiences: [
    {
      title: "Senior Tech Lead & Systems Engineer",
      company: "GuardianWork VN • TP. Hồ Chí Minh",
      from: "2023-01",
      to: "",
      description:
        "Dẫn dắt kiến trúc bảo mật tuân thủ Bộ luật Lao động 2019, điều phối vi dịch vụ và triển khai hệ thống xác thực tức thì cho hơn 5.000 ứng viên.",
    },
    {
      title: "Lead Frontend Systems Architect",
      company: "Apex Cloud Services • Remote APAC",
      from: "2020-01",
      to: "2023-01",
      description:
        "Thiết kế design system token và tối ưu hóa thời gian tải ứng dụng web xuống dưới 0.8s cho hơn 50.000 người dùng hàng ngày.",
    },
  ],
  education: [
    {
      degree: "Cử nhân Khoa học Máy tính",
      school: "Đại học Quốc gia TP.HCM",
      from: "2017-09",
      to: "2021-06",
    },
  ],
};

const DEFAULT_CVS: CandidateCv[] = [
  {
    id: "cv-backend-2026",
    fileName: "Nguyen_Van_An_Backend_CV_2026.pdf",
    label: "CV Backend · Tiếng Việt",
    format: "PDF",
    mimeType: "application/pdf",
    sizeBytes: 862_208,
    uploadedAt: "2026-10-12T09:24:00.000Z",
    isDefault: true,
    usedInApplications: 4,
  },
  {
    id: "cv-fullstack-en-2026",
    fileName: "Nguyen_Van_An_Fullstack_CV_EN.pdf",
    label: "CV Full-stack · English",
    format: "PDF",
    mimeType: "application/pdf",
    sizeBytes: 1_258_291,
    uploadedAt: "2026-09-28T14:05:00.000Z",
    isDefault: false,
    usedInApplications: 2,
  },
  {
    id: "cv-techlead-2026",
    fileName: "Nguyen_Van_An_TechLead_CV.docx",
    label: "CV Tech Lead",
    format: "DOCX",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sizeBytes: 655_360,
    uploadedAt: "2026-08-16T08:40:00.000Z",
    isDefault: false,
    usedInApplications: 0,
  },
];

const CandidateContext = createContext<CandidateContextType>({
  profile: DEFAULT_PROFILE,
  setProfile: () => {},
  profileDetails: DEFAULT_PROFILE_DETAILS,
  setProfileDetails: () => {},
  cvs: [],
  addCv: () => null,
  removeCv: () => {},
  renameCv: () => {},
  setDefaultCv: () => "missing",
  appliedJobs: [],
  savedJobs: [],
  applyJob: () => {},
  saveJob: () => {},
  isApplied: () => false,
  isSaved: () => false,
  activeTab: "jobs",
  setActiveTab: () => {},
  selectedJobId: null,
  setSelectedJobId: () => {},
  selectedCompanyId: null,
  setSelectedCompanyId: () => {},
});

export function CandidateProvider({ children }: { children: ReactNode }) {
  const user = useAuthUser();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const serverProfile = useCandidateProfile(pathname.startsWith("/can"));
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [profileDetails, setProfileDetails] =
    useState<CandidateProfileDetails>(DEFAULT_PROFILE_DETAILS);
  const [cvs, setCvs] = useState<CandidateCv[]>(DEFAULT_CVS);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<CandidateTab>("jobs");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Applications to the sample listings outlive the tab, so the listing stack and
  // the application screen agree on what was already sent (UC-CAN-11, 8a).
  useEffect(() => {
    setAppliedJobs(readStoredApplications());
    const sync = (event: StorageEvent) => {
      if (event.key === APPLIED_JOBS_KEY) setAppliedJobs(readStoredApplications());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    setCvs((previous) => {
      for (const cv of previous) if (cv.previewUrl) URL.revokeObjectURL(cv.previewUrl);
      return DEFAULT_CVS;
    });
    setProfile(DEFAULT_PROFILE);
    setSavedJobs([]);
    setProfileDetails({
      ...DEFAULT_PROFILE_DETAILS,
      firstName: "",
      lastName: "",
      fullName: "",
      phone: "",
      email: "",
      skills: [],
      experience: "",
    });
  }, [user?.id]);

  const sharedProfile = React.useMemo(
    () => ({
      ...profileDetails,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      fullName:
        serverProfile.data?.fullName || (user ? `${user.firstName} ${user.lastName}`.trim() : ""),
      email: user?.email || "",
      ...(serverProfile.data
        ? {
            phone: serverProfile.data.phoneNumber || "",
            avatarUrl: serverProfile.data.avatarUrl,
            isPublic: serverProfile.data.isPublic,
            skills: serverProfile.data.skills,
            experience: serverProfile.data.experienceSummary || "",
          }
        : {}),
    }),
    [profileDetails, user, serverProfile.data],
  );
  const addCv = (input: CandidateCvInput) => {
    if (cvs.length >= MAX_CV_COUNT) return null;

    const nextCv: CandidateCv = {
      ...input,
      id:
        globalThis.crypto?.randomUUID?.() ??
        `cv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uploadedAt: new Date().toISOString(),
      isDefault: cvs.length === 0,
      usedInApplications: 0,
    };

    setCvs((prev) => [nextCv, ...prev]);
    return nextCv;
  };

  const removeCv = (id: string) => {
    const target = cvs.find((cv) => cv.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    setCvs((prev) => prev.filter((cv) => cv.id !== id));
  };

  const renameCv = (id: string, label: string) => {
    const nextLabel = label.trim();
    if (!nextLabel) return;
    setCvs((prev) => prev.map((cv) => (cv.id === id ? { ...cv, label: nextLabel } : cv)));
  };

  const setDefaultCv = (id: string) => {
    const target = cvs.find((cv) => cv.id === id);
    if (!target) return "missing";
    if (target.isDefault) return "already";

    setCvs((prev) => prev.map((cv) => ({ ...cv, isDefault: cv.id === id })));
    return "updated";
  };

  const applyJob = (jobId: string) => {
    setAppliedJobs((prev) => {
      if (prev.includes(jobId)) return prev;
      const next = [...prev, jobId];
      persistApplications(next);
      return next;
    });
  };

  const saveJob = (jobId: string) => {
    setSavedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId],
    );
  };

  const isApplied = (jobId: string) => appliedJobs.includes(jobId);
  const isSaved = (jobId: string) => savedJobs.includes(jobId);

  return (
    <CandidateContext.Provider
      value={{
        profile: {
          ...profile,
          name: sharedProfile.fullName,
          shortName: sharedProfile.firstName,
          email: sharedProfile.email,
          phone: sharedProfile.phone,
        },
        setProfile,
        profileDetails: sharedProfile,
        setProfileDetails,
        cvs,
        addCv,
        removeCv,
        renameCv,
        setDefaultCv,
        appliedJobs,
        savedJobs,
        applyJob,
        saveJob,
        isApplied,
        isSaved,
        activeTab,
        setActiveTab,
        selectedJobId,
        setSelectedJobId,
        selectedCompanyId,
        setSelectedCompanyId,
      }}
    >
      {children}
    </CandidateContext.Provider>
  );
}

export function useCandidate() {
  return useContext(CandidateContext);
}
