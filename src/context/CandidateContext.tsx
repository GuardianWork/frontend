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

export type CandidateTab = "jobs" | "company" | "profile" | "copilot";

interface CandidateContextType {
  profile: CandidateProfile;
  setProfile: React.Dispatch<React.SetStateAction<CandidateProfile>>;
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

const CandidateContext = createContext<CandidateContextType>({
  profile: DEFAULT_PROFILE,
  setProfile: () => {},
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
