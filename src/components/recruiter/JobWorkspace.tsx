import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useBlocker } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Eye,
  FileText,
  History,
  Pause,
  Play,
  RotateCw,
  Save,
  Send,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
  changeJobStatus,
  createJob,
  deriveJob,
  jobError,
  jobHistory,
  jobStatusLabels,
  latestJobRevision,
  previewJob,
  revisionLabels,
  saveJob,
  submitJob,
  withdrawJob,
  type Job,
  type JobContent,
  type JobPreview,
  type RevisionHistory,
} from "@/services/jobs";
import { JobContentEditor, JobContentView } from "./JobContentEditor";
import { formatJobDate, textSections } from "@/lib/job-content";
import { JobResponsibility } from "./JobResponsibility";

type View = "edit" | "preview" | "published" | "history";
const fieldLabels: Record<string, string> = {
  title: "Chức danh",
  location: "Địa điểm",
  employmentType: "Loại công việc",
  workArrangement: "Hình thức làm việc",
  deadline: "Hạn ứng tuyển",
  headcount: "Số lượng tuyển",
  compensation: "Mức lương",
  responsibility: "Người phụ trách",
  company: "Xác thực công ty",
  job: "Trạng thái tin",
  screeningQuestions: "Câu hỏi sàng lọc",
  ...Object.fromEntries(textSections.map(([key, label]) => [key, label])),
};
function issueLabel(field: string, code: string) {
  const key = field.replace(/^content\./, "").split(/[.[]/)[0];
  const reason: Record<string, string> = {
    REQUIRED: "cần bổ sung",
    DEADLINE_PASSED: "phải ở tương lai",
    RANGE_INVALID: "khoảng lương chưa hợp lệ",
    WHOLE_NUMBER_REQUIRED: "lương VND phải là số nguyên",
    NOT_ALLOWED: "có thông tin không phù hợp với lựa chọn hiện tại",
    AT_LEAST_TWO_OPTIONS: "cần ít nhất hai đáp án",
    COMPANY_NOT_VERIFIED: "công ty chưa được xác thực",
    COMPANY_SUSPENDED: "công ty đang bị tạm ngưng",
    RESPONSIBILITY_REQUIRED: "cần được phân công",
    TERMINAL_STATE: "tin đã đóng hoặc hết hạn",
  };
  return `${fieldLabels[key] ?? field}: ${reason[code] ?? "cần kiểm tra lại"}.`;
}
async function findPublished(job: Job) {
  for (let page = 0; ; page++) {
    const result = await jobHistory(job.id, page, 100);
    const published = result.content.find((revision) => revision.id === job.publishedRevisionId);
    if (published) return published;
    if (page + 1 >= result.totalPages) throw new Error("Published revision unavailable");
  }
}
export function JobWorkspace({
  initialJob,
  scope,
  owner,
  onBack,
  onCreated,
  onReload,
}: {
  initialJob: Job | null;
  scope: string;
  owner: boolean;
  onBack: () => void;
  onCreated?: (job: Job) => void;
  onReload?: () => void;
}) {
  const queryClient = useQueryClient();
  const [job, setJob] = useState(initialJob);
  const [content, setContent] = useState<JobContent>(initialJob?.workingRevision?.content ?? {});
  const savedContent = useRef(JSON.stringify(content));
  const dirty = JSON.stringify(content) !== savedContent.current;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const [view, setView] = useState<View>(
    !initialJob || initialJob.availableActions.includes("SAVE_DRAFT") ? "edit" : "history",
  );
  const [preview, setPreview] = useState<JobPreview | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const latest = useQuery({
    queryKey: ["job-latest-revision", scope, job?.id, job?.version],
    queryFn: () => latestJobRevision(job!.id),
    enabled: Boolean(job && !job.workingRevision),
    retry: false,
  });
  const busyRef = useRef(false);
  const [confirmation, setConfirmation] = useState<"close" | "withdraw" | "reload" | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const blocker = useBlocker({
    shouldBlockFn: () => busyRef.current || dirtyRef.current,
    enableBeforeUnload: () => busyRef.current || dirtyRef.current,
    withResolver: true,
  });
  const editable = !job || job.availableActions.includes("SAVE_DRAFT");
  const can = (action: string) => job?.availableActions.includes(action);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["publishing-jobs", scope] });
    void queryClient.invalidateQueries({ queryKey: ["job-latest-revision", scope] });
    void queryClient.invalidateQueries({ queryKey: ["job-history", scope] });
  };
  const accept = (updated: Job) => {
    setJob(updated);
    setPreview(null);
    invalidate();
    if (view === "preview")
      setView(updated.workingRevision?.state === "DRAFT" ? "edit" : "history");
    // Assignment/lifecycle responses must not replace unsaved text.
  };
  const run = async (operation: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
    } catch (cause) {
      setError(jobError(cause));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const persist = async () => {
    const updated = job ? await saveJob(job, content) : await createJob(content);
    accept(updated);
    const saved = updated.workingRevision?.content ?? content;
    setContent(saved);
    savedContent.current = JSON.stringify(saved);
    dirtyRef.current = false;
    return updated;
  };
  const save = () =>
    run(async () => {
      const updated = await persist();
      setNotice("Đã lưu bản nháp.");
      if (!job) {
        busyRef.current = false;
        onCreated?.(updated);
      }
    });
  const showPreview = () =>
    run(async () => {
      // Always preview the exact persisted revision, with server validation and versions.
      const updated = dirty || !job ? await persist() : job;
      const result = await previewJob(updated.id);
      setPreview(result);
      setView("preview");
      headingRef.current?.focus();
    });
  const reload = () => {
    setConfirmation(null);
    dirtyRef.current = false;
    onReload?.();
  };
  const changeView = (next: View) => {
    setView(next);
    headingRef.current?.focus();
  };
  return (
    <>
      <button className="jp-back" onClick={onBack}>
        <ArrowLeft size={17} aria-hidden="true" />
        Quay lại danh sách
      </button>
      <header className="jp-page-header">
        <div>
          <h1 ref={headingRef} tabIndex={-1}>
            {job
              ? content.title || latest.data?.content.title || `Tin tuyển dụng #${job.id}`
              : "Tạo tin tuyển dụng"}
          </h1>
          <p>
            {job
              ? `Tin #${job.id} · Cập nhật ${formatJobDate(job.updatedAt)}`
              : "Soạn nội dung, xem trước và gửi tin để xét duyệt."}
          </p>
        </div>
        {job && (
          <button
            className="jp-button"
            disabled={busy}
            onClick={() => (dirty ? setConfirmation("reload") : reload())}
          >
            <RotateCw size={16} aria-hidden="true" />
            Tải dữ liệu mới
          </button>
        )}
      </header>
      {job && (
        <div className="jp-status-strip">
          <span className={`jp-badge jp-status-${job.status.toLowerCase()}`}>
            {jobStatusLabels[job.status]}
          </span>
          {job.workingRevision && (
            <span className="jp-badge">
              {revisionLabels[job.workingRevision.state]} · v{job.workingRevision.revisionNumber}
            </span>
          )}
          {job.publishedRevisionId && (
            <span className="jp-hint">Bản đã duyệt và bản sửa được lưu riêng.</span>
          )}
        </div>
      )}
      {error && !confirmation && (
        <div className="jp-feedback jp-error" role="alert">
          <strong>Chưa hoàn tất thao tác</strong>
          <p>{error}</p>
        </div>
      )}
      {notice && (
        <p className="jp-feedback jp-success" role="status">
          <Check size={17} aria-hidden="true" />
          {notice}
        </p>
      )}
      {job?.workingRevision?.state === "PENDING_REVIEW" && (
        <div className="jp-feedback">
          <strong>Bản v{job.workingRevision.revisionNumber} đang chờ duyệt</strong>
          <p>
            {job.publishedRevisionId
              ? "Bản đang công khai không bị thay thế cho đến khi bản sửa được duyệt."
              : "Tin chưa hiển thị cho ứng viên. Bạn có thể rút bản gửi nếu cần thay đổi."}
          </p>
        </div>
      )}
      <div className="jp-workspace-grid">
        <div className="jp-workspace-main">
          <nav className="jp-tabs" aria-label="Nội dung tin tuyển dụng">
            {editable && (
              <button
                aria-current={view === "edit" ? "page" : undefined}
                onClick={() => changeView("edit")}
              >
                <FileText size={17} aria-hidden="true" />
                Soạn tin
              </button>
            )}
            {preview && (
              <button
                aria-current={view === "preview" ? "page" : undefined}
                onClick={() => changeView("preview")}
              >
                <Eye size={17} aria-hidden="true" />
                Xem trước
              </button>
            )}
            {job?.publishedRevisionId && (
              <button
                aria-current={view === "published" ? "page" : undefined}
                onClick={() => changeView("published")}
              >
                <Eye size={17} aria-hidden="true" />
                Bản đã duyệt
              </button>
            )}
            {job && (
              <button
                aria-current={view === "history" ? "page" : undefined}
                onClick={() => changeView("history")}
              >
                <History size={17} aria-hidden="true" />
                Lịch sử xét duyệt
              </button>
            )}
          </nav>
          {view === "edit" && editable && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <JobContentEditor
                content={content}
                onChange={(next) => {
                  setContent(next);
                  setPreview(null);
                }}
                disabled={busy}
              />
              <div className="jp-editor-footer">
                <p role="status">
                  {busy
                    ? "Đang xử lý…"
                    : dirty
                      ? "Có thay đổi chưa lưu"
                      : job
                        ? "Bản nháp đã được lưu"
                        : "Tin chưa được lưu"}
                </p>
                <div className="jp-actions">
                  <button type="submit" className="jp-button" disabled={busy}>
                    <Save size={16} aria-hidden="true" />
                    Lưu bản nháp
                  </button>
                  {job && (
                    <button
                      type="button"
                      className="jp-button jp-primary"
                      disabled={busy}
                      onClick={(event) => {
                        if (event.currentTarget.form?.reportValidity()) void showPreview();
                      }}
                    >
                      <Eye size={16} aria-hidden="true" />
                      Lưu và xem trước
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
          {view === "preview" && preview && (
            <div className="jp-preview">
              <div className="jp-preview-heading">
                <h3>Xem trước bản gửi duyệt</h3>
                <p>Kiểm tra nội dung và xác nhận gửi để bộ phận xét duyệt xử lý.</p>
              </div>
              {!preview.submissionEligible && (
                <div className="jp-feedback jp-warning" role="alert">
                  <strong>Cần hoàn tất trước khi gửi</strong>
                  <ul>
                    {preview.validationIssues.map((issue, index) => (
                      <li key={`${issue.field}:${index}`}>{issueLabel(issue.field, issue.code)}</li>
                    ))}
                  </ul>
                  <p>Quay lại soạn tin hoặc cập nhật người phụ trách rồi xem trước lần nữa.</p>
                  <Link to="/rec/verification">Xem trạng thái xác thực công ty</Link>
                </div>
              )}
              <JobContentView content={preview.content} />
              <div className="jp-editor-footer">
                <button className="jp-button" onClick={() => changeView("edit")}>
                  Tiếp tục chỉnh sửa
                </button>
                <button
                  className="jp-button jp-primary"
                  disabled={busy || !preview.submissionEligible}
                  onClick={() => {
                    void run(async () => {
                      const updated = await submitJob(job!, preview);
                      accept(updated);
                      setView("history");
                      setNotice("Đã gửi bản tin để xét duyệt.");
                    });
                  }}
                >
                  <Send size={16} aria-hidden="true" />
                  Xác nhận gửi duyệt
                </button>
              </div>
            </div>
          )}
          {view === "published" && job && <PublishedContent job={job} scope={scope} />}
          {view === "history" && job && <JobReviewHistory job={job} scope={scope} />}
        </div>
        <aside className="jp-workspace-side" aria-label="Quản lý tin">
          <section className="jp-side-section">
            <h3>
              <Users size={18} aria-hidden="true" />
              Người phụ trách
            </h3>
            {job ? (
              <JobResponsibility
                job={job}
                owner={owner}
                scope={scope}
                busy={busy}
                onChange={accept}
                run={run}
              />
            ) : (
              <p>
                Lưu bản nháp để quản lý phân công.{" "}
                {owner
                  ? "Bạn sẽ được ghi nhận là chủ sở hữu phụ trách tin."
                  : "Bạn sẽ được tự động phân công vào tin do mình tạo."}
              </p>
            )}
          </section>
          <section className="jp-side-section">
            <h3>Xuất bản và cập nhật</h3>
            <p>Thay đổi nội dung cần được xét duyệt trước khi xuất bản.</p>
            {job?.approvedDeadline && (
              <p>
                Hạn đã duyệt: <strong>{formatJobDate(job.approvedDeadline)}</strong>
              </p>
            )}
            {can("CREATE_DRAFT") && (
              <button
                className="jp-button jp-primary"
                disabled={busy}
                onClick={() => {
                  void run(async () => {
                    const updated = await deriveJob(job!);
                    accept(updated);
                    const next = updated.workingRevision!.content;
                    setContent(next);
                    savedContent.current = JSON.stringify(next);
                    setView("edit");
                    setNotice("Đã tạo bản nháp mới từ bản gần nhất.");
                  });
                }}
              >
                Tạo bản chỉnh sửa
              </button>
            )}
            {can("WITHDRAW") && (
              <button
                className="jp-button"
                disabled={busy}
                onClick={() => setConfirmation("withdraw")}
              >
                Rút bản gửi duyệt
              </button>
            )}
            {can("PAUSE") && (
              <button
                className="jp-button"
                disabled={busy || dirty}
                onClick={() => {
                  void run(async () => {
                    accept(await changeJobStatus(job!, "pause"));
                    setNotice("Đã tạm dừng tin tuyển dụng.");
                  });
                }}
              >
                <Pause size={16} aria-hidden="true" />
                Tạm dừng tin
              </button>
            )}
            {can("RESUME") && (
              <button
                className="jp-button"
                disabled={busy || dirty}
                onClick={() => {
                  void run(async () => {
                    accept(await changeJobStatus(job!, "resume"));
                    setNotice("Tin đã được đăng trở lại.");
                  });
                }}
              >
                <Play size={16} aria-hidden="true" />
                Tiếp tục đăng tin
              </button>
            )}
            {can("CLOSE") && (
              <button
                className="jp-button jp-danger"
                disabled={busy || dirty}
                onClick={() => setConfirmation("close")}
              >
                Đóng tin tuyển dụng
              </button>
            )}
            {dirty && job && (
              <p className="jp-hint">Lưu nội dung trước khi thay đổi trạng thái xuất bản.</p>
            )}
            {job && ["CLOSED", "EXPIRED"].includes(job.status) && (
              <p>Tin đã kết thúc. Không thể tiếp tục đăng hoặc tạo bản chỉnh sửa.</p>
            )}
          </section>
        </aside>
      </div>
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {confirmation === "close"
              ? "Đóng tin tuyển dụng?"
              : confirmation === "withdraw"
                ? "Rút bản đang chờ duyệt?"
                : "Tải lại và bỏ thay đổi chưa lưu?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirmation === "close"
              ? "Tin sẽ ngừng công khai và không thể mở lại. Các bản sửa cũng không thể tiếp tục gửi duyệt."
              : confirmation === "withdraw"
                ? "Bản gửi sẽ được lưu trong lịch sử. Bạn cần tạo bản chỉnh sửa mới để gửi duyệt lại."
                : "Nội dung đang nhập sẽ được thay thế bằng dữ liệu mới từ máy chủ."}
          </AlertDialogDescription>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Quay lại</AlertDialogCancel>
            <button
              className="jp-button jp-primary"
              disabled={busy}
              onClick={() => {
                if (confirmation === "reload") {
                  reload();
                  return;
                }
                void run(async () => {
                  const updated =
                    confirmation === "close"
                      ? await changeJobStatus(job!, "close")
                      : await withdrawJob(job!);
                  accept(updated);
                  setView("history");
                  setConfirmation(null);
                  setNotice(
                    confirmation === "close" ? "Đã đóng tin tuyển dụng." : "Đã rút bản gửi duyệt.",
                  );
                });
              }}
            >
              {busy
                ? "Đang xử lý…"
                : confirmation === "close"
                  ? "Xác nhận đóng tin"
                  : confirmation === "withdraw"
                    ? "Xác nhận rút bản gửi"
                    : "Tải lại dữ liệu"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {busy ? "Đang xử lý yêu cầu" : "Rời trang khi chưa lưu?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {busy
              ? "Vui lòng chờ yêu cầu hoàn tất trước khi rời trang."
              : "Các thay đổi chưa lưu sẽ bị mất. Bạn có thể ở lại để lưu bản nháp."}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Ở lại</AlertDialogCancel>
            {!busy && (
              <button className="jp-button jp-primary" onClick={() => blocker.proceed?.()}>
                Bỏ thay đổi và rời trang
              </button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function PublishedContent({ job, scope }: { job: Job; scope: string }) {
  const published = useQuery({
    queryKey: ["job-published", scope, job.id, job.publishedRevisionId],
    queryFn: () => findPublished(job),
    retry: false,
  });
  return (
    <div className="jp-preview">
      <div className="jp-preview-heading">
        <h3>Bản đã duyệt</h3>
        <p>
          {job.status === "PUBLISHED"
            ? "Đây là nội dung đang công khai cho ứng viên."
            : "Đây là bản được duyệt gần nhất. Tin hiện không công khai."}
        </p>
      </div>
      {published.isPending ? (
        <p className="jp-loading" role="status">
          Đang tải nội dung…
        </p>
      ) : published.isError ? (
        <div className="jp-feedback jp-error">
          <p role="alert">Không thể tải bản đã duyệt.</p>
          <button
            className="jp-button"
            onClick={() => {
              void published.refetch();
            }}
          >
            Thử lại
          </button>
        </div>
      ) : (
        <JobContentView content={published.data.content} />
      )}
    </div>
  );
}
function JobReviewHistory({ job, scope }: { job: Job; scope: string }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<RevisionHistory | null>(null);
  const history = useQuery({
    queryKey: ["job-history", scope, job.id, job.version, page],
    queryFn: () => jobHistory(job.id, page),
    retry: false,
  });
  return (
    <section className="jp-history">
      <div className="jp-preview-heading">
        <h3>Lịch sử xét duyệt</h3>
        <p>
          Các phiên bản được lưu theo thứ tự tạo. Chọn một bản để đọc nội dung và kết quả xét duyệt.
        </p>
      </div>
      {history.isPending ? (
        <p className="jp-loading" role="status">
          Đang tải lịch sử…
        </p>
      ) : history.isError ? (
        <div className="jp-feedback jp-error">
          <p role="alert">{jobError(history.error)}</p>
          <button
            className="jp-button"
            onClick={() => {
              void history.refetch();
            }}
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <ol className="jp-history-list">
            {history.data.content.map((revision) => (
              <li key={revision.id}>
                <div className="jp-row">
                  <button
                    className="jp-history-link"
                    aria-pressed={selected?.id === revision.id}
                    onClick={() => setSelected(selected?.id === revision.id ? null : revision)}
                  >
                    Bản v{revision.revisionNumber} · {revision.content.title || "Chưa có chức danh"}
                  </button>
                  <span className="jp-badge">{revisionLabels[revision.state]}</span>
                </div>
                <p>
                  Tạo {formatJobDate(revision.createdAt)}
                  {revision.submittedAt && ` · Gửi ${formatJobDate(revision.submittedAt)}`}
                  {revision.decidedAt && ` · Xét duyệt ${formatJobDate(revision.decidedAt)}`}
                  {revision.withdrawnAt && ` · Rút ${formatJobDate(revision.withdrawnAt)}`}
                </p>
                {revision.id === job.publishedRevisionId && (
                  <p className="jp-hint">Bản được duyệt đang áp dụng cho tin.</p>
                )}
                {revision.rejectionReason && (
                  <p className="jp-rejection">
                    <strong>Lý do từ chối:</strong> {revision.rejectionReason}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <AdminPagination
            page={page}
            pageSize={20}
            totalItems={history.data.totalElements}
            onPageChange={(next) => {
              setPage(next);
              setSelected(null);
            }}
            itemLabel="phiên bản"
          />
          {selected && (
            <div className="jp-history-content">
              <div className="jp-row">
                <h3>Nội dung bản v{selected.revisionNumber}</h3>
                <button className="jp-button" onClick={() => setSelected(null)}>
                  Đóng nội dung
                </button>
              </div>
              <JobContentView content={selected.content} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
