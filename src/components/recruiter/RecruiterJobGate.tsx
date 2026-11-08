import { useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldOff } from "lucide-react";
import { readRecruiterJobAccess } from "@/services/recruiterJobAccess";

export function SuspendedJobNotice({ headingLevel = 1 }: { headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="jp-suspended-notice" role="status">
      <ShieldOff size={24} aria-hidden="true" />
      <div>
        <Heading>Tin tuyển dụng đã bị đình chỉ</Heading>
        <p>
          Tin không còn hiển thị cho ứng viên. Thông tin tin tuyển dụng chỉ được xem; các thao tác
          chỉnh sửa, đăng tin, quản lý đơn ứng tuyển, xem và tải CV đều bị khóa.
        </p>
      </div>
    </section>
  );
}

/** Do not mount content/evidence readers until current job access is confirmed. */
export function RecruiterJobGate({
  jobId,
  scope,
  children,
}: {
  jobId: number;
  scope: string;
  children: ReactNode;
}) {
  const client = useQueryClient();
  const access = useQuery({
    queryKey: ["recruiter-job-access", scope, jobId],
    queryFn: ({ signal }) => readRecruiterJobAccess(jobId, signal),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
  const suspended = access.data?.status === "SUSPENDED";
  useEffect(() => {
    if (!suspended) return;
    void client.cancelQueries({ queryKey: ["recruiter-application-detail", scope, jobId] });
    client.removeQueries({
      queryKey: ["recruiter-application-detail", scope, jobId],
      type: "inactive",
    });
    client.removeQueries({ queryKey: ["recruiter-applications", scope, jobId], type: "inactive" });
  }, [suspended, client, scope, jobId]);
  if (suspended) return <SuspendedJobNotice />;
  if (access.isError)
    return (
      <p role="alert" className="jp-feedback jp-error">
        Không thể xác nhận quyền truy cập tin tuyển dụng. Nội dung và hồ sơ ứng viên hiện không khả
        dụng.
      </p>
    );
  if (!access.data)
    return (
      <p role="status" className="jp-loading">
        Đang kiểm tra tin tuyển dụng…
      </p>
    );
  return children;
}
