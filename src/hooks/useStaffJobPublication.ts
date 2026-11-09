import { useQuery } from "@tanstack/react-query";
import { inspectStaffJobPublication } from "@/services/staffJobs";

/** One posting status shared by queue rows, the detail heading and publication actions. */
export function useStaffJobPublication(scope: string, jobId?: number) {
  return useQuery({
    queryKey: ["staff-job-publication", scope, jobId],
    queryFn: () => inspectStaffJobPublication(jobId!),
    enabled: jobId !== undefined,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
}
