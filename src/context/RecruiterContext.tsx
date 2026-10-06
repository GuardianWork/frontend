import React, { createContext, useContext, useState, type ReactNode } from "react";

export type RecruiterTab = "dashboard" | "jobs" | "candidates" | "pipeline";

export interface RecruiterJob {
  id: string;
  title: string;
  department: string;
  location: string;
  salaryRange: string;
  description: string;
  status: "active" | "draft";
  complianceScore: number;
  applicantsCount: number;
}

export interface RecruiterCandidate {
  id: string;
  role: string;
  location: string;
  description: string;
  fitScore: "STRONG FIT" | "GOOD FIT" | "MATCH";
  matchRate: number;
  stage: "Applied" | "Audited" | "Interview" | "Offer";
}

interface RecruiterContextType {
  activeTab: RecruiterTab;
  setActiveTab: (tab: RecruiterTab) => void;
  jobs: RecruiterJob[];
  candidates: RecruiterCandidate[];
  isPostModalOpen: boolean;
  setIsPostModalOpen: (open: boolean) => void;
  postJob: (job: Omit<RecruiterJob, "id" | "complianceScore" | "applicantsCount">) => void;
  updateCandidateStage: (candidateId: string, stage: RecruiterCandidate["stage"]) => void;
}

const INITIAL_JOBS: RecruiterJob[] = [
  {
    id: "job-1",
    title: "Kỹ sư Nền tảng Go / Kubernetes Cấp cao",
    department: "Kỹ thuật Hạ tầng",
    location: "TP. Hồ Chí Minh, Việt Nam (Quận 3)",
    salaryRange: "60.000.000 - 85.000.000 VND / tháng",
    description: "Thiết kế và tối ưu hạ tầng Kubernetes cho hệ thống giao dịch tài chính.",
    status: "active",
    complianceScore: 100,
    applicantsCount: 14,
  },
  {
    id: "job-2",
    title: "Lập trình viên Di động React Native",
    department: "Kỹ thuật Di động",
    location: "Hà Nội, Việt Nam (Cầu Giấy)",
    salaryRange: "45.000.000 - 60.000.000 VND / tháng",
    description: "Xây dựng giao diện ví điện tử fintech với xác thực sinh trắc học.",
    status: "active",
    complianceScore: 100,
    applicantsCount: 9,
  },
  {
    id: "job-3",
    title: "Kiến trúc sư Giải pháp AI / Python",
    department: "Trí tuệ Nhân tạo",
    location: "Đà Nẵng, Việt Nam (Từ xa / Hybrid)",
    salaryRange: "70.000.000 - 100.000.000 VND / tháng",
    description: "Thiết kế LLM pipeline và RAG vector retrieval tốc độ cao.",
    status: "active",
    complianceScore: 98,
    applicantsCount: 6,
  },
  {
    id: "job-4",
    title: "Kỹ sư Frontend Trưởng Cấp cao",
    department: "Kỹ thuật",
    location: "TP. Hồ Chí Minh, Việt Nam (Quận 1)",
    salaryRange: "80.000.000 - 110.000.000 VND / tháng",
    description: "Xây dựng design token và kiến trúc web app hiệu năng cao.",
    status: "active",
    complianceScore: 100,
    applicantsCount: 12,
  },
  {
    id: "job-5",
    title: "Kiến trúc sư Hạ tầng & DevOps",
    department: "Kỹ thuật Nền tảng",
    location: "Hà Nội, Việt Nam (Cầu Giấy)",
    salaryRange: "90.000.000 - 125.000.000 VND / tháng",
    description: "Vận hành hạ tầng đám mây lai và quy chuẩn SOC2.",
    status: "draft",
    complianceScore: 95,
    applicantsCount: 0,
  },
];

const INITIAL_CANDIDATES: RecruiterCandidate[] = [
  {
    id: "sc-1",
    role: "Kỹ sư Hệ thống Cấp cao",
    location: "TP. Hồ Chí Minh, Việt Nam",
    description:
      "6 năm quản lý hạ tầng Kubernetes. Chuyên sâu về cổng lưu lượng lớn, vi dịch vụ viết bằng Go và giám sát hệ thống bằng Prometheus.",
    fitScore: "STRONG FIT",
    matchRate: 98,
    stage: "Interview",
  },
  {
    id: "sc-2",
    role: "Kỹ sư Backend Cấp cao (Go)",
    location: "TP. Hồ Chí Minh, Việt Nam",
    description:
      "5 năm kinh nghiệm xây dựng các cổng API an sâu bằng Go. Chuyên môn sâu về bộ nhớ đệm Redis, tối ưu hóa truy vấn PostgreSQL và tích hợp Kafka.",
    fitScore: "STRONG FIT",
    matchRate: 96,
    stage: "Audited",
  },
  {
    id: "sc-3",
    role: "Kỹ sư DevOps Nền tảng",
    location: "Hà Nội, Việt Nam",
    description:
      "Kỹ sư lập trình Go vững vàng với 4 năm tự động hóa hạ tầng bằng Ansible, Terraform và Docker Swarm.",
    fitScore: "GOOD FIT",
    matchRate: 89,
    stage: "Applied",
  },
  {
    id: "sc-4",
    role: "Kỹ sư Di động Cấp cao",
    location: "Hà Nội, Việt Nam",
    description:
      "5 năm xây dựng ứng dụng di động native và React Native. Chuyên gia tối ưu hóa hiệu năng UI và tích hợp ZaloPay.",
    fitScore: "STRONG FIT",
    matchRate: 95,
    stage: "Interview",
  },
  {
    id: "sc-5",
    role: "Kỹ sư React Native",
    location: "Hà Nội, Việt Nam",
    description:
      "3 năm kinh nghiệm phát triển ứng dụng di động đa nền tảng. Thành thạo TypeScript, Redux Toolkit và lưu trữ token bảo mật.",
    fitScore: "GOOD FIT",
    matchRate: 85,
    stage: "Applied",
  },
  {
    id: "sc-6",
    role: "Kỹ sư Frontend Cấp cao",
    location: "TP. Hồ Chí Minh, Việt Nam",
    description: "7 năm thiết kế kiến trúc React hiệu năng cao và hệ thống thiết kế web.",
    fitScore: "STRONG FIT",
    matchRate: 97,
    stage: "Offer",
  },
  {
    id: "sc-7",
    role: "Lập trình viên Frontend",
    location: "TP. Hồ Chí Minh, Việt Nam",
    description:
      "Chuyên gia React, Next.js và TypeScript. Từng xây dựng các widget bảng điều khiển thanh toán phức tạp.",
    fitScore: "MATCH",
    matchRate: 80,
    stage: "Applied",
  },
  {
    id: "sc-8",
    role: "Kỹ sư Hạ tầng",
    location: "Hà Nội, Việt Nam",
    description: "Chuyên về Kubernetes, tự động hóa đám mây và quản trị hệ thống bảo mật cao.",
    fitScore: "GOOD FIT",
    matchRate: 91,
    stage: "Audited",
  },
  {
    id: "sc-9",
    role: "Kỹ sư Full Stack",
    location: "TP. Hồ Chí Minh, Việt Nam",
    description:
      "6 năm xây dựng ứng dụng web từ đầu đến cuối bằng Node.js và React. Có kinh nghiệm tinh chỉnh hiệu năng cơ sở dữ liệu.",
    fitScore: "GOOD FIT",
    matchRate: 88,
    stage: "Applied",
  },
];

const RecruiterContext = createContext<RecruiterContextType>({
  activeTab: "dashboard",
  setActiveTab: () => {},
  jobs: INITIAL_JOBS,
  candidates: INITIAL_CANDIDATES,
  isPostModalOpen: false,
  setIsPostModalOpen: () => {},
  postJob: () => {},
  updateCandidateStage: () => {},
});

export function RecruiterProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<RecruiterTab>("dashboard");
  const [jobs, setJobs] = useState<RecruiterJob[]>(INITIAL_JOBS);
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>(INITIAL_CANDIDATES);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const postJob = (job: Omit<RecruiterJob, "id" | "complianceScore" | "applicantsCount">) => {
    const newJob: RecruiterJob = {
      ...job,
      id: `job-${jobs.length + 1}`,
      complianceScore: 100,
      applicantsCount: 0,
    };
    setJobs((prev) => [newJob, ...prev]);
  };

  const updateCandidateStage = (candidateId: string, stage: RecruiterCandidate["stage"]) => {
    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, stage } : c)));
  };

  return (
    <RecruiterContext.Provider
      value={{
        activeTab,
        setActiveTab,
        jobs,
        candidates,
        isPostModalOpen,
        setIsPostModalOpen,
        postJob,
        updateCandidateStage,
      }}
    >
      {children}
    </RecruiterContext.Provider>
  );
}

export function useRecruiter() {
  return useContext(RecruiterContext);
}
