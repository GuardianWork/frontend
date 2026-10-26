/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, type ReactNode } from "react";

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
}

export interface CandidateProfileDetails {
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

export type CandidateTab = "jobs" | "company" | "profile" | "copilot";

interface CandidateContextType {
  profile: CandidateProfile;
  setProfile: React.Dispatch<React.SetStateAction<CandidateProfile>>;
  profileDetails: CandidateProfileDetails;
  setProfileDetails: React.Dispatch<React.SetStateAction<CandidateProfileDetails>>;
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

const CandidateContext = createContext<CandidateContextType>({
  profile: DEFAULT_PROFILE,
  setProfile: () => {},
  profileDetails: DEFAULT_PROFILE_DETAILS,
  setProfileDetails: () => {},
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
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [profileDetails, setProfileDetails] =
    useState<CandidateProfileDetails>(DEFAULT_PROFILE_DETAILS);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<CandidateTab>("jobs");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const applyJob = (jobId: string) => {
    if (!appliedJobs.includes(jobId)) {
      setAppliedJobs((prev) => [...prev, jobId]);
    }
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
        profile,
        setProfile,
        profileDetails,
        setProfileDetails,
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
