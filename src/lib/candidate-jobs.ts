import { JOBS, type JobItem } from "@/lib/job-listings";
import { jobModerationStatus, type CompanyWorkspace } from "@/services/companyMembers";
import type { CompanyVerificationRecord } from "@/services/companyVerification";

/**
 * Listings the candidate may apply to: the verified company's published jobs
 * first, then the static sample set. Kept in one place so the browser and the
 * application screen always agree on id, title and salary.
 */
export function buildCandidateJobs(
  workspace: CompanyWorkspace,
  company: CompanyVerificationRecord | null,
): { jobs: JobItem[]; companyJobs: JobItem[] } {
  const companyJobs: JobItem[] = workspace.jobs
    .filter(
      (j) =>
        j.status === "Active" && jobModerationStatus(j) === "approved" && j.visibility !== "HIDDEN",
    )
    .map((j) => ({
      id: j.id,
      title: j.title,
      company: company?.name || "",
      location: j.location,
      salaryRange: j.salary,
      badge: "Công ty đã xác thực",
      badgeTone: "primary",
      time: new Date(j.created).toLocaleDateString("vi-VN"),
      department: j.department,
      matchScore: 0,
      description: `Vị trí ${j.title} thuộc phòng ban ${j.department}.`,
      requirements: [],
      statutoryBase: "Chưa đánh giá tin tuyển dụng",
      statutoryNote:
        "Công ty đã xác thực thông tin doanh nghiệp. Vui lòng liên hệ nhà tuyển dụng để nhận mô tả công việc chi tiết.",
      suggestedRevision: "Trao đổi trực tiếp với nhà tuyển dụng về điều kiện làm việc.",
    }));

  return { jobs: [...companyJobs, ...JOBS], companyJobs };
}

/** Location with the "(district)" suffix dropped, as in the listing stack. */
export function shortJobLocation(location: string) {
  return location.split("(")[0].trim();
}
