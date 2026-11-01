import { AdminShell } from "@/components/AdminShell";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileText,
  Info,
  Loader2,
  Send,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import {
  MAX_CV_COUNT,
  type CandidateCv,
  type CandidateCvFormat,
  type CandidateProfileDetails,
} from "@/context/CandidateContext";
import { loadCandidateProfile, toLocalPhone } from "@/services/candidateProfile";
import { toSalaryRange } from "@/services/publicJobs";
import { apiRequest } from "@/services/api";
import {
  listCandidateCvs,
  requestCvUploadUrl,
  uploadToCloudinary,
  registerCandidateCv,
  type CandidateCv as BackendCandidateCv,
} from "@/services/candidateCv";
import { listApplications } from "@/services/candidateApplications";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useCompanyWorkspace } from "@/hooks/useCompanyWorkspace";
import { badgeLabel, type JobItem } from "@/lib/job-listings";
import { buildCandidateJobs, shortJobLocation } from "@/lib/candidate-jobs";
import {
  CV_ACCEPT_ATTRIBUTE,
  deriveCvLabel,
  detectCvFormat,
  formatCvDate,
  formatFileSize,
  validateCvFile,
} from "@/lib/cv-file";
import { submitCompanyApplication } from "@/services/companyMembers";
import { submitApplication, type SubmittedApplication } from "@/services/candidateApplications";

const MAX_NAME_LENGTH = 150;
const MAX_COVER_LENGTH = 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^0\d{9}$/;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";
const fieldBase =
  "block w-full min-h-11 rounded-lg border bg-paper px-3 text-base text-ink caret-accent outline-none transition-colors placeholder:text-ink-3 focus:ring-2";
const fieldRing = (invalid: boolean) =>
  invalid
    ? "border-error focus:border-error focus:ring-error focus:ring-offset-1"
    : "border-rule focus:border-accent focus:ring-accent focus:ring-offset-1";

type Contact = { name: string; email: string; phone: string };
type FieldKey = keyof Contact | "cv" | "cover";
type FieldErrors = Partial<Record<FieldKey, string>>;

type Receipt = {
  at: string;
  jobTitle: string;
  company: string;
  cv: { fileName: string; format: string; sizeBytes: number };
  email: string;
  phone: string;
};

function contactFromProfile(
  profile: { fullName: string; email: string; phone: string },
  sessionEmail?: string,
): Contact {
  return {
    name: profile.fullName.trim(),
    email: profile.email.trim() || sessionEmail || "",
    phone: toLocalPhone(profile.phone.trim()),
  };
}

function SectionTitle({ id, children, aside }: { id: string; children: string; aside?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h2 id={id} className="text-lg font-bold tracking-[-0.01em] text-ink">
        {children}
        <span className="ml-1 text-error" aria-hidden="true">
          *
        </span>
      </h2>
      {aside && <span className="text-xs font-medium text-ink-3">{aside}</span>}
    </div>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {required && (
          <span className="ml-1 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium leading-5 text-error"
        >
          <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-5 text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function BackBar({ jobId }: { jobId?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-paper-inverse text-paper">
      <div className="mx-auto grid h-14 max-w-[880px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
        <Link
          to="/can/jobs"
          search={jobId ? { job: jobId } : {}}
          className={`inline-flex min-w-0 items-center gap-1.5 justify-self-start rounded-md py-1.5 text-sm font-semibold min-h-11 text-paper/85 transition-colors hover:text-paper ${focusRing} focus-visible:ring-paper focus-visible:ring-offset-paper-inverse`}
        >
          <ArrowLeft size={18} aria-hidden="true" className="shrink-0" />
          <span className="truncate">
            Quay lại<span className="hidden sm:inline"> tin tuyển dụng</span>
          </span>
        </Link>
        <Link
          to="/can/jobs"
          aria-label="GuardianWork — danh sách việc làm"
          className={`inline-flex items-center gap-2 justify-self-center rounded-md min-h-11 ${focusRing} focus-visible:ring-paper focus-visible:ring-offset-paper-inverse`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-paper">
            <ShieldCheck size={16} strokeWidth={2.25} aria-hidden="true" />
          </span>
          <span className="text-base font-extrabold tracking-[-0.02em]">GuardianWork</span>
        </Link>
        <span aria-hidden="true" />
      </div>
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <AdminShell title="Ứng tuyển" role="candidate">
      <BackBar />
      <div className="mx-auto w-full max-w-[880px] px-3 pb-16 pt-5 sm:px-6 sm:pt-8">{children}</div>
    </AdminShell>
  );
}

function JobMeta({ job }: { job: JobItem }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-sm font-bold tabular-nums text-accent-deep">{job.salaryRange}</span>
      <span className="inline-flex items-center gap-1 rounded border border-rule bg-paper-2 px-1.5 py-0.5 text-[11px] font-semibold text-ink-2">
        {badgeLabel(job.badge)}
      </span>
    </div>
  );
}

function toCandidateCvFormat(contentType: string): CandidateCvFormat {
  if (contentType.includes("wordprocessingml")) return "DOCX";
  if (contentType.includes("msword")) return "DOC";
  return "PDF";
}

function mapBackendCv(cv: BackendCandidateCv): CandidateCv {
  return {
    id: cv.id,
    fileName: cv.fileName,
    label: deriveCvLabel(cv.fileName),
    format: toCandidateCvFormat(cv.contentType),
    mimeType: cv.contentType,
    sizeBytes: cv.fileSize,
    uploadedAt: cv.createdAt,
    isDefault: cv.isDefault,
    usedInApplications: 0,
    previewUrl: undefined,
  };
}

export function JobApplyPage({ jobId }: { jobId?: string }) {
  const { workspace, company } = useCompanyWorkspace();
  const authUser = useAuthUser();
  const [cvs, setCvs] = useState<CandidateCv[]>([]);
  const [profileDetails, setProfileDetails] = useState<CandidateProfileDetails>({
    fullName: "",
    phone: "",
    email: "",
    avatarUrl: null,
    isPublic: true,
    skills: [],
    experience: "",
    experiences: [],
    education: [],
  });
  const [applied, setApplied] = useState(false);
  const [appliedAtState, setAppliedAtState] = useState<string | undefined>(undefined);

  const { jobs, companyJobs } = buildCandidateJobs(workspace, company);
  const localJob = jobId ? jobs.find((item) => item.id === jobId) : undefined;
  const isCompanyJob = Boolean(localJob && companyJobs.some((item) => item.id === localJob.id));
  const [backendJob, setBackendJob] = useState<JobItem | null>(null);

  useEffect(() => {
    if (localJob || !jobId) return;
    let mounted = true;
    (async () => {
      try {
        const detail = (await apiRequest(`/jobs/${jobId}`)) as {
          id: number;
          company?: { name?: string };
          content?: {
            title?: string;
            location?: string;
            description?: string;
            compensation?: {
              disclosed?: boolean;
              minimum?: number;
              maximum?: number;
              currency?: "VND" | "USD";
              payPeriod?: "HOUR" | "DAY" | "MONTH" | "YEAR";
            };
          };
        };
        if (!mounted) return;
        setBackendJob({
          id: String(detail.id ?? jobId),
          title: detail.content?.title || "Công việc",
          company: detail.company?.name || "Nhà tuyển dụng",
          location: detail.content?.location || "",
          salaryRange: toSalaryRange(
            detail.content?.compensation as Parameters<typeof toSalaryRange>[0],
          ),
          badge: "Công ty đã xác thực",
          badgeTone: "success",
          time: "",
          department: "",
          industry: undefined,
          matchScore: 0,
          description: detail.content?.description || "",
          requirements: [],
          statutoryBase: "",
          statutoryNote: "",
          suggestedRevision: "",
        });
      } catch {
        // Keep the not-found state when the backend job cannot be loaded.
      }
    })();
    return () => {
      mounted = false;
    };
  }, [jobId, localJob]);

  const job = localJob ?? backendJob;

  // The workspace reads localStorage after mount; hold the not-found state until then.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const initialCv = cvs.find((cv) => cv.isDefault) ?? cvs[0];
  const [cvSource, setCvSource] = useState<"existing" | "upload">(
    initialCv ? "existing" : "upload",
  );
  const [selectedCvId, setSelectedCvId] = useState(initialCv?.id ?? "");
  const selectedCv = cvs.find((cv) => cv.id === selectedCvId) ?? null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await loadCandidateProfile();
        if (!mounted) return;
        setProfileDetails({
          fullName: profile.fullName,
          phone: toLocalPhone(profile.phoneNumber),
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          isPublic: profile.isPublic,
          skills: profile.skills,
          experience: "",
          experiences: [],
          education: [],
        });
        setContact({
          name: profile.fullName.trim(),
          email: profile.email.trim() || authUser?.email || "",
          phone: toLocalPhone(profile.phoneNumber).trim(),
        });
      } catch {
        // Keep the local defaults when the backend profile is unavailable.
      }

      try {
        const list = await listCandidateCvs();
        if (!mounted) return;
        const mapped = list.map(mapBackendCv);
        setCvs(mapped);
        setSelectedCvId(mapped.find((cv) => cv.isDefault)?.id ?? mapped[0]?.id ?? "");
        setCvSource(mapped.length ? "existing" : "upload");
      } catch {
        // Keep local state when the backend CV list is unavailable.
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authUser?.email]);

  useEffect(() => {
    if (!job?.id || isCompanyJob) return;
    let mounted = true;
    (async () => {
      try {
        const applications = await listApplications();
        if (!mounted) return;
        const match = applications.find((item) => String(item.jobId) === String(job.id));
        setApplied(!!match);
        setAppliedAtState(match?.appliedAt);
      } catch {
        // Fall back to not-applied when backend state cannot be loaded.
      }
    })();
    return () => {
      mounted = false;
    };
  }, [job?.id, isCompanyJob]);

  const [manualEntry, setManualEntry] = useState(false);
  const [contact, setContact] = useState<Contact>(() => contactFromProfile(profileDetails));
  const [cover, setCover] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
  const [uploadChecking, setUploadChecking] = useState(false);
  const [uploadConfirmed, setUploadConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadTimer = useRef<number | null>(null);
  const uploadFinishTimer = useRef<number | null>(null);
  const uploadDoneRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (manualEntry || !authUser) return;
    setContact((current) => (current.email ? current : { ...current, email: authUser.email }));
  }, [authUser, manualEntry]);

  useEffect(
    () => () => {
      if (uploadTimer.current) window.clearInterval(uploadTimer.current);
      if (uploadFinishTimer.current) window.clearTimeout(uploadFinishTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (cvs.length === 0) {
      setCvSource("upload");
      setSelectedCvId("");
    }
  }, [cvs.length]);

  const atCvLimit = cvs.length >= MAX_CV_COUNT;
  const alreadyApplied = job
    ? isCompanyJob
      ? workspace.applications.some(
          (application) =>
            application.jobId === job.id && application.email === authUser?.email.toLowerCase(),
        )
      : applied
    : false;
  const appliedAt = job
    ? isCompanyJob
      ? workspace.applications.find(
          (application) =>
            application.jobId === job.id && application.email === authUser?.email.toLowerCase(),
        )?.submittedAt
      : appliedAtState
    : undefined;

  const updateContact = (key: keyof Contact, value: string) => {
    setContact((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
    setFormError("");
  };

  const startManualEntry = () => {
    setManualEntry(true);
    setContact({ name: "", email: "", phone: "" });
    setErrors({});
    setFormError("");
  };

  const refillFromProfile = () => {
    setManualEntry(false);
    setContact(contactFromProfile(profileDetails, authUser?.email));
    setErrors({});
    setFormError("");
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setCvSource("upload");
    setUploadError("");
    setUploadNotice("");
    setUploadFile(null);
    setUploadConfirmed(false);
    setUploadChecking(true);
    const check = await validateCvFile(file);
    setUploadChecking(false);
    if (!check.ok) {
      setUploadError(check.message);
      return;
    }
    setUploadFile(file);
  };

  const finishUpload = async () => {
    const file = uploadFile;
    if (!file) return;
    const format = detectCvFormat(file.name);
    if (!format) {
      setUploadError("Chỉ nhận tệp PDF, DOC hoặc DOCX.");
      setUploading(false);
      return;
    }
    try {
      const signature = await requestCvUploadUrl();
      await uploadToCloudinary(file, signature, (percent) => setUploadProgress(percent));
      const registered = await registerCandidateCv(file.name, signature.publicId);
      const added = mapBackendCv(registered);
      setCvs((prev) => [added, ...prev]);
      setCvSource("existing");
      setSelectedCvId(added.id);
      setUploadFile(null);
      setUploadConfirmed(false);
      setErrors((current) => ({ ...current, cv: undefined }));
      setUploadNotice(`Đã tải lên “${file.name}” và chọn làm hồ sơ đính kèm.`);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Không gửi được hồ sơ. Vui lòng thử lại.",
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  uploadDoneRef.current = finishUpload;

  const startUpload = () => {
    if (!uploadFile || !uploadConfirmed || uploading || uploadChecking || atCvLimit) return;
    setUploadError("");
    setUploadNotice("");
    setUploading(true);
    setUploadProgress(8);
    let current = 8;
    uploadTimer.current = window.setInterval(() => {
      current = Math.min(100, current + 16);
      setUploadProgress(current);
      if (current >= 100) {
        if (uploadTimer.current) window.clearInterval(uploadTimer.current);
        uploadTimer.current = null;
        uploadFinishTimer.current = window.setTimeout(() => uploadDoneRef.current(), 320);
      }
    }, 90);
  };

  const clearUpload = () => {
    setUploadFile(null);
    setUploadConfirmed(false);
    setUploadError("");
    if (uploadTimer.current) window.clearInterval(uploadTimer.current);
    if (uploadFinishTimer.current) window.clearTimeout(uploadFinishTimer.current);
    setUploading(false);
    setUploadProgress(0);
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const name = contact.name.trim();
    if (!name) next.name = "Nhập họ và tên để nhà tuyển dụng biết bạn là ai.";
    else if (name.length > MAX_NAME_LENGTH) next.name = "Họ và tên tối đa 150 ký tự.";

    const email = contact.email.trim();
    if (!email) next.email = "Nhập email để nhận phản hồi từ nhà tuyển dụng.";
    else if (!EMAIL_PATTERN.test(email))
      next.email = "Email chưa đúng định dạng, ví dụ ten@congty.vn.";

    const phone = contact.phone.trim();
    if (!phone) next.phone = "Nhập số điện thoại liên hệ.";
    else if (!PHONE_PATTERN.test(phone))
      next.phone = "Số điện thoại gồm 10 chữ số và bắt đầu bằng 0.";

    if (cvSource === "existing" && !selectedCv)
      next.cv = "Chọn một hồ sơ đính kèm, hoặc tải lên tệp mới.";
    if (cvSource === "upload" && !uploadFile)
      next.cv = "Chọn tệp và bấm “Tải lên và dùng hồ sơ này”, hoặc chọn hồ sơ đã lưu.";
    if (cover.length > MAX_COVER_LENGTH)
      next.cover = `Thư giới thiệu tối đa ${MAX_COVER_LENGTH} ký tự.`;

    return next;
  };

  const focusField = (key: FieldKey) => {
    const ids: Record<FieldKey, string> = {
      name: "apply-name",
      email: "apply-email",
      phone: "apply-phone",
      cv: cvSource === "existing" ? "apply-cv-existing" : "apply-cv-upload",
      cover: "apply-cover",
    };
    document.getElementById(ids[key])?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!job || submitting || receipt) return;
    const next = validate();
    setErrors(next);
    setFormError("");
    const firstError = (Object.keys(next) as FieldKey[]).find((key) => next[key]);
    if (firstError) {
      focusField(firstError);
      return;
    }

    // Re-read the CV at submit time: it may have been deleted elsewhere (EC-CAN-APP-02).
    const cv = cvs.find((item) => item.id === selectedCvId);
    if (!cv) {
      setErrors({ cv: "Hồ sơ đã chọn không còn trong danh sách. Chọn hồ sơ khác." });
      focusField("cv");
      return;
    }

    setSubmitting(true);
    try {
      const phone = toLocalPhone(contact.phone.trim()).replace(/^\+84/, "0");
      let response: SubmittedApplication | null = null;
      if (isCompanyJob) {
        await submitCompanyApplication(job.id);
      } else {
        response = await submitApplication({
          jobId: Number(job.id),
          fullName: contact.name.trim(),
          email: contact.email.trim(),
          phoneNumber: phone,
          coverLetter: cover.trim() || null,
          cvId: cv.id,
        });
      }
      setApplied(true);
      setAppliedAtState(response?.appliedAt ?? new Date().toISOString());
      setReceipt({
        at: response?.appliedAt ?? new Date().toISOString(),
        jobTitle: response?.jobTitle ?? job.title,
        company: response?.companyName ?? job.company,
        cv: {
          fileName: response?.cvFileName ?? cv.fileName,
          format: cv.format,
          sizeBytes: cv.sizeBytes,
        },
        email: contact.email.trim(),
        phone,
      });
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    } catch (error) {
      const appError = error as { code?: number; message?: string };
      setFormError(
        appError.code === 40903
          ? "Bạn đã ứng tuyển vị trí này."
          : error instanceof Error
            ? error.message
            : "Không gửi được hồ sơ. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <Shell>
        <div className="overflow-hidden rounded-xl border border-rule bg-paper motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
          <div className="px-5 pb-8 pt-10 text-center sm:px-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint/10 text-mint">
              <CheckCircle2 size={28} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-[clamp(1.375rem,2.4vw,1.75rem)] font-extrabold tracking-[-0.03em] text-ink">
              Đã gửi hồ sơ ứng tuyển
            </h1>
            <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-6 text-ink-2">
              Hồ sơ của bạn đã được gửi tới <strong className="text-ink">{receipt.company}</strong>{" "}
              cho vị trí <strong className="text-ink">{receipt.jobTitle}</strong>.
            </p>
          </div>
          <dl className="border-t border-rule px-5 py-2 sm:px-8">
            {[
              {
                term: "Hồ sơ đính kèm",
                detail: `${receipt.cv.fileName} · ${receipt.cv.format}, ${formatFileSize(receipt.cv.sizeBytes)}`,
              },
              { term: "Liên hệ", detail: `${receipt.email} · ${receipt.phone}` },
              {
                term: "Gửi lúc",
                detail: `${formatCvDate(receipt.at)} · ${new Intl.DateTimeFormat("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(receipt.at))}`,
              },
            ].map((row) => (
              <div
                key={row.term}
                className="flex flex-col gap-0.5 border-b border-rule py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <dt className="w-40 shrink-0 text-xs font-semibold   text-ink-3">{row.term}</dt>
                <dd
                  className="min-w-0 text-sm leading-6 text-ink"
                  style={{ overflowWrap: "anywhere" }}
                >
                  {row.detail}
                </dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-rule bg-paper-2 px-5 py-4 sm:px-8">
            <p className="text-xs leading-5 text-ink-2">
              Hồ sơ đính kèm đã được gửi tới nhà tuyển dụng cùng đơn này. Bạn có thể xem và quản lý
              các hồ sơ đã lưu trong mục Hồ sơ xin việc.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/can/jobs"
                className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hover active:bg-accent-deep ${focusRing}`}
              >
                Tìm việc làm khác
              </Link>
              <Link
                to="/can/cvs"
                className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-rule bg-paper px-5 text-sm font-semibold text-ink transition-colors hover:bg-paper-3 ${focusRing}`}
              >
                Quản lý hồ sơ
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!hydrated) {
    return (
      <Shell>
        <div className="rounded-xl border border-rule bg-paper px-5 py-14 text-center">
          <p role="status" className="text-sm text-ink-2">
            Đang tải tin tuyển dụng…
          </p>
        </div>
      </Shell>
    );
  }

  if (!job) {
    return (
      <Shell>
        <div className="rounded-xl border border-rule bg-paper px-5 py-12 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper-2 text-ink-3">
            <FileText size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-[clamp(1.375rem,2.4vw,1.75rem)] font-extrabold tracking-[-0.03em] text-ink">
            Tin tuyển dụng không còn nhận hồ sơ
          </h1>
          <p className="mx-auto mt-2 max-w-[48ch] text-sm leading-6 text-ink-2">
            Tin có thể đã hết hạn, bị ẩn hoặc đường dẫn không còn đúng. Chọn một tin khác trong danh
            sách việc làm đang tuyển.
          </p>
          <Link
            to="/can/jobs"
            className={`mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hover ${focusRing}`}
          >
            Xem việc làm đang tuyển
          </Link>
        </div>
      </Shell>
    );
  }

  if (alreadyApplied) {
    return (
      <Shell>
        <div className="rounded-xl border border-rule bg-paper px-5 py-12 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle text-accent">
            <CheckCircle2 size={24} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-[clamp(1.375rem,2.4vw,1.75rem)] font-extrabold tracking-[-0.03em] text-ink">
            Bạn đã ứng tuyển vị trí này
          </h1>
          <p className="mx-auto mt-2 max-w-[50ch] text-sm leading-6 text-ink-2">
            Mỗi tin tuyển dụng chỉ nhận một đơn từ mỗi ứng viên. Theo dõi phản hồi từ nhà tuyển dụng
            trong thông báo của bạn.
          </p>
          <dl className="mx-auto mt-6 max-w-lg border-t border-rule text-left">
            <div className="flex flex-col gap-0.5 border-b border-rule py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
              <dt className="w-32 shrink-0 text-xs font-semibold   text-ink-3">Vị trí</dt>
              <dd className="min-w-0 text-sm font-semibold leading-6 text-ink">{job.title}</dd>
            </div>
            <div className="flex flex-col gap-0.5 border-b border-rule py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
              <dt className="w-32 shrink-0 text-xs font-semibold   text-ink-3">Công ty</dt>
              <dd className="min-w-0 text-sm leading-6 text-ink-2">
                {job.company} · {shortJobLocation(job.location)}
              </dd>
            </div>
            {appliedAt && (
              <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
                <dt className="w-32 shrink-0 text-xs font-semibold   text-ink-3">Đã gửi</dt>
                <dd className="min-w-0 text-sm leading-6 text-ink-2">{formatCvDate(appliedAt)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              to="/can/jobs"
              className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hover ${focusRing}`}
            >
              Về danh sách việc làm
            </Link>
            <Link
              to="/can/cvs"
              className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-rule bg-paper px-5 text-sm font-semibold text-ink transition-colors hover:bg-paper-3 ${focusRing}`}
            >
              Quản lý hồ sơ
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const errorKeys = (Object.keys(errors) as FieldKey[]).filter((key) => errors[key]);
  const missingProfile =
    !profileDetails.fullName.trim() || !profileDetails.phone.trim() || !contact.email.trim();
  const coverRemaining = MAX_COVER_LENGTH - cover.length;

  return (
    <Shell>
      <div className="overflow-hidden rounded-xl border border-rule bg-paper">
        <header className="px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7">
          <h1 className="text-balance text-[clamp(1.375rem,2.4vw,1.9rem)] font-extrabold leading-[1.22] tracking-[-0.03em] text-ink [overflow-wrap:anywhere]">
            {job.title}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-ink-2 [overflow-wrap:anywhere]">
            {job.company}
            {job.location && <> · {shortJobLocation(job.location)}</>}
          </p>
          <div className="mt-3">
            <JobMeta job={job} />
          </div>
          <p className="mt-5 text-sm leading-5 text-ink-3">
            Kiểm tra lại thông tin và hồ sơ đính kèm trước khi gửi. Trường có dấu{" "}
            <span className="font-bold text-error">*</span> là bắt buộc.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="apply-form">
          <section
            aria-labelledby="apply-cv-heading"
            className="border-t border-rule px-5 py-6 sm:px-8 sm:py-7"
          >
            <SectionTitle
              id="apply-cv-heading"
              aside={cvs.length > 0 ? `${cvs.length}/${MAX_CV_COUNT} hồ sơ đã lưu` : undefined}
            >
              Hồ sơ xin việc
            </SectionTitle>
            <p className="mt-1 text-sm leading-6 text-ink-2">
              Nhà tuyển dụng nhận đúng một bản hồ sơ từ bạn cho tin này.
            </p>

            {uploadNotice && (
              <p
                role="status"
                className="mt-3 flex items-start gap-2 rounded-lg border border-mint/25 bg-mint/5 px-3 py-2.5 text-xs leading-5 text-ink-2"
              >
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
                {uploadNotice}
              </p>
            )}

            {errors.cv && (
              <p
                id="apply-cv-error"
                className="mt-3 flex items-start gap-2 rounded-lg border border-error/25 bg-error-container px-3 py-2.5 text-xs font-medium leading-5 text-on-error-container"
              >
                <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                {errors.cv}
              </p>
            )}

            <fieldset className="mt-4">
              <legend className="sr-only">Nguồn hồ sơ đính kèm</legend>
              <div className="flex flex-col gap-2.5">
                <div
                  className={`rounded-xl border transition-colors ${
                    cvSource === "existing"
                      ? "border-accent bg-accent-subtle/45"
                      : "border-rule bg-paper"
                  }`}
                >
                  <label
                    htmlFor="apply-cv-existing"
                    className={`flex items-start gap-3 p-4 ${
                      cvs.length === 0 ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      id="apply-cv-existing"
                      type="radio"
                      name="cv-source"
                      value="existing"
                      checked={cvSource === "existing"}
                      disabled={cvs.length === 0}
                      onChange={() => {
                        setCvSource("existing");
                        setErrors((current) => ({ ...current, cv: undefined }));
                      }}
                      className="mt-0.5 h-6 w-6 shrink-0 accent-accent"
                      aria-required="true"
                      aria-describedby={errors.cv ? "apply-cv-error" : undefined}
                    />
                    <span className="min-w-0">
                      <span className="block text-base font-bold leading-5 text-ink">
                        Dùng hồ sơ hiện có
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-ink-2">
                        {cvs.length === 0
                          ? "Bạn chưa lưu hồ sơ nào. Tải lên tệp mới để tiếp tục."
                          : cvSource === "existing" && selectedCv?.isDefault
                            ? "Hồ sơ mặc định đang được chọn sẵn."
                            : "Chọn một trong các hồ sơ bạn đã lưu."}
                      </span>
                    </span>
                  </label>

                  {cvSource === "existing" && cvs.length > 0 && (
                    <div className="px-4 pb-4 pl-12">
                      {cvs.length > 1 && (
                        <label htmlFor="apply-cv-choice" className="block">
                          <span className="text-xs font-semibold text-ink-2">Hồ sơ đính kèm</span>
                          <select
                            id="apply-cv-choice"
                            value={selectedCv?.id ?? ""}
                            onChange={(event) => setSelectedCvId(event.target.value)}
                            className="mt-1.5 min-h-11 w-full rounded-lg border border-rule bg-paper px-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent focus:ring-offset-1"
                          >
                            {cvs.map((cv) => (
                              <option key={cv.id} value={cv.id}>
                                {cv.label}
                                {cv.isDefault ? " · Mặc định" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      {selectedCv && <CvRow cv={selectedCv} className="mt-2.5" />}
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl border transition-colors ${
                    cvSource === "upload"
                      ? "border-accent bg-accent-subtle/45"
                      : "border-rule bg-paper"
                  }`}
                >
                  <label
                    htmlFor="apply-cv-upload"
                    className="flex cursor-pointer items-start gap-3 p-4"
                  >
                    <input
                      id="apply-cv-upload"
                      type="radio"
                      name="cv-source"
                      value="upload"
                      checked={cvSource === "upload"}
                      onChange={() => {
                        setCvSource("upload");
                        setErrors((current) => ({ ...current, cv: undefined }));
                      }}
                      className="mt-0.5 h-6 w-6 shrink-0 accent-accent"
                      aria-required="true"
                      aria-describedby={errors.cv ? "apply-cv-error" : undefined}
                    />
                    <span className="min-w-0">
                      <span className="block text-base font-bold leading-5 text-ink">
                        Tải lên hồ sơ mới
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-ink-2">
                        Tệp được thêm vào danh sách hồ sơ và dùng cho đơn này.
                      </span>
                    </span>
                  </label>

                  <div className="px-4 pb-4 pl-12">
                    {atCvLimit ? (
                      <p className="rounded-lg border border-rule bg-paper px-3 py-2.5 text-xs leading-5 text-ink-2">
                        Bạn đã có {MAX_CV_COUNT}/{MAX_CV_COUNT} hồ sơ.{" "}
                        <Link
                          to="/can/cvs"
                          className="font-semibold text-accent underline-offset-2 hover:underline"
                        >
                          Xóa bớt một hồ sơ
                        </Link>{" "}
                        trước khi tải lên tệp mới.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <label
                            htmlFor="apply-cv-file"
                            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-rule bg-paper px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:bg-accent-subtle/60 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 ${
                              uploadChecking || uploading ? "pointer-events-none opacity-60" : ""
                            }`}
                          >
                            <UploadCloud size={16} aria-hidden="true" className="text-accent" />
                            Chọn tệp
                            <input
                              id="apply-cv-file"
                              type="file"
                              accept={CV_ACCEPT_ATTRIBUTE}
                              className="sr-only"
                              disabled={uploading || uploadChecking}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                void pickFile(file);
                              }}
                            />
                          </label>
                          <span
                            className="min-w-0 flex-1 truncate text-sm text-ink-2"
                            title={uploadFile?.name}
                          >
                            {uploadChecking
                              ? "Đang kiểm tra tệp…"
                              : uploadFile
                                ? "Đã chọn tệp"
                                : "Chưa chọn tệp"}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-ink-3">
                          PDF, DOC hoặc DOCX · tối đa 10 MB · không đặt mật khẩu cho tệp.
                        </p>

                        {cvSource === "upload" && (
                          <>
                            {uploadError && (
                              <p
                                role="alert"
                                className="mt-2 flex items-start gap-2 rounded-lg border border-error/25 bg-error-container px-3 py-2.5 text-xs font-medium leading-5 text-on-error-container"
                              >
                                <CircleAlert
                                  size={15}
                                  className="mt-0.5 shrink-0"
                                  aria-hidden="true"
                                />
                                {uploadError}
                              </p>
                            )}

                            {uploadFile && (
                              <div className="mt-2.5 flex items-start gap-2.5 rounded-lg border border-rule bg-paper px-3 py-2.5">
                                <FileText
                                  size={18}
                                  className="mt-0.5 shrink-0 text-accent"
                                  aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="text-sm font-semibold text-ink"
                                    style={{ overflowWrap: "anywhere" }}
                                  >
                                    {uploadFile.name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-ink-3">
                                    {formatFileSize(uploadFile.size)} ·{" "}
                                    {detectCvFormat(uploadFile.name)}
                                  </p>
                                </div>
                                {!uploading && (
                                  <button
                                    type="button"
                                    onClick={clearUpload}
                                    aria-label="Bỏ chọn tệp"
                                    className={`-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink ${focusRing}`}
                                  >
                                    <X size={16} aria-hidden="true" />
                                  </button>
                                )}
                              </div>
                            )}

                            {uploadFile && !uploading && (
                              <>
                                <label
                                  htmlFor="apply-cv-sensitive"
                                  className="mt-3 flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-ink-2"
                                >
                                  <input
                                    id="apply-cv-sensitive"
                                    type="checkbox"
                                    checked={uploadConfirmed}
                                    onChange={(event) => setUploadConfirmed(event.target.checked)}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                                  />
                                  <span>
                                    Tệp không chứa số căn cước công dân, thông tin tài khoản ngân
                                    hàng hoặc mật khẩu.
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  onClick={startUpload}
                                  disabled={!uploadConfirmed || uploadChecking}
                                  className={`mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hover active:bg-accent-deep disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-ink-3 ${focusRing}`}
                                >
                                  <UploadCloud size={16} aria-hidden="true" />
                                  Tải lên và dùng hồ sơ này
                                </button>
                              </>
                            )}

                            {uploading && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between gap-3 text-xs">
                                  <span className="font-semibold text-ink-2">Đang tải lên…</span>
                                  <span className="tabular-nums text-ink-3">{uploadProgress}%</span>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-3">
                                  <div
                                    className="h-full rounded-full bg-accent transition-[width] duration-150"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </fieldset>
          </section>

          <section
            aria-labelledby="apply-contact-heading"
            className="border-t border-rule px-5 py-6 sm:px-8 sm:py-7"
          >
            <SectionTitle id="apply-contact-heading">Thông tin liên hệ</SectionTitle>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper-2 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs text-ink-2">
                {manualEntry ? (
                  <>
                    <Info size={14} className="shrink-0 text-accent" aria-hidden="true" />
                    Đang nhập thủ công.
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="shrink-0 text-mint" aria-hidden="true" />
                    Đã điền từ hồ sơ cá nhân của bạn.
                  </>
                )}
              </p>
              {manualEntry ? (
                <button
                  type="button"
                  onClick={refillFromProfile}
                  className={`inline-flex min-h-9 items-center rounded px-1 py-1 text-xs font-semibold text-accent underline-offset-2 hover:underline ${focusRing}`}
                >
                  Điền lại từ hồ sơ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startManualEntry}
                  className={`inline-flex min-h-9 items-center rounded px-1 py-1 text-xs font-semibold text-accent underline-offset-2 hover:underline ${focusRing}`}
                >
                  Nhập thủ công
                </button>
              )}
            </div>

            {!manualEntry && missingProfile && (
              <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-ink-2">
                <Info size={14} className="mt-0.5 shrink-0 text-accent-2" aria-hidden="true" />
                <span>
                  Hồ sơ cá nhân còn thiếu thông tin nên một số trường chưa được điền. Bổ sung trực
                  tiếp bên dưới hoặc{" "}
                  <Link
                    to="/can/profile"
                    className="font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    cập nhật hồ sơ cá nhân
                  </Link>
                  .
                </span>
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  id="apply-name"
                  label="Họ và tên"
                  required
                  error={errors.name}
                  hint={!errors.name ? "Tối đa 150 ký tự." : undefined}
                >
                  <input
                    id="apply-name"
                    type="text"
                    value={contact.name}
                    maxLength={MAX_NAME_LENGTH}
                    autoComplete="name"
                    placeholder="Ví dụ: Nguyễn Văn An"
                    aria-invalid={Boolean(errors.name)}
                    aria-required="true"
                    aria-describedby={errors.name ? "apply-name-error" : "apply-name-hint"}
                    onChange={(event) => updateContact("name", event.target.value)}
                    className={`${fieldBase} ${fieldRing(Boolean(errors.name))}`}
                  />
                </Field>
              </div>
              <Field id="apply-email" label="Email" required error={errors.email}>
                <input
                  id="apply-email"
                  type="email"
                  value={contact.email}
                  maxLength={254}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="ten@congty.vn"
                  aria-invalid={Boolean(errors.email)}
                  aria-required="true"
                  aria-describedby={errors.email ? "apply-email-error" : undefined}
                  onChange={(event) => updateContact("email", event.target.value)}
                  className={`${fieldBase} ${fieldRing(Boolean(errors.email))}`}
                />
              </Field>
              <Field
                id="apply-phone"
                label="Số điện thoại"
                required
                error={errors.phone}
                hint={!errors.phone ? "10 chữ số, bắt đầu bằng 0." : undefined}
              >
                <input
                  id="apply-phone"
                  type="tel"
                  value={contact.phone}
                  maxLength={10}
                  autoComplete="tel-national"
                  inputMode="numeric"
                  placeholder="0901234567"
                  aria-invalid={Boolean(errors.phone)}
                  aria-required="true"
                  aria-describedby={errors.phone ? "apply-phone-error" : "apply-phone-hint"}
                  onChange={(event) =>
                    updateContact("phone", event.target.value.replace(/[^\d]/g, ""))
                  }
                  className={`${fieldBase} ${fieldRing(Boolean(errors.phone))}`}
                />
              </Field>
            </div>
          </section>

          <section
            aria-labelledby="apply-cover-heading"
            className="border-t border-rule px-5 py-6 sm:px-8 sm:py-7"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 id="apply-cover-heading" className="text-lg font-bold text-ink">
                Thư giới thiệu
                <span className="ml-1.5 text-sm font-medium text-ink-3">(tùy chọn)</span>
              </h2>
              <span
                className={`text-xs tabular-nums ${coverRemaining < 100 ? "font-semibold text-accent-2" : "text-ink-3"}`}
              >
                {cover.length}/{MAX_COVER_LENGTH} ký tự
              </span>
            </div>
            <div className="mt-3">
              <label htmlFor="apply-cover" className="sr-only">
                Thư giới thiệu
              </label>
              <textarea
                id="apply-cover"
                rows={6}
                value={cover}
                maxLength={MAX_COVER_LENGTH}
                placeholder="Giới thiệu ngắn về kinh nghiệm phù hợp với vị trí, hoặc trả lời câu hỏi của nhà tuyển dụng."
                aria-invalid={Boolean(errors.cover)}
                aria-describedby={errors.cover ? "apply-cover-error" : "apply-cover-hint"}
                onChange={(event) => {
                  setCover(event.target.value);
                  setErrors((current) =>
                    current.cover ? { ...current, cover: undefined } : current,
                  );
                }}
                className={`${fieldBase} ${fieldRing(Boolean(errors.cover))} min-h-36 resize-y py-3 leading-6`}
              />
              {errors.cover ? (
                <p
                  id="apply-cover-error"
                  className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-error"
                >
                  <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {errors.cover}
                </p>
              ) : (
                <p id="apply-cover-hint" className="mt-1.5 text-xs leading-5 text-ink-3">
                  Không bắt buộc. Nội dung này đi kèm hồ sơ bạn gửi.
                </p>
              )}
            </div>
          </section>

          <div className="border-t border-rule px-5 py-5 sm:px-8 sm:py-6">
            {(errorKeys.length > 0 || formError) && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-error/25 bg-error-container px-3.5 py-3"
              >
                <p className="flex items-center gap-2 text-sm font-bold text-on-error-container">
                  <CircleAlert size={16} className="shrink-0" aria-hidden="true" />
                  {formError || "Chưa gửi được. Kiểm tra các mục sau:"}
                </p>
                {errorKeys.length > 0 && (
                  <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 pl-6 text-xs font-medium text-on-error-container">
                    {errorKeys.map((key) => (
                      <li key={key}>
                        <a
                          href={`#apply-${key === "cv" ? "cv-existing" : key}`}
                          onClick={(event) => {
                            event.preventDefault();
                            focusField(key);
                          }}
                          className="underline underline-offset-2 hover:no-underline"
                        >
                          {key === "name"
                            ? "Họ và tên"
                            : key === "email"
                              ? "Email"
                              : key === "phone"
                                ? "Số điện thoại"
                                : key === "cv"
                                  ? "Hồ sơ đính kèm"
                                  : "Thư giới thiệu"}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 text-base font-bold text-accent-ink transition-colors hover:bg-accent-hover active:bg-accent-deep disabled:cursor-not-allowed disabled:bg-accent/60 ${focusRing}`}
            >
              {submitting ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Đang gửi hồ sơ…
                </>
              ) : (
                <>
                  <Send size={17} aria-hidden="true" />
                  Gửi hồ sơ ứng tuyển
                </>
              )}
            </button>
            <p className="mt-2.5 text-center text-xs leading-5 text-ink-3">
              Gửi xong, hồ sơ và thông tin liên hệ ở trên được chuyển tới{" "}
              {job.company || "nhà tuyển dụng"}.
            </p>
          </div>
        </form>
      </div>
    </Shell>
  );
}

function CvRow({ cv, className = "" }: { cv: CandidateCv; className?: string }) {
  return (
    <div className={`flex items-start gap-2.5 border-t border-accent/15 pt-3 ${className}`}>
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent/20 bg-paper text-accent"
      >
        <FileText size={15} />
      </span>
      <div className="min-w-0 flex-1">
        {cv.previewUrl ? (
          <a
            href={cv.previewUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm font-semibold text-accent-deep underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
          >
            {cv.fileName}
          </a>
        ) : (
          <p
            className="text-sm font-semibold text-accent-deep"
            style={{ overflowWrap: "anywhere" }}
          >
            {cv.fileName}
          </p>
        )}
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-3">
          {cv.isDefault && (
            <span className="rounded border border-accent/25 bg-paper px-1.5 py-0.5 text-[10px] font-bold   text-accent-deep">
              Mặc định
            </span>
          )}
          <span>
            {cv.format} · {formatFileSize(cv.sizeBytes)} · Tải lên {formatCvDate(cv.uploadedAt)}
          </span>
        </p>
      </div>
      {cv.previewUrl && (
        <a
          href={cv.previewUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Xem trước ${cv.fileName}`}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-accent transition-colors hover:bg-paper ${focusRing}`}
        >
          <Eye size={16} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
