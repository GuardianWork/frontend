/* Candidate CV management wired to the GuardianWork backend. */
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MAX_CV_COUNT, type CandidateCv as ContextCv } from "@/context/CandidateContext";
import { clearAuthSession } from "@/services/auth";
import {
  getCandidateCvs,
  getCvDownloadUrl,
  registerCv,
  requestCvUploadUrl,
  uploadToCloudinary,
  type CandidateCv,
} from "@/services/candidateCv";
import { ApiError } from "@/services/api";
import { formatCvDate, formatFileSize, validateCvFile } from "@/lib/cv-file";

type NoticeTone = "success" | "info" | "error";

type Phase = "idle" | "requesting" | "uploading" | "registering";

function redirectToLogin() {
  clearAuthSession();
  window.location.assign("/login?role=candidate");
}

function mapCvError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      redirectToLogin();
      return "Phiên đăng nhập đã hết hạn.";
    }
    switch (error.code) {
      case 40000:
        return "Vui lòng kiểm tra lại thông tin.";
      case 40020:
        return "Vui lòng xác nhận nội dung cảnh báo trước khi tải lên.";
      case 40021:
        return "Chỉ hỗ trợ tệp PDF, DOC hoặc DOCX tối đa 10 MB.";
      case 40022:
        return "Bạn đã đạt số lượng hồ sơ tối đa.";
      case 40023:
        return "Không thể xác minh tệp đã tải lên. Vui lòng thử lại.";
      case 40405:
        return "Không tìm thấy hồ sơ xin việc.";
      case 40902:
        return "Hồ sơ này đã được đăng ký.";
      case 50300:
        return "Dịch vụ lưu trữ tạm thời không khả dụng. Vui lòng thử lại sau.";
    }
    if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (error.status === 404) return "Không tìm thấy hồ sơ xin việc.";
    if (error.status === 409) return "Hồ sơ này đã được đăng ký.";
    if (error.status === 503)
      return "Dịch vụ lưu trữ tạm thời không khả dụng. Vui lòng thử lại sau.";
  }
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";
const primaryButton = `inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-accent px-5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hover active:bg-accent-deep disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-ink-3 ${focusRing}`;
const secondaryButton = `inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-rule bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper-2 active:bg-paper-3 ${focusRing}`;
const iconButton = `inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink active:bg-paper-3 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10 ${focusRing}`;

function detectFormat(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "pdf") return "PDF";
  if (extension === "doc") return "DOC";
  if (extension === "docx") return "DOCX";
  return "PDF";
}

export function CvManagerView() {
  const [cvs, setCvs] = useState<CandidateCv[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<number | null>(null);
  const abortRef = useRef(false);

  const busy = phase !== "idle";
  const atLimit = cvs.length >= MAX_CV_COUNT;

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      setCvs(await getCandidateCvs());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToLogin();
        return;
      }
      setLoadError(mapCvError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    return () => {
      if (progressRef.current) window.clearInterval(progressRef.current);
    };
  }, []);

  const resetUpload = () => {
    setConsent(false);
    setSelectedFile(null);
    setFileError("");
    setPhase("idle");
    setProgress(0);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadOpenChange = (open: boolean) => {
    if (!open && busy) return;
    if (!open) resetUpload();
    setUploadOpen(open);
  };

  const handleFilePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFileError("");
    setSelectedFile(null);
    const validationError = await validateCvFile(file);
    if (!validationError.ok) {
      setFileError(validationError.message);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setFileError("");
    setSelectedFile(null);
    const validationError = await validateCvFile(file);
    if (!validationError.ok) {
      setFileError(validationError.message);
      return;
    }
    setSelectedFile(file);
  };

  const startUpload = async () => {
    if (!selectedFile || !consent || busy || atLimit) {
      if (!consent) setUploadError("Vui lòng xác nhận nội dung cảnh báo trước khi tải lên.");
      return;
    }
    setFileError("");
    setUploadError("");
    setPhase("requesting");
    setProgress(0);
    try {
      const signature = await requestCvUploadUrl(true);
      setPhase("uploading");
      let cloudinaryResponse: { public_id?: string };
      try {
        cloudinaryResponse = await uploadToCloudinary(selectedFile, signature, (percent) => {
          setProgress(percent);
        });
      } catch {
        setPhase("idle");
        setUploadError("Dịch vụ lưu trữ tạm thời không khả dụng. Vui lòng thử lại sau.");
        return;
      }
      const publicId = cloudinaryResponse?.public_id || signature.publicId;
      setPhase("registering");
      const created = await registerCv(selectedFile.name, publicId);
      setCvs((current) => [created, ...current]);
      setNotice({ message: "Tải lên hồ sơ xin việc thành công.", tone: "success" });
      setUploadOpen(false);
      resetUpload();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToLogin();
        return;
      }
      setPhase("idle");
      setUploadError(mapCvError(error));
    }
  };

  const handleDownload = async (cv: CandidateCv) => {
    try {
      const result = await getCvDownloadUrl(cv.id);
      window.open(result.url, "_blank", "noopener");
    } catch (error) {
      setNotice({ message: mapCvError(error), tone: "error" });
      if (error instanceof ApiError && error.status === 404) {
        void load();
      }
    }
  };

  const orderedCvs = [...cvs].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <AdminShell title="Quản lý hồ sơ" role="candidate">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-ink md:text-3xl">
              Quản lý hồ sơ xin việc
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-2">
              Tải lên, xem và tải xuống các hồ sơ dùng khi ứng tuyển.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              disabled={atLimit}
              aria-describedby={atLimit ? "cv-limit-hint" : undefined}
              className={primaryButton}
            >
              <UploadCloud size={18} aria-hidden="true" />
              Tải lên hồ sơ mới
            </button>
          </div>
        </header>

        <p className="mb-4 rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink-2">
          Đã dùng {cvs.length}/{MAX_CV_COUNT} hồ sơ
        </p>

        {atLimit && (
          <p
            id="cv-limit-hint"
            className="mb-4 rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink-2"
          >
            Bạn đã đạt số lượng hồ sơ tối đa. Vui lòng xóa bớt hồ sơ cũ.
          </p>
        )}

        {notice && (
          <div
            role="status"
            className={`mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 ${
              notice.tone === "error"
                ? "border-error/25 bg-error-container/50"
                : notice.tone === "info"
                  ? "border-rule bg-accent-subtle"
                  : "border-mint/25 bg-mint/5"
            }`}
          >
            {notice.tone === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
            ) : (
              <Info size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            )}
            <p className="min-w-0 flex-1 text-sm leading-6 text-ink-2">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Đóng thông báo"
              className={`-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-paper hover:text-ink ${focusRing}`}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-rule bg-paper px-5 py-10 text-center text-sm text-ink-3">
            <Loader2 className="mx-auto mb-2 animate-spin" size={20} aria-hidden="true" />
            Đang tải danh sách hồ sơ…
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-error/25 bg-error-container/50 px-5 py-6 text-sm text-on-error-container">
            <p role="alert">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-sm font-semibold text-accent"
            >
              Thử lại
            </button>
          </div>
        ) : cvs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rule bg-paper px-5 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle text-accent">
              <FileText size={24} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-bold text-ink">
              Bạn chưa tải lên hồ sơ xin việc nào.
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-2">
              Tải lên CV đầu tiên để bắt đầu ứng tuyển. Tệp PDF, DOC hoặc DOCX, tối đa 10 MB.
            </p>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className={`mt-5 ${primaryButton}`}
            >
              <UploadCloud size={18} aria-hidden="true" />
              Tải lên hồ sơ mới
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper">
            {orderedCvs.map((cv) => (
              <li key={cv.id}>
                <article className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <span
                      className="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-md border border-accent/25 bg-accent-subtle text-accent"
                      aria-hidden="true"
                    >
                      <FileText size={18} />
                      <span className="mt-0.5 text-[10px] font-extrabold tracking-[0.06em]">
                        {cv.contentType.includes("pdf")
                          ? "PDF"
                          : cv.fileName.split(".").pop()?.toUpperCase()}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h2
                          className="text-[15px] font-bold leading-6 text-ink"
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {cv.fileName}
                        </h2>
                        {cv.isDefault && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold tracking-[0.06em] text-accent-ink">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                        <span>{formatFileSize(cv.fileSize)}</span>
                        <span aria-hidden="true">·</span>
                        <span>Tải lên {formatCvDate(cv.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-1.5 lg:w-auto lg:shrink-0 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => void handleDownload(cv)}
                      aria-label={`Tải xuống ${cv.fileName}`}
                      title="Tải xuống"
                      className={iconButton}
                    >
                      <Download size={18} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        <Dialog open={uploadOpen} onOpenChange={handleUploadOpenChange}>
          <DialogContent hideClose={false} className="max-w-xl border-rule bg-paper p-0">
            <DialogHeader className="gap-4 border-b border-rule px-6 pb-5 pt-6 text-left">
              <DialogTitle className="text-lg font-bold text-ink">
                Tải lên hồ sơ xin việc mới
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-ink-2">
                Chọn tệp CV của bạn. Tối đa 10 MB, định dạng PDF, DOC hoặc DOCX.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-5">
              <div
                role="alert"
                className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p className="leading-6">
                  Không đưa số căn cước công dân, thông tin tài khoản ngân hàng hoặc mật khẩu vào
                  tệp hồ sơ.
                </p>
              </div>

              <div className="mb-4 flex items-start gap-3">
                <Checkbox
                  id="cv-consent"
                  checked={consent}
                  onCheckedChange={(value) => setConsent(value === true)}
                  disabled={busy}
                />
                <label htmlFor="cv-consent" className="text-sm leading-6 text-ink-2">
                  Tôi xác nhận tệp hồ sơ không chứa thông tin nhạy cảm.
                </label>
              </div>

              <label
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => void handleDrop(event)}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-rule bg-paper-2/60 px-4 py-8 text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => void handleFilePick(event)}
                  disabled={busy}
                  className="sr-only"
                />
                <UploadCloud size={24} className="text-accent" aria-hidden="true" />
                <span className="mt-2 text-sm font-semibold text-ink">
                  {selectedFile ? selectedFile.name : "Chọn hoặc kéo thả tệp CV"}
                </span>
                {selectedFile && (
                  <span className="mt-1 text-xs text-ink-3">
                    {formatFileSize(selectedFile.size)}
                  </span>
                )}
              </label>

              {fileError && (
                <p role="alert" className="mt-3 text-sm font-medium text-error">
                  {fileError}
                </p>
              )}
              {uploadError && (
                <p role="alert" className="mt-3 text-sm font-medium text-error">
                  {uploadError}
                </p>
              )}

              {(phase === "uploading" || phase === "requesting" || phase === "registering") && (
                <div className="mt-4">
                  {phase === "requesting" && (
                    <p className="text-sm text-ink-2">Đang chuẩn bị tải lên…</p>
                  )}
                  {phase === "uploading" && (
                    <>
                      <p className="mb-2 text-sm text-ink-2">Đang tải lên… {progress}%</p>
                      <div
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-2 w-full overflow-hidden rounded-full bg-paper-3"
                      >
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </>
                  )}
                  {phase === "registering" && <p className="text-sm text-ink-2">Đang lưu hồ sơ…</p>}
                </div>
              )}
            </div>
            <DialogFooter className="px-6 py-4">
              <button
                type="button"
                onClick={() => handleUploadOpenChange(false)}
                disabled={busy}
                className={secondaryButton}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void startUpload()}
                disabled={!selectedFile || !consent || busy || atLimit}
                className={primaryButton}
              >
                {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
                Tải lên
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
