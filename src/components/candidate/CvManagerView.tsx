/* Candidate CV management: old screen design wired to the GuardianWork backend. */
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  HardDrive,
  Info,
  Loader2,
  ShieldAlert,
  Star,
  Trash2,
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
import { MAX_CV_COUNT } from "@/context/CandidateContext";
import { clearAuthSession } from "@/services/auth";
import {
  getCandidateCvs,
  deleteCandidateCv,
  getCvDownloadUrl,
  registerCv,
  requestCvUploadUrl,
  setDefaultCandidateCv,
  uploadToCloudinary,
  type CandidateCv,
} from "@/services/candidateCv";
import { ApiError } from "@/services/api";
import { deriveCvLabel, formatCvDate, formatFileSize, validateCvFile } from "@/lib/cv-file";

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

function cvFormat(cv: CandidateCv): string {
  const extension = cv.fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "PDF";
  if (extension === "doc") return "DOC";
  if (extension === "docx") return "DOCX";
  if (cv.contentType.includes("pdf")) return "PDF";
  if (cv.contentType.includes("word")) return cv.contentType.includes("openxml") ? "DOCX" : "DOC";
  return extension?.toUpperCase() || "FILE";
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
  const [defaultingId, setDefaultingId] = useState<string | null>(null);
  const [confirmDeleteCv, setConfirmDeleteCv] = useState<CandidateCv | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<number | null>(null);

  const atLimit = cvs.length >= MAX_CV_COUNT;
  const busy = phase !== "idle";
  const hasDefault = cvs.some((cv) => cv.isDefault);
  const orderedCvs = [...cvs].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  useEffect(
    () => () => {
      if (progressRef.current) window.clearInterval(progressRef.current);
    },
    [],
  );

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
    const result = await validateCvFile(file);
    if (!result.ok) {
      setFileError(result.message);
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
    const result = await validateCvFile(file);
    if (!result.ok) {
      setFileError(result.message);
      return;
    }
    setSelectedFile(file);
  };

  const startUpload = async () => {
    if (!selectedFile || busy || atLimit) return;
    if (!consent) {
      setUploadError("Vui lòng xác nhận nội dung cảnh báo trước khi tải lên.");
      return;
    }

    setFileError("");
    setUploadError("");
    setPhase("requesting");
    setProgress(0);

    try {
      const signature = await requestCvUploadUrl();
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
      if (error instanceof ApiError && error.code === 40902) {
        void load();
      }
    }
  };

  const handleSetDefault = async (cv: CandidateCv) => {
    if (cv.isDefault || defaultingId) return;
    setDefaultingId(cv.id);
    try {
      const updated = await setDefaultCandidateCv(cv.id);
      setCvs((current) =>
        current.map((item) => ({ ...item, isDefault: item.id === updated.id })),
      );
      setNotice({ message: "Đã đặt hồ sơ mặc định thành công.", tone: "success" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToLogin();
        return;
      }
      setNotice({ message: mapCvError(error), tone: "error" });
      if (error instanceof ApiError && error.status === 404) void load();
    } finally {
      setDefaultingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteCv) return;
    setDeleting(true);
    try {
      await deleteCandidateCv(confirmDeleteCv.id);
      setCvs((current) => current.filter((item) => item.id !== confirmDeleteCv.id));
      setNotice({ message: "Đã xóa hồ sơ xin việc thành công.", tone: "success" });
      setConfirmDeleteCv(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirectToLogin();
        return;
      }
      setNotice({ message: mapCvError(error), tone: "error" });
      if (error instanceof ApiError && error.status === 404) void load();
    } finally {
      setDeleting(false);
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

        {!hasDefault && cvs.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-rule bg-paper px-4 py-3">
            <Info size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm leading-6 text-ink-2">
              Chưa có hồ sơ mặc định. Hồ sơ đầu tiên tải lên sẽ tự động thành mặc định.
            </p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section aria-labelledby="cv-list-title" className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id="cv-list-title" className="text-base font-bold text-ink">
                  Danh sách hồ sơ
                </h2>
                <p className="mt-0.5 text-xs text-ink-3">
                  Hồ sơ mặc định được đưa lên đầu danh sách.
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-ink-2">
                {cvs.length}/{MAX_CV_COUNT} tệp
              </span>
            </div>

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
              <div className="px-5 py-12 text-center sm:px-8 rounded-xl border border-dashed border-rule bg-paper">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle text-accent">
                  <FileText size={24} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">
                  Bạn chưa tải lên hồ sơ xin việc nào.
                </h3>
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
              <div className="overflow-hidden rounded-xl border border-rule bg-paper">
                <ul className="divide-y divide-rule">
                  {orderedCvs.map((cv) => (
                    <li key={cv.id}>
                      <article
                        className={`flex flex-col gap-4 border-l-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center ${
                          cv.isDefault
                            ? "border-l-accent bg-accent-subtle/40"
                            : "border-l-transparent"
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3.5">
                          <span
                            className={`flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-md border ${
                              cvFormat(cv) === "PDF"
                                ? "border-accent/25 bg-accent-subtle text-accent"
                                : "border-rule bg-paper-2 text-ink-2"
                            }`}
                            aria-hidden="true"
                          >
                            <FileText size={18} />
                            <span className="mt-0.5 text-[10px] font-extrabold tracking-[0.06em]">
                              {cvFormat(cv)}
                            </span>
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3
                                className="min-w-0 text-[15px] font-bold leading-6 text-ink"
                                style={{ overflowWrap: "anywhere" }}
                              >
                                {deriveCvLabel(cv.fileName)}
                              </h3>
                              {cv.isDefault && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-accent-ink">
                                  <Star size={10} fill="currentColor" aria-hidden="true" />
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-ink-2" title={cv.fileName}>
                              {cv.fileName}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                              <span>{formatFileSize(cv.fileSize)}</span>
                              <span aria-hidden="true">·</span>
                              <span>Tải lên {formatCvDate(cv.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-1.5 lg:w-auto lg:shrink-0 lg:justify-end">
                          {!cv.isDefault && (
                            <button
                              type="button"
                              onClick={() => void handleSetDefault(cv)}
                              disabled={defaultingId === cv.id}
                              aria-label={`Đặt ${cv.fileName} làm mặc định`}
                              title="Đặt làm mặc định"
                              className={iconButton}
                            >
                              {defaultingId === cv.id ? (
                                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                              ) : (
                                <Star size={18} aria-hidden="true" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDownload(cv)}
                            aria-label={`Tải xuống ${cv.fileName}`}
                            title="Tải xuống"
                            className={iconButton}
                          >
                            <Download size={18} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCv(cv)}
                            disabled={deleting}
                            aria-label={`Xóa ${cv.fileName}`}
                            title="Xóa"
                            className={iconButton}
                          >
                            <Trash2 size={18} aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-xl border border-rule bg-paper p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-bold text-ink">Số lượng hồ sơ</h2>
                <p className="text-sm font-bold text-ink">
                  {cvs.length}
                  <span className="font-semibold text-ink-3">/{MAX_CV_COUNT}</span>
                </p>
              </div>
              <div className="mt-3 flex gap-1.5" aria-hidden="true">
                {Array.from({ length: MAX_CV_COUNT }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${
                      index < cvs.length ? "bg-accent" : "bg-paper-3"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-ink-3">
                {atLimit
                  ? "Đã đạt giới hạn. Vui lòng xóa bớt hồ sơ cũ để tải lên tệp mới."
                  : `Bạn còn ${MAX_CV_COUNT - cvs.length} chỗ trống.`}
              </p>
            </section>

            <section className="rounded-xl border border-rule bg-paper p-5">
              <h2 className="text-base font-bold text-ink">Cách hoạt động</h2>
              <ul className="mt-3 flex flex-col gap-3 text-sm leading-6 text-ink-2">
                <li className="flex gap-2.5">
                  <Star size={17} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    <strong className="text-ink">Mặc định:</strong> hồ sơ đầu tiên tải lên sẽ tự
                    động là hồ sơ mặc định và được đính kèm khi bạn ứng tuyển.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <HardDrive size={17} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    <strong className="text-ink">Giới hạn:</strong> tối đa {MAX_CV_COUNT} hồ sơ, mỗi
                    tệp không quá 10 MB.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <FileText size={17} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    <strong className="text-ink">Định dạng:</strong> PDF, DOC hoặc DOCX. Hệ thống
                    kiểm tra cả nội dung tệp, không chỉ phần mở rộng.
                  </span>
                </li>
              </ul>
            </section>

{/*
            <section className="rounded-xl border border-rule border-l-4 border-l-accent-2 bg-paper-2 p-5">
              <div className="flex items-start gap-2.5">
                <ShieldAlert
                  size={19}
                  className="mt-0.5 shrink-0 text-accent-2"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-ink">Trước khi tải lên</h2>
                  <p className="mt-1 text-xs leading-5 text-ink-2">
                    Không đưa số căn cước công dân, thông tin tài khoản ngân hàng hoặc mật khẩu vào
                    tệp CV. Bạn sẽ xác nhận điều này trước mỗi lần tải lên.
                  </p>
                </div>
              </div>
            </section>
*/}
          </aside>
        </div>
      </div>

      <Dialog open={uploadOpen} onOpenChange={handleUploadOpenChange}>
        <DialogContent className="flex max-h-[92vh] max-w-xl flex-col gap-0 overflow-hidden border-rule bg-paper p-0">
          <DialogHeader className="shrink-0 border-b border-rule px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-lg font-bold text-ink">
              Tải lên hồ sơ xin việc mới
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6 text-ink-2">
              Chọn tệp CV của bạn. Tối đa 10 MB, định dạng PDF, DOC hoặc DOCX.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="flex gap-3 rounded-lg border border-rule border-l-4 border-l-accent-2 bg-paper-2 p-3.5">
              <AlertTriangle
                size={19}
                className="mt-0.5 shrink-0 text-accent-2"
                aria-hidden="true"
              />
              <p className="text-xs leading-5 text-ink-2">
                <strong className="text-ink">Không đưa thông tin nhạy cảm vào tệp.</strong> Bao gồm
                số căn cước công dân, thông tin tài khoản ngân hàng hoặc mật khẩu.
              </p>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-lg border border-rule bg-paper-2 p-3.5">
              <Checkbox
                id="cv-consent"
                checked={consent}
                onCheckedChange={(value) => setConsent(value === true)}
                disabled={busy}
                className="mt-0.5 border-rule-2 bg-paper data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              />
              <label htmlFor="cv-consent" className="cursor-pointer text-xs leading-5 text-ink-2">
                Tôi xác nhận tệp hồ sơ không chứa thông tin nhạy cảm.
              </label>
            </div>

            <label
              htmlFor="cv-file-input"
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy) {
                  /* drag hover styling handled by class below is minimal */
                }
              }}
              onDragLeave={() => {}}
              onDrop={(event) => void handleDrop(event)}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition-colors focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 ${
                busy
                  ? "pointer-events-none opacity-60"
                  : "border-rule-2 bg-paper-2 hover:border-accent hover:bg-accent-subtle/60"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-accent">
                <UploadCloud size={22} aria-hidden="true" />
              </span>
              <span className="mt-2 text-sm font-bold text-ink">
                {busy
                  ? "Đang xử lý…"
                  : selectedFile
                    ? "Chọn tệp khác"
                    : "Kéo thả tệp vào đây hoặc chọn tệp"}
              </span>
              <span className="mt-1 text-xs text-ink-3">PDF, DOC hoặc DOCX · tối đa 10 MB</span>
              <input
                ref={fileInputRef}
                id="cv-file-input"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => void handleFilePick(event)}
                disabled={busy}
                className="sr-only"
              />
            </label>

            {selectedFile && (
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-rule bg-paper px-3.5 py-3">
                <FileText size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold text-ink"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {selectedFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">{formatFileSize(selectedFile.size)}</p>
                </div>
                {!busy && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Bỏ chọn tệp"
                    className={`-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink ${focusRing}`}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {fileError && (
              <p
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-lg border border-error/25 bg-error-container px-3.5 py-2.5 text-xs font-medium leading-5 text-on-error-container"
              >
                <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                {fileError}
              </p>
            )}

            {uploadError && (
              <p
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-lg border border-error/25 bg-error-container px-3.5 py-2.5 text-xs font-medium leading-5 text-on-error-container"
              >
                <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                {uploadError}
              </p>
            )}

            {(phase === "uploading" || phase === "requesting" || phase === "registering") && (
              <div className="mt-3">
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

          <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-rule px-6 py-4">
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
              {busy ? (
                <Loader2
                  size={17}
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <UploadCloud size={17} aria-hidden="true" />
              )}
              Tải lên
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDeleteCv}
        onOpenChange={(open) => {
          if (!open && !deleting) setConfirmDeleteCv(null);
        }}
      >
        <DialogContent className="max-w-md border-rule bg-paper p-0">
          <DialogHeader className="border-b border-rule px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-lg font-bold text-ink">Xóa hồ sơ xin việc</DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6 text-ink-2">
              {confirmDeleteCv?.fileName}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 text-sm leading-6 text-ink-2">
            Thao tác này không thể hoàn tác. Các đơn ứng tuyển đã nộp trước đó vẫn giữ bản hồ sơ đã
            gửi.
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t border-rule px-6 py-4">
            <button
              type="button"
              onClick={() => setConfirmDeleteCv(null)}
              disabled={deleting}
              className={secondaryButton}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmDelete()}
              disabled={deleting}
              className={primaryButton}
            >
              {deleting && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
              Xóa
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
