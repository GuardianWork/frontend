import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  jobError,
  listJobMembers,
  setJobAssignment,
  setOwnerResponsibility,
  type Job,
} from "@/services/jobs";

export function JobResponsibility({
  job,
  scope,
  owner,
  busy,
  onChange,
  run,
}: {
  job: Job;
  scope: string;
  owner: boolean;
  busy: boolean;
  onChange: (job: Job) => void;
  run: (operation: () => Promise<void>) => Promise<void>;
}) {
  const [page, setPage] = useState(0);
  const members = useQuery({
    queryKey: ["job-members", scope, page],
    queryFn: () => listJobMembers(page),
    enabled: owner,
    retry: false,
  });
  return (
    <>
      {job.needsReassignment && (
        <p className="jp-feedback jp-warning" role="status">
          Chưa có người phụ trách. Cần phân công trước khi gửi duyệt.
        </p>
      )}
      {owner ? (
        <>
          <label className="jp-check">
            <input
              type="checkbox"
              checked={job.ownerResponsible}
              disabled={busy}
              onChange={(event) => {
                const responsible = event.target.checked;
                void run(async () => onChange(await setOwnerResponsibility(job, responsible)));
              }}
            />
            Tôi chịu trách nhiệm với tư cách chủ sở hữu
          </label>
          <p className="jp-hint">
            {job.assignments.length} nhà tuyển dụng được phân công. Bỏ người phụ trách cuối cùng sẽ
            khiến tin cần phân công lại.
          </p>
          {members.isPending ? (
            <p role="status">Đang tải thành viên…</p>
          ) : members.isError ? (
            <div>
              <p role="alert">{jobError(members.error)}</p>
              <button
                className="jp-button"
                onClick={() => {
                  void members.refetch();
                }}
              >
                Tải lại thành viên
              </button>
            </div>
          ) : (
            <>
              <ul className="jp-members">
                {members.data.content
                  .filter(
                    (member) => member.status === "ACTIVE" && member.companyRole === "RECRUITER",
                  )
                  .map((member) => {
                    const assigned = job.assignments.some(
                      (assignment) =>
                        assignment.membershipId === member.membershipId &&
                        assignment.membershipJoinedAt === member.joinedAt,
                    );
                    return (
                      <li key={member.membershipId}>
                        <label className="jp-check">
                          <input
                            type="checkbox"
                            checked={assigned}
                            disabled={busy}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              void run(async () =>
                                onChange(await setJobAssignment(job, member.membershipId, checked)),
                              );
                            }}
                          />
                          <span>
                            <strong>
                              {member.firstName} {member.lastName}
                            </strong>
                            <small>{member.email}</small>
                          </span>
                        </label>
                      </li>
                    );
                  })}
              </ul>
              {!members.data.content.some((member) => member.companyRole === "RECRUITER") && (
                <p>Trang này chưa có nhà tuyển dụng đang hoạt động.</p>
              )}
              {members.data.totalPages > 1 && (
                <div className="jp-member-pages">
                  <button
                    className="jp-button"
                    disabled={page === 0 || busy}
                    onClick={() => setPage(page - 1)}
                  >
                    Trước
                  </button>
                  <span>
                    {page + 1}/{members.data.totalPages}
                  </span>
                  <button
                    className="jp-button"
                    disabled={page + 1 >= members.data.totalPages || busy}
                    onClick={() => setPage(page + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <p>
            {job.ownerResponsible
              ? "Chủ sở hữu công ty đang chịu trách nhiệm với tin này."
              : `${job.assignments.length} nhà tuyển dụng đang phụ trách tin này.`}
          </p>
        </>
      )}
    </>
  );
}
