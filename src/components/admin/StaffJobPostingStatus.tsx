import { useStaffJobPublication } from "@/hooks/useStaffJobPublication";
import { staffJobStatusLabels } from "@/lib/staff-job-copy";
import type { JobStatus } from "@/services/jobs";
import { StaffStatusBadge, type StaffStatusTone } from "./StaffStatusBadge";

const tones: Record<JobStatus, StaffStatusTone> = {
  DRAFT: "neutral",
  PUBLISHED: "verified",
  PAUSED: "pending",
  SUSPENDED: "rejected",
  CLOSED: "neutral",
  EXPIRED: "neutral",
};

export function StaffJobPostingStatus({ scope, jobId }: { scope: string; jobId: number }) {
  const publication = useStaffJobPublication(scope, jobId);
  return <StaffJobPostingStatusBadge publication={publication} />;
}

export function StaffJobPostingStatusBadge({
  publication,
}: {
  publication: ReturnType<typeof useStaffJobPublication>;
}) {
  const status = publication.data?.publicationStatus;
  // Never present an old success state as current after a refresh fails.
  const known = !publication.isError && !publication.isFetching && status;
  return (
    <StaffStatusBadge
      className="staff-job-posting-status"
      tone={known ? tones[known] : "neutral"}
      icon
    >
      {publication.isFetching
        ? "Đang kiểm tra…"
        : known
          ? known === "PUBLISHED"
            ? "Đang công khai"
            : staffJobStatusLabels[known]
          : "Chưa xác định"}
    </StaffStatusBadge>
  );
}
