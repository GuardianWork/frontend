/* Hallmark · page: candidate CV management · genre: modern-minimal
 * macrostructure: Workbench · tone: utilitarian · theme: GuardianWork (DESIGN.md locked)
 * anchor hue: Guardian Blue · enrichment: none (typography + functional states)
 * states: default · hover · focus · active · disabled · loading · error · success
 * pre-emit critique: P5 H5 E5 S5 R4 V4
 */

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  HardDrive,
  Info,
  Loader2,
  Pencil,
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
import {
  MAX_CV_COUNT,
  useCandidate,
  type CandidateCv,
} from "@/context/CandidateContext";
import {
  CV_ACCEPT_ATTRIBUTE,
  CV_MIME_BY_FORMAT,
  deriveCvLabel,
  detectCvFormat,
  formatCvDate,
  formatFileSize,
  validateCvFile,
} from "@/lib/cv-file";

type NoticeTone = "success" | "info" | "error";

type UploadState = "idle" | "uploading";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";
const primaryButton = `inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-accent px-5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hover active:bg-accent-deep disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-ink-3 ${focusRing}`;
const secondaryButton = `inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-rule bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper-2 active:bg-paper-3 ${focusRing}`;
const iconButton = `inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink active:bg-paper-3 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10 ${focusRing}`;

export function CvManagerView() {
  const { cvs, addCv, removeCv, renameCv, setDefaultCv } = useCandidate();
  const [notice, setNotice] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sensitiveConfirmed, setSensitiveConfirmed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [renameTarget, setRenameTarget] = useState<CandidateCv | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CandidateCv | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<number | null>(null);
  const finishTimer = useRef<number | null>(null);
  const finishUploadRef = useRef<() => void>(() => {});
  const validationId = useRef(0);

  const atLimit = cvs.length >= MAX_CV_COUNT;
  const hasDefault = cvs.some((cv) => cv.isDefault);
  const orderedCvs = [...cvs].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  useEffect(
    () => () => {
      if (progressTimer.current) window.clearInterval(progressTimer.current);
      if (finishTimer.current) window.clearTimeout(finishTimer.current);
    },
    [],
  );

  const resetUploadForm = () => {
    validationId.current += 1;
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    if (finishTimer.current) window.clearTimeout(finishTimer.current);
    progressTimer.current = null;
    finishTimer.current = null;
    setSensitiveConfirmed(false);
    setSelectedFile(null);
    setFileError("");
    setUploadState("idle");
    setProgress(0);
    setIsChecking(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadOpenChange = (open: boolean) => {
    if (!open && uploadState === "uploading") return;
    if (!open) resetUploadForm();
    setUploadOpen(open);
  };

  const validateAndSelectFile = async (file: File) => {
    const currentValidation = ++validationId.current;
    setFileError("");
    setSelectedFile(null);

    setIsChecking(true);
    const check = await validateCvFile(file);
    if (currentValidation !== validationId.current) return;
    setIsChecking(false);

    if (!check.ok) {
      setFileError(check.message);
      return;
    }
    setSelectedFile(file);
  };

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void validateAndSelectFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (uploadState === "uploading") return;
    const file = event.dataTransfer.files?.[0];
    if (file) void validateAndSelectFile(file);
  };

  const finishUpload = () => {
    if (!selectedFile) return;
    const format = detectCvFormat(selectedFile.name);
    if (!format) {
      setFileError("Chỉ nhận tệp PDF, DOC hoặc DOCX.");
      return;
    }

    const added = addCv({
      fileName: selectedFile.name,
      label: deriveCvLabel(selectedFile.name),
      format,
      mimeType: selectedFile.type || CV_MIME_BY_FORMAT[format],
      sizeBytes: selectedFile.size,
      previewUrl: URL.createObjectURL(selectedFile),
    });

    if (!added) {
      setFileError("Bạn đã đạt giới hạn 5 hồ sơ. Xóa một hồ sơ cũ trước khi tải lên.");
      setUploadState("idle");
      setProgress(0);
      return;
    }

    setUploadState("idle");
    setProgress(0);
    setNotice({
      message: `Đã thêm “${selectedFile.name}” vào danh sách hồ sơ.`,
      tone: "success",
    });
    setUploadOpen(false);
    resetUploadForm();
  };
  finishUploadRef.current = finishUpload;

  const startUpload = () => {
    if (!selectedFile || !sensitiveConfirmed || uploadState === "uploading" || isChecking) return;
    if (atLimit) {
      setFileError("Bạn đã đạt giới hạn 5 hồ sơ. Xóa một hồ sơ cũ trước khi tải lên.");
      return;
    }

    setFileError("");
    setUploadState("uploading");
    setProgress(6);

    let current = 6;
    progressTimer.current = window.setInterval(() => {
      current = Math.min(100, current + 14);
      setProgress(current);

      if (current >= 100) {
        if (progressTimer.current) window.clearInterval(progressTimer.current);
        progressTimer.current = null;
        finishTimer.current = window.setTimeout(() => finishUploadRef.current(), 320);
      }
    }, 90);
  };

  const handleSetDefault = (cv: CandidateCv) => {
    const result = setDefaultCv(cv.id);
    if (result === "already") {
      setNotice({ message: "Hồ sơ này đã là hồ sơ mặc định.", tone: "info" });
      return;
    }
    if (result === "missing") {
      setNotice({ message: "Không tìm thấy hồ sơ để đặt mặc định.", tone: "error" });
      return;
    }
    setNotice({
      message: `Đã đặt “${cv.fileName}” làm hồ sơ mặc định. Hồ sơ này sẽ được đính kèm tự động khi ứng tuyển.`,
      tone: "success",
    });
  };

  const openRename = (cv: CandidateCv) => {
    setRenameTarget(cv);
    setRenameValue(cv.label);
    setRenameError("");
  };

  const handleRename = () => {
    if (!renameTarget) return;
    const nextLabel = renameValue.trim();
    if (!nextLabel) {
      setRenameError("Nhập tên hiển thị cho hồ sơ.");
      return;
    }
    if (nextLabel.length > 60) {
      setRenameError("Tên hiển thị tối đa 60 ký tự.");
      return;
    }
    renameCv(renameTarget.id, nextLabel);
    setNotice({ message: "Đã cập nhật tên hiển thị của hồ sơ.", tone: "success" });
    setRenameTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const wasDefault = deleteTarget.isDefault;
    const fileName = deleteTarget.fileName;
    removeCv(deleteTarget.id);
    setDeleteTarget(null);
    setNotice({
      message: wasDefault
        ? `Đã xóa “${fileName}”. Bạn chưa có hồ sơ mặc định — hãy chọn một hồ sơ khác.`
        : `Đã xóa “${fileName}” khỏi danh sách hồ sơ.`,
      tone: wasDefault ? "info" : "success",
    });
  };

  const handleDownload = (cv: CandidateCv) => {
    if (!cv.previewUrl) {
      setNotice({
        message: "Bản xem thử chưa có tệp gốc để tải xuống. Hồ sơ mẫu chỉ hiển thị thông tin.",
        tone: "info",
      });
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = cv.previewUrl;
    anchor.download = cv.fileName;
    anchor.click();
  };

  return (
    <AdminShell title="Quản lý hồ sơ" role="candidate">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-ink md:text-3xl">
              Hồ sơ xin việc
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-2">
              Quản lý các bản CV dùng khi ứng tuyển. Hồ sơ mặc định được đính kèm tự động vào mỗi
              đơn, và bạn vẫn có thể chọn hồ sơ khác tại bước nộp đơn.
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
              Tải hồ sơ mới
            </button>
          </div>
        </header>

        {atLimit && (
          <p
            id="cv-limit-hint"
            className="mb-4 rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink-2"
          >
            Bạn đã dùng <strong className="text-ink">5/5</strong> hồ sơ. Xóa một hồ sơ cũ để tải lên
            tệp mới.
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
              Chưa có hồ sơ mặc định. Chọn <strong className="text-ink">Đặt mặc định</strong> để hệ
              thống tự đính kèm hồ sơ khi bạn ứng tuyển.
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

            <div className="overflow-hidden rounded-xl border border-rule bg-paper">
              {cvs.length === 0 ? (
                <div className="px-5 py-12 text-center sm:px-8">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle text-accent">
                    <FileText size={24} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-ink">Chưa có hồ sơ xin việc</h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-2">
                    Tải lên CV đầu tiên để bắt đầu ứng tuyển. Tệp PDF, DOC hoặc DOCX, tối đa 10 MB.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUploadOpen(true)}
                    className={`mt-5 ${primaryButton}`}
                  >
                    <UploadCloud size={18} aria-hidden="true" />
                    Tải hồ sơ đầu tiên
                  </button>
                </div>
              ) : (
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
                              cv.format === "PDF"
                                ? "border-accent/25 bg-accent-subtle text-accent"
                                : "border-rule bg-paper-2 text-ink-2"
                            }`}
                            aria-hidden="true"
                          >
                            <FileText size={18} />
                            <span className="mt-0.5 text-[10px] font-extrabold tracking-[0.06em]">
                              {cv.format}
                            </span>
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3
                                className="min-w-0 text-[15px] font-bold leading-6 text-ink"
                                style={{ overflowWrap: "anywhere" }}
                              >
                                {cv.label}
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
                              <span>{formatFileSize(cv.sizeBytes)}</span>
                              <span aria-hidden="true">·</span>
                              <span>Tải lên {formatCvDate(cv.uploadedAt)}</span>
                              {cv.usedInApplications > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>Đã dùng cho {cv.usedInApplications} đơn ứng tuyển</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-1.5 lg:w-auto lg:shrink-0 lg:justify-end">
                          {!cv.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(cv)}
                              className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-accent/30 bg-accent-subtle px-2.5 text-[11px] font-bold text-accent transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink active:bg-accent-deep sm:flex-none sm:px-3 sm:text-xs ${focusRing}`}
                            >
                              <Star size={14} aria-hidden="true" />
                              Đặt mặc định
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownload(cv)}
                            aria-label={`Tải xuống ${cv.fileName}`}
                            title="Tải xuống"
                            className={iconButton}
                          >
                            <Download size={18} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openRename(cv)}
                            aria-label={`Đổi tên hiển thị ${cv.label}`}
                            title="Đổi tên hiển thị"
                            className={iconButton}
                          >
                            <Pencil size={17} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cv)}
                            aria-label={`Xóa ${cv.fileName}`}
                            title="Xóa hồ sơ"
                            className={`${iconButton} text-error hover:bg-error-container hover:text-on-error-container`}
                          >
                            <Trash2 size={18} aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="mt-3 text-xs leading-5 text-ink-3">
              Bản xem thử lưu hồ sơ trong phiên trình duyệt; tệp chưa được tải lên máy chủ.
            </p>
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
                  ? "Đã đạt giới hạn. Xóa bớt một hồ sơ để tải lên tệp mới."
                  : `Bạn còn ${MAX_CV_COUNT - cvs.length} chỗ trống.`}
              </p>
            </section>

            <section className="rounded-xl border border-rule bg-paper p-5">
              <h2 className="text-base font-bold text-ink">Cách hoạt động</h2>
              <ul className="mt-3 flex flex-col gap-3 text-sm leading-6 text-ink-2">
                <li className="flex gap-2.5">
                  <Star size={17} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    <strong className="text-ink">Mặc định:</strong> hồ sơ được tự động đính kèm khi
                    bạn ứng tuyển; bạn vẫn đổi được ở bước nộp đơn.
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

            <section className="rounded-xl border border-rule bg-paper p-5">
              <h2 className="text-sm font-bold text-ink">Hồ sơ đã dùng để ứng tuyển</h2>
              <p className="mt-1 text-xs leading-5 text-ink-2">
                Khi bạn nộp đơn, hệ thống giữ một bản sao của hồ sơ đã gửi. Xóa hồ sơ ở đây không
                làm thay đổi đơn đã nộp hay bản sao nhà tuyển dụng đang xem.
              </p>
            </section>
          </aside>
        </div>
      </div>

      <Dialog open={uploadOpen} onOpenChange={handleUploadOpenChange}>
        <DialogContent className="flex max-h-[92vh] max-w-xl flex-col gap-0 overflow-hidden border-rule bg-paper p-0">
          <DialogHeader className="shrink-0 border-b border-rule px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-lg font-bold text-ink">Tải hồ sơ xin việc mới</DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6 text-ink-2">
              Thêm một bản CV để dùng khi ứng tuyển. Hồ sơ đầu tiên sẽ tự động thành mặc định.
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

            <label
              htmlFor="cv-file-input"
              onDragOver={(event) => {
                event.preventDefault();
                if (uploadState !== "uploading") setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition-colors focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 ${
                isDragging
                  ? "border-accent bg-accent-subtle"
                  : "border-rule-2 bg-paper-2 hover:border-accent hover:bg-accent-subtle/60"
              } ${uploadState === "uploading" ? "pointer-events-none opacity-60" : ""}`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-accent">
                <UploadCloud size={22} aria-hidden="true" />
              </span>
              <span className="mt-2 text-sm font-bold text-ink">
                {isChecking
                  ? "Đang kiểm tra tệp…"
                  : selectedFile
                    ? "Chọn tệp khác"
                    : "Kéo thả tệp vào đây hoặc chọn tệp"}
              </span>
              <span className="mt-1 text-xs text-ink-3">PDF, DOC hoặc DOCX · tối đa 10 MB</span>
              <input
                ref={fileInputRef}
                id="cv-file-input"
                type="file"
                accept={CV_ACCEPT_ATTRIBUTE}
                onChange={handleFilePick}
                disabled={uploadState === "uploading" || isChecking}
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
                  <p className="mt-0.5 text-xs text-ink-3">
                    {formatFileSize(selectedFile.size)} · {detectCvFormat(selectedFile.name)}
                  </p>
                </div>
                {uploadState !== "uploading" && (
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

            <div className="mt-4 flex items-start gap-3 rounded-lg border border-rule bg-paper-2 p-3.5">
              <Checkbox
                id="cv-sensitive-confirm"
                checked={sensitiveConfirmed}
                onCheckedChange={(value) => setSensitiveConfirmed(value === true)}
                disabled={uploadState === "uploading"}
                className="mt-0.5 border-rule-2 bg-paper data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              />
              <label
                htmlFor="cv-sensitive-confirm"
                className="cursor-pointer text-xs leading-5 text-ink-2"
              >
                Tôi xác nhận tệp này không chứa số căn cước công dân, thông tin tài khoản ngân hàng
                hoặc mật khẩu.
              </label>
            </div>

            {uploadState === "uploading" && (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-ink-2">Đang tải lên…</span>
                  <span className="text-ink-3">{progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-3">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-rule px-6 py-4">
            <button
              type="button"
              onClick={() => handleUploadOpenChange(false)}
              disabled={uploadState === "uploading"}
              className={secondaryButton}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={startUpload}
              disabled={
                !selectedFile || !sensitiveConfirmed || isChecking || uploadState === "uploading"
              }
              className={primaryButton}
            >
              {uploadState === "uploading" ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Đang tải lên {progress}%
                </>
              ) : (
                <>
                  <UploadCloud size={17} aria-hidden="true" />
                  Tải lên hồ sơ
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className="max-w-md gap-0 border-rule bg-paper p-0">
          <DialogHeader className="border-b border-rule px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-lg font-bold text-ink">Đổi tên hiển thị</DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6 text-ink-2">
              Tên này chỉ dùng để bạn phân biệt các hồ sơ. Tên tệp gốc được giữ nguyên.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5">
            <label
              htmlFor="cv-rename-input"
              className="text-xs font-semibold uppercase tracking-wide text-ink-3"
            >
              Tên hiển thị
            </label>
            <input
              id="cv-rename-input"
              type="text"
              value={renameValue}
              maxLength={60}
              onChange={(event) => {
                setRenameValue(event.target.value);
                setRenameError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleRename();
              }}
              aria-invalid={Boolean(renameError)}
              aria-describedby={renameError ? "cv-rename-error" : "cv-rename-hint"}
              className={`mt-2 w-full rounded-md border bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:ring-2 focus:ring-accent/20 ${
                renameError ? "border-error" : "border-rule focus:border-accent"
              }`}
            />
            {renameError ? (
              <p id="cv-rename-error" role="alert" className="mt-1 text-xs font-medium text-error">
                {renameError}
              </p>
            ) : (
              <p id="cv-rename-hint" className="mt-1 text-xs text-ink-3">
                Tối đa 60 ký tự.
              </p>
            )}
          </div>

          <DialogFooter className="flex-row justify-end gap-2 border-t border-rule px-6 py-4">
            <button type="button" onClick={() => setRenameTarget(null)} className={secondaryButton}>
              Hủy
            </button>
            <button type="button" onClick={handleRename} className={primaryButton}>
              Lưu tên mới
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md gap-0 border-rule bg-paper p-0">
          <DialogHeader className="border-b border-rule px-6 pb-4 pt-6 text-left">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
                <Trash2 size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold text-ink">Xóa hồ sơ này?</DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-6 text-ink-2">
                  Hồ sơ sẽ bị xóa khỏi danh sách của bạn. Hành động này không thể hoàn tác.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5">
            <div className="rounded-lg border border-rule bg-paper-2 px-3.5 py-3">
              <p className="text-sm font-semibold text-ink" style={{ overflowWrap: "anywhere" }}>
                {deleteTarget?.fileName}
              </p>
              <p className="mt-0.5 text-xs text-ink-3">{deleteTarget?.label}</p>
            </div>

            {deleteTarget?.isDefault && (
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-ink-2">
                <Info size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                Đây đang là hồ sơ mặc định. Sau khi xóa, bạn cần chọn một hồ sơ khác làm mặc định.
              </p>
            )}

            {deleteTarget && deleteTarget.usedInApplications > 0 && (
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-ink-2">
                <Info size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                Hồ sơ này đã được dùng cho {deleteTarget.usedInApplications} đơn ứng tuyển. Bản sao
                đã gửi nhà tuyển dụng vẫn được giữ nguyên.
              </p>
            )}
          </div>

          <DialogFooter className="flex-row justify-end gap-2 border-t border-rule px-6 py-4">
            <button type="button" onClick={() => setDeleteTarget(null)} className={secondaryButton}>
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-error px-5 text-sm font-bold text-paper transition-colors hover:bg-on-error-container active:bg-on-error-container ${focusRing}`}
            >
              <Trash2 size={17} aria-hidden="true" />
              Xóa hồ sơ
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
