import { useCandidateProfile, useRefreshIdentity } from "@/hooks/useAccountIdentity";
import { updateCandidatePhone } from "@/services/candidateProfile";
import { accountError } from "@/services/accountControl";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { FloatingPanel } from "@/components/FloatingPanel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  type CandidateEducation,
  type CandidateExperience,
  type CandidateProfileDetails,
} from "@/context/CandidateContext";
import { getCandidateCvs, type CandidateCv as CandidateCvRecord } from "@/services/candidateCv";
import { ApiError } from "@/services/api";
import { clearAuthSession } from "@/services/auth";
import {
  loadCandidateProfile as loadApiProfile,
  updateCandidateProfile as saveApiProfile,
  toLocalPhone,
  type ExperienceEntry as ApiExperienceEntry,
  type EducationEntry as ApiEducationEntry,
  type CandidateProfile as ApiCandidateProfile,
} from "@/services/candidateProfile";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  FileText,
  Info,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type ExperienceEntry = CandidateExperience;
type EducationEntry = CandidateEducation;
type EditSection = "all" | "basics" | "about" | "experience" | "education" | "skills";

const MAX_NAME_LENGTH = 100;
const MAX_ABOUT_LENGTH = 1000;
const MAX_SKILLS = 20;
const MAX_SKILL_LENGTH = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^(?:0|\+84)\d{9}$/;
const PROFILE_ROLE_OPTIONS = [
  "Chuyên viên kinh doanh",
  "Chuyên viên tiếp thị",
  "Chuyên viên kế toán",
  "Chuyên viên nhân sự",
  "Chuyên viên vận hành",
  "Kỹ sư phần mềm",
  "Quản lý",
];

export const Route = createFileRoute("/can/profile")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Hồ sơ cá nhân — GuardianWork" },
      {
        name: "description",
        content:
          "Cập nhật thông tin, kinh nghiệm, học vấn và kỹ năng trong hồ sơ ứng viên GuardianWork.",
      },
    ],
  }),
  component: CandidateProfilePage,
});

function mapApiProfileToDetails(
  api: ApiCandidateProfile,
  current: CandidateProfileDetails,
): CandidateProfileDetails {
  return {
    ...current,
    fullName: api.fullName,
    firstName: api.firstName,
    lastName: api.lastName,
    email: api.email ?? current.email,
    phone: toLocalPhone(api.phoneNumber),
    avatarUrl: api.avatarUrl,
    isPublic: api.isPublic,
    skills: api.skills,
    experiences:
      api.experience?.map((entry: ApiExperienceEntry, index) => ({
        title: entry.role,
        company: entry.company,
        from: entry.startDate,
        to: entry.endDate || "",
        description: entry.description || "",
      })) ?? current.experiences,
    education:
      api.education?.map((entry: ApiEducationEntry, index) => ({
        degree: entry.degree,
        school: entry.institution,
        from: entry.startYear,
        to: entry.endYear || "",
        description: entry.description || "",
      })) ?? current.education,
  };
}

function toApiExperience(entry: CandidateExperience): ApiExperienceEntry {
  return {
    company: entry.company,
    role: entry.title,
    startDate: entry.from,
    endDate: entry.to || null,
    description: entry.description || null,
  };
}

function toApiEducation(entry: CandidateEducation): ApiEducationEntry {
  return {
    institution: entry.school,
    degree: entry.degree,
    startYear: entry.from,
    endYear: entry.to || null,
    description: entry.description?.trim() ? entry.description.trim() : null,
  };
}

function apiProfileExperiences(entries: CandidateExperience[]): ApiExperienceEntry[] {
  return entries.map(toApiExperience);
}

function apiProfileEducation(entries: CandidateEducation[]): ApiEducationEntry[] {
  return entries.map(toApiEducation);
}

function currentAvatarUrl(profile: CandidateProfileDetails): string | undefined {
  return profile.avatarUrl ? profile.avatarUrl : undefined;
}

function CandidateProfilePage() {
  const user = useAuthUser();
  const serverProfile = useCandidateProfile();
  const refreshIdentity = useRefreshIdentity();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { profileDetails: profile, setProfileDetails } = useCandidate();
  const [candidateCvs, setCandidateCvs] = useState<CandidateCvRecord[]>([]);
  const defaultCv = candidateCvs.find((cv) => cv.isDefault);
  const [customRoleIndexes, setCustomRoleIndexes] = useState<Record<number, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [skillsDraft, setSkillsDraft] = useState<string[]>(profile.skills);
  const [skillInput, setSkillInput] = useState("");
  const [skillNotice, setSkillNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [editSection, setEditSection] = useState<EditSection>("all");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const currentRole = profile.experiences[0]?.title || "Chưa cập nhật chức danh";
  const contactEmail = profile.email.trim() || user?.email || "";
  const errorCount = Object.keys(fieldErrors).length;

  useEffect(() => {
    if (isEditing) return;
    setDraft(profile);
    setSkillsDraft(profile.skills);
    setSkillInput("");
    setSkillNotice("");
  }, [isEditing, profile]);

  useEffect(() => {
    let active = true;
    setIsApiLoading(true);
    setApiError("");
    void loadApiProfile()
      .then((apiProfile) => {
        if (!active) return;
        setProfileDetails((current) => mapApiProfileToDetails(apiProfile, current));
      })
      .catch((cause) => {
        if (!active) return;
        const error = cause as { status?: number };
        if (error.status === 401) {
          window.location.assign("/login?role=candidate");
          return;
        }
        setApiError("Không tải được hồ sơ. Vui lòng thử lại.");
      })
      .finally(() => {
        if (active) setIsApiLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setProfileDetails]);

  useEffect(() => {
    let active = true;
    void getCandidateCvs()
      .then((data) => {
        if (active) setCandidateCvs(data);
      })
      .catch((cause) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) {
          clearAuthSession();
          window.location.assign("/login?role=candidate");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing]);

  const openEditForm = (section: EditSection = "all", index: number | null = null) => {
    setDraft(profile);
    setSkillsDraft(profile.skills);
    setSkillInput("");
    setSkillNotice("");
    setFieldErrors({});
    setSuccessMessage("");
    setIsSuccessDialogOpen(false);
    setEditSection(section);
    setEditIndex(index);
    setIsEditing(true);
  };

  const closeEditForm = () => {
    if (!saving) setIsEditing(false);
  };

  const clearFieldError = (key: string) => {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateDraft = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: string) => {
    setDraft((current) => ({
      ...current,
      experiences: current.experiences.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
    clearFieldError(`experiences.${index}.${field}`);
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setDraft((current) => ({
      ...current,
      education: current.education.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
    clearFieldError(`education.${index}.${field}`);
  };

  const addExperience = () => {
    setCustomRoleIndexes((current) => ({ ...current, [draft.experiences.length]: true }));
    setDraft((current) => ({
      ...current,
      experiences: [
        ...current.experiences,
        { title: "", company: "", from: "", to: "", description: "" },
      ],
    }));
  };

  const addEducation = () => {
    setDraft((current) => ({
      ...current,
      education: [
        ...current.education,
        { degree: "", school: "", from: "", to: "", description: "" },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setDraft((current) => ({
      ...current,
      education: current.education.filter((_, entryIndex) => entryIndex !== index),
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`education.${index}.`)) delete next[key];
      });
      return next;
    });
  };

  const removeExperience = (index: number) => {
    setDraft((current) => ({
      ...current,
      experiences: current.experiences.filter((_, entryIndex) => entryIndex !== index),
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`experiences.${index}.`)) delete next[key];
      });
      return next;
    });
  };

  const addSkill = (raw: string) => {
    const value = raw.replace(/\s+/g, " ").trim();
    if (!value) return;
    if (value.length > MAX_SKILL_LENGTH) {
      setSkillNotice(`Mỗi kỹ năng tối đa ${MAX_SKILL_LENGTH} ký tự.`);
      return;
    }
    if (skillsDraft.length >= MAX_SKILLS) {
      setSkillNotice(`Đã đạt tối đa ${MAX_SKILLS} kỹ năng. Xóa bớt để thêm kỹ năng mới.`);
      return;
    }
    if (skillsDraft.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      setSkillNotice("Kỹ năng này đã có trong danh sách.");
      return;
    }
    setSkillsDraft((current) => [...current, value]);
    setSkillInput("");
    setSkillNotice("");
    clearFieldError("skills");
  };

  const removeSkill = (skill: string) => {
    setSkillsDraft((current) => current.filter((item) => item !== skill));
    setSkillNotice("");
  };

  const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(skillInput);
      return;
    }
    if (event.key === "Backspace" && !skillInput && skillsDraft.length > 0) {
      setSkillsDraft((current) => current.slice(0, -1));
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !serverProfile.data) return;
    setSaveError("");

    const pendingSkill = skillInput.replace(/\s+/g, " ").trim();
    const skillsForSave =
      pendingSkill &&
      !skillsDraft.some((skill) => skill.toLowerCase() === pendingSkill.toLowerCase())
        ? [...skillsDraft, pendingSkill]
        : skillsDraft;

    const errors = validateDraft(draft, skillsForSave, editSection, editIndex);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSuccessMessage("");
      const firstKey = Object.keys(errors)[0];
      window.requestAnimationFrame(() => {
        document.getElementById(fieldIdFromError(firstKey))?.focus();
      });
      return;
    }

    const touches = (target: EditSection) => editSection === "all" || editSection === target;
    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const cleanExperiences = draft.experiences.map((entry) => ({
      ...entry,
      title: entry.title.trim(),
      company: entry.company.trim(),
      description: (entry.description || "").trim(),
    }));
    const cleanEducation = draft.education.map((entry) => ({
      ...entry,
      degree: entry.degree.trim(),
      school: entry.school.trim(),
      description: (entry.description || "").trim(),
    }));

    // Each edit mode writes back only the group it owns; everything else stays untouched.
    const experiences =
      touches("experience") && editSection === "experience" && editIndex !== null
        ? profile.experiences.map((entry, index) =>
            index === editIndex ? cleanExperiences[editIndex] : entry,
          )
        : touches("experience")
          ? cleanExperiences
          : profile.experiences;
    const education =
      touches("education") && editSection === "education" && editIndex !== null
        ? profile.education.map((entry, index) =>
            index === editIndex ? cleanEducation[editIndex] : entry,
          )
        : touches("education")
          ? cleanEducation
          : profile.education;

    const nextProfile: CandidateProfileDetails = {
      ...profile,
      firstName: touches("basics") ? firstName : profile.firstName,
      lastName: touches("basics") ? lastName : profile.lastName,
      phone: touches("basics") ? draft.phone.trim() : profile.phone,
      experience: touches("about") ? draft.experience.trim() : profile.experience,
      skills: touches("skills") ? skillsForSave : profile.skills,
      experiences,
      education,
    };

    setSaving(true);
    try {
      const persisted = await updateCandidatePhone(
        {
          ...serverProfile.data,
          firstName: nextProfile.firstName,
          lastName: nextProfile.lastName,
          skills: nextProfile.skills,
          experienceSummary: nextProfile.experience,
          // Detailed experience/education records keep their incumbent local flow;
          // never discard the server education summary in a full PUT.
          avatarUrl: nextProfile.avatarUrl,
          isPublic: nextProfile.isPublic,
        },
        nextProfile.phone,
      );
      nextProfile.fullName = persisted.fullName;
      nextProfile.firstName = persisted.firstName;
      nextProfile.lastName = persisted.lastName;
      nextProfile.phone = persisted.phoneNumber || "";
    } catch (cause) {
      setSaveError(accountError(cause, "identity"));
      setSaving(false);
      return;
    }
    try {
      await refreshIdentity();
    } catch {
      setSaveError(
        "Đã lưu nhưng chưa tải lại được danh tính. Hãy tải lại trang trước khi tiếp tục.",
      );
    }
    setSaving(false);
    setProfileDetails(nextProfile);
    setDraft(nextProfile);
    setSkillsDraft(nextProfile.skills);
    setSkillInput("");
    setSkillNotice("");
    setFieldErrors({});
    setSuccessMessage(getSuccessMessage(editSection));
    setIsSuccessDialogOpen(true);
    setIsEditing(false);
  };

  const readinessItems = [
    {
      label: "Thông tin cá nhân",
      done: Boolean(
        profile.fullName.trim() &&
        EMAIL_PATTERN.test(contactEmail) &&
        PHONE_PATTERN.test(profile.phone),
      ),
    },
    { label: "Giới thiệu", done: Boolean(profile.experience.trim()) },
    { label: "Kinh nghiệm", done: profile.experiences.length > 0 },
    { label: "Học vấn", done: profile.education.length > 0 },
    { label: "Kỹ năng", done: profile.skills.length > 0 },
    { label: "Hồ sơ xin việc", done: candidateCvs.length > 0 },
  ];
  const completedCount = readinessItems.filter((item) => item.done).length;
  const missingLabels = readinessItems.filter((item) => !item.done).map((item) => item.label);
  const initial = user?.firstName?.slice(0, 1) || profile.fullName.slice(0, 1) || "U";

  if (serverProfile.isPending || serverProfile.isError)
    return (
      <AdminShell title="Hồ sơ của tôi" role="candidate">
        <h1>Hồ sơ cá nhân</h1>
        <p role={serverProfile.isError ? "alert" : "status"}>
          {serverProfile.isError ? accountError(serverProfile.error) : "Đang tải hồ sơ…"}
        </p>
        {serverProfile.isError && (
          <button className="btn mt-4" onClick={() => void serverProfile.refetch()}>
            Tải lại hồ sơ
          </button>
        )}
      </AdminShell>
    );
  return (
    <AdminShell title="Hồ sơ của tôi" role="candidate">
      <div className="mx-auto max-w-6xl caret-accent selection:bg-accent selection:text-accent-ink">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[clamp(32px,3.8vw,52px)] font-extrabold leading-[1.2] tracking-[-0.035em] text-ink">
              Hồ sơ cá nhân
            </h1>
            <p className="mt-1.5 max-w-[62ch] text-sm leading-6 text-ink-2">
              Thông tin hiển thị với nhà tuyển dụng và trạng thái hồ sơ của bạn.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openEditForm("all")}
            className="btn min-h-11 shrink-0 px-5 text-sm"
          >
            <Pencil size={16} strokeWidth={2.2} aria-hidden="true" />
            Chỉnh sửa hồ sơ
          </button>
        </header>

        <p className="mb-5 text-sm leading-6 text-ink-3">
          Họ, tên, liên hệ, kỹ năng và giới thiệu được lưu trên tài khoản. Các mục kinh nghiệm, học
          vấn chi tiết bên dưới là bản minh họa cục bộ trong trình duyệt.
        </p>
        {isEditing && (
          <FloatingPanel isOpen={true} onClose={closeEditForm} labelledBy="edit-profile-title">
            <form onSubmit={handleSave} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-rule px-5 py-5 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2
                      id="edit-profile-title"
                      className="text-lg font-bold leading-[1.45] tracking-[-0.02em] text-ink"
                    >
                      {getEditorTitle(editSection)}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-ink-2">
                      {getEditorDescription(editSection)}
                    </p>
                    <p className="mt-2 text-xs leading-4 font-medium text-ink-3">
                      Trường đánh dấu <span className="font-bold text-error">*</span> là bắt buộc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditForm}
                    aria-label="Đóng"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                {errorCount > 0 && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-3 rounded-xl border border-error/25 bg-error-container px-4 py-3"
                  >
                    <CircleAlert
                      size={18}
                      className="mt-0.5 shrink-0 text-on-error-container"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-error-container">
                        Chưa lưu được thay đổi
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-on-error-container">
                        {errorCount} trường chưa hợp lệ. Kiểm tra các ô được đánh dấu rồi lưu lại.
                      </p>
                    </div>
                  </div>
                )}

                {saveError && (
                  <p role="alert" className="mb-4 text-sm text-error">
                    {saveError}
                  </p>
                )}
                <fieldset disabled={saving} className="grid gap-4 md:grid-cols-2">
                  {(editSection === "all" || editSection === "basics") && (
                    <>
                      {editSection === "all" && (
                        <div className="md:col-span-2">
                          <FormSectionLabel title="Thông tin cá nhân" />
                        </div>
                      )}
                      {(
                        [
                          ["lastName", "Họ", "family-name"],
                          ["firstName", "Tên", "given-name"],
                        ] as const
                      ).map(([field, label, autoComplete]) => (
                        <div key={field}>
                          <FieldHeader
                            htmlFor={`profile-${field}`}
                            label={label}
                            required
                            counter={`${draft[field].length}/${MAX_NAME_LENGTH}`}
                          />
                          <input
                            id={`profile-${field}`}
                            maxLength={MAX_NAME_LENGTH}
                            type="text"
                            autoComplete={autoComplete}
                            value={draft[field]}
                            onChange={(event) => updateDraft(field, event.target.value)}
                            aria-invalid={Boolean(fieldErrors[field])}
                            aria-describedby={
                              fieldErrors[field] ? `profile-${field}-error` : undefined
                            }
                            className={fieldClass(fieldErrors[field])}
                          />
                          <FieldError id={`profile-${field}-error`} message={fieldErrors[field]} />
                        </div>
                      ))}
                      <div className="md:col-span-2">
                        <FieldHeader htmlFor="profile-email" label="Email đã đăng ký" />
                        <input
                          id="profile-email"
                          value={profile.email}
                          readOnly
                          className={fieldClass()}
                        />
                        <p className="mt-2 text-sm text-ink-3">
                          Email cố định của tài khoản, không thể thay đổi.
                        </p>
                      </div>
                      <div>
                        <FieldHeader htmlFor="profile-phone" label="Số điện thoại" />
                        <input
                          id="profile-phone"
                          maxLength={30}
                          type="tel"
                          autoComplete="tel"
                          value={draft.phone}
                          onChange={(event) => updateDraft("phone", event.target.value)}
                          aria-invalid={Boolean(fieldErrors.phone)}
                          aria-describedby={
                            fieldErrors.phone ? "profile-phone-error" : "profile-phone-hint"
                          }
                          className={fieldClass(fieldErrors.phone)}
                        />
                        <p
                          id="profile-phone-hint"
                          className="mt-1 text-xs leading-4 font-normal text-ink-3"
                        >
                          Số di động Việt Nam dạng 0… hoặc +84… Để trống và lưu để xóa.
                        </p>
                        <FieldError id="profile-phone-error" message={fieldErrors.phone} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldHeader
                          htmlFor="profile-avatar"
                          label="Ảnh đại diện"
                          counter={`${(draft.avatarUrl ?? "").length}/512`}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            id="profile-avatar"
                            type="url"
                            autoComplete="url"
                            placeholder="https://example.com/avatar.jpg"
                            value={draft.avatarUrl ?? ""}
                            maxLength={512}
                            onChange={(event) => updateDraft("avatarUrl", event.target.value)}
                            aria-invalid={Boolean(fieldErrors.avatarUrl)}
                            aria-describedby={
                              fieldErrors.avatarUrl
                                ? "profile-avatar-error profile-avatar-hint"
                                : "profile-avatar-hint"
                            }
                            className={fieldClass(fieldErrors.avatarUrl)}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(
                                "avatarUrl",
                                `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
                                  draft.fullName.trim() || "GuardianWork",
                                )}`,
                              )
                            }
                            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-rule bg-paper px-4 text-xs font-semibold text-ink transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                          >
                            Dùng ảnh mặc định
                          </button>
                        </div>
                        <p
                          id="profile-avatar-hint"
                          className="mt-1 text-xs leading-4 font-normal text-ink-3"
                        >
                          Dán liên kết ảnh hoặc dùng ảnh mặc định.
                        </p>
                        <FieldError id="profile-avatar-error" message={fieldErrors.avatarUrl} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-3 text-sm font-semibold text-ink-2">
                          <input
                            type="checkbox"
                            checked={draft.isPublic}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                isPublic: event.target.checked,
                              }))
                            }
                            className="h-4 w-4"
                          />
                          Cho phép nhà tuyển dụng xem hồ sơ của tôi
                        </label>
                      </div>
                    </>
                  )}

                  {(editSection === "all" || editSection === "about") && (
                    <div className="md:col-span-2">
                      <FieldHeader
                        htmlFor="profile-about"
                        label="Giới thiệu bản thân"
                        counter={`${draft.experience.length}/${MAX_ABOUT_LENGTH}`}
                      />
                      <textarea
                        id="profile-about"
                        rows={5}
                        maxLength={MAX_ABOUT_LENGTH}
                        value={draft.experience}
                        onChange={(event) => updateDraft("experience", event.target.value)}
                        aria-invalid={Boolean(fieldErrors.experience)}
                        aria-describedby={
                          fieldErrors.experience ? "profile-about-error" : undefined
                        }
                        className={fieldClass(fieldErrors.experience)}
                      />
                      <FieldError id="profile-about-error" message={fieldErrors.experience} />
                    </div>
                  )}

                  {(editSection === "all" || editSection === "skills") && (
                    <div className="md:col-span-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <label
                          htmlFor="profile-skill-input"
                          className="text-sm font-semibold text-ink-2"
                        >
                          Kỹ năng chuyên môn
                        </label>
                        <span className="text-xs font-medium tabular-nums text-ink-3">
                          {skillsDraft.length}/{MAX_SKILLS}
                        </span>
                      </div>
                      <div
                        onClick={(event) => {
                          if (event.target === event.currentTarget) {
                            document.getElementById("profile-skill-input")?.focus();
                          }
                        }}
                        className={`mt-1.5 flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-paper px-2 py-1.5 transition-colors focus-within:ring-2 focus-within:ring-accent/20 ${
                          fieldErrors.skills
                            ? "border-error"
                            : "border-rule focus-within:border-accent"
                        }`}
                      >
                        {skillsDraft.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 rounded-md border border-rule bg-paper-2 py-1 pl-2 pr-1 text-xs font-semibold text-ink-2"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              aria-label={`Xóa kỹ năng ${skill}`}
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-ink-3 transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              <X size={12} aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                        <input
                          id="profile-skill-input"
                          type="text"
                          value={skillInput}
                          onChange={(event) => {
                            setSkillInput(event.target.value);
                            setSkillNotice("");
                          }}
                          onKeyDown={handleSkillKeyDown}
                          onBlur={() => {
                            if (skillInput.trim()) addSkill(skillInput);
                          }}
                          placeholder={
                            skillsDraft.length >= MAX_SKILLS
                              ? "Đã đạt tối đa 20 kỹ năng"
                              : "Nhập kỹ năng rồi nhấn Enter"
                          }
                          disabled={skillsDraft.length >= MAX_SKILLS}
                          aria-invalid={Boolean(fieldErrors.skills)}
                          aria-describedby={
                            fieldErrors.skills ? "profile-skill-error" : "profile-skill-hint"
                          }
                          className="min-w-[10rem] flex-1 bg-transparent px-1.5 py-1 text-sm font-normal text-ink outline-none placeholder:text-ink-3 disabled:cursor-not-allowed"
                        />
                      </div>
                      <p
                        id="profile-skill-hint"
                        className="mt-1 text-xs leading-4 font-normal text-ink-3"
                      >
                        Nhấn Enter hoặc dấu phẩy để thêm. Tối đa {MAX_SKILLS} kỹ năng, mỗi kỹ năng
                        từ 1 đến {MAX_SKILL_LENGTH} ký tự.
                      </p>
                      {skillNotice ? (
                        <p role="status" className="mt-1 text-xs font-medium text-ink-3">
                          {skillNotice}
                        </p>
                      ) : null}
                      <FieldError id="profile-skill-error" message={fieldErrors.skills} />
                    </div>
                  )}

                  {(editSection === "all" || editSection === "experience") && (
                    <div className="md:col-span-2">
                      {editIndex === null && <FormSectionLabel title="Kinh nghiệm làm việc" />}
                      <div className="space-y-5">
                        {draft.experiences.map((entry, index) =>
                          editIndex === null || editIndex === index ? (
                            <div
                              key={index}
                              className="border-t border-rule pt-4 first:border-t-0 first:pt-0"
                            >
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-xs font-bold text-accent-deep">
                                  Kinh nghiệm {index + 1}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeExperience(index)}
                                  className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-error transition-colors hover:bg-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                  Xóa
                                </button>
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <FieldHeader
                                    htmlFor={`experience-${index}-title`}
                                    label="Chức danh"
                                    required
                                  />
                                  {customRoleIndexes[index] ||
                                  (!PROFILE_ROLE_OPTIONS.includes(entry.title) &&
                                    entry.title.trim() !== "") ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        id={`experience-${index}-title`}
                                        type="text"
                                        maxLength={100}
                                        value={entry.title}
                                        placeholder="Nhập chức danh khác"
                                        onChange={(event) =>
                                          updateExperience(index, "title", event.target.value)
                                        }
                                        aria-required="true"
                                        aria-invalid={Boolean(
                                          fieldErrors[`experiences.${index}.title`],
                                        )}
                                        className={fieldClass(
                                          fieldErrors[`experiences.${index}.title`],
                                        )}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCustomRoleIndexes((current) => ({
                                            ...current,
                                            [index]: false,
                                          }));
                                          updateExperience(index, "title", "");
                                        }}
                                        className="shrink-0 text-xs font-semibold text-accent underline-offset-2 hover:underline"
                                      >
                                        Chọn từ danh sách
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      id={`experience-${index}-title`}
                                      value={entry.title}
                                      onChange={(event) => {
                                        const value = event.target.value;
                                        if (value === "custom") {
                                          setCustomRoleIndexes((current) => ({
                                            ...current,
                                            [index]: true,
                                          }));
                                          updateExperience(index, "title", "");
                                        } else {
                                          setCustomRoleIndexes((current) => ({
                                            ...current,
                                            [index]: false,
                                          }));
                                          updateExperience(index, "title", value);
                                        }
                                      }}
                                      aria-required="true"
                                      aria-invalid={Boolean(
                                        fieldErrors[`experiences.${index}.title`],
                                      )}
                                      className={fieldClass(
                                        fieldErrors[`experiences.${index}.title`],
                                      )}
                                    >
                                      <option value="" disabled>
                                        Chọn chức danh
                                      </option>
                                      {PROFILE_ROLE_OPTIONS.map((role) => (
                                        <option key={role} value={role}>
                                          {role}
                                        </option>
                                      ))}
                                      <option value="custom">Khác (tự nhập)</option>
                                    </select>
                                  )}
                                  <FieldError
                                    id={`experience-${index}-title-error`}
                                    message={fieldErrors[`experiences.${index}.title`]}
                                  />
                                </div>
                                {(
                                  [["company", "Công ty / Địa điểm", "Nhập công ty."]] as const
                                ).map(([field, label, requiredMessage]) => (
                                  <div key={field}>
                                    <FieldHeader
                                      htmlFor={`experience-${index}-${field}`}
                                      label={label}
                                      required
                                    />
                                    <input
                                      id={`experience-${index}-${field}`}
                                      type="text"
                                      maxLength={100}
                                      value={entry[field]}
                                      placeholder={requiredMessage}
                                      onChange={(event) =>
                                        updateExperience(index, field, event.target.value)
                                      }
                                      aria-required="true"
                                      aria-invalid={Boolean(
                                        fieldErrors[`experiences.${index}.${field}`],
                                      )}
                                      aria-describedby={
                                        fieldErrors[`experiences.${index}.${field}`]
                                          ? `experience-${index}-${field}-error`
                                          : undefined
                                      }
                                      className={fieldClass(
                                        fieldErrors[`experiences.${index}.${field}`],
                                      )}
                                    />
                                    <FieldError
                                      id={`experience-${index}-${field}-error`}
                                      message={fieldErrors[`experiences.${index}.${field}`]}
                                    />
                                  </div>
                                ))}
                                <DateRangeFields
                                  from={entry.from}
                                  to={entry.to}
                                  fromError={fieldErrors[`experiences.${index}.from`]}
                                  toError={fieldErrors[`experiences.${index}.to`]}
                                  onChange={(field, value) => updateExperience(index, field, value)}
                                  idPrefix={`experience-${index}`}
                                />
                                <div className="md:col-span-2">
                                  <FieldHeader
                                    htmlFor={`experience-${index}-description`}
                                    label="Mô tả công việc"
                                    counter={`${entry.description.length}/1000`}
                                  />
                                  <textarea
                                    id={`experience-${index}-description`}
                                    rows={3}
                                    maxLength={1000}
                                    value={entry.description}
                                    onChange={(event) =>
                                      updateExperience(index, "description", event.target.value)
                                    }
                                    aria-required="true"
                                    aria-invalid={Boolean(
                                      fieldErrors[`experiences.${index}.description`],
                                    )}
                                    aria-describedby={
                                      fieldErrors[`experiences.${index}.description`]
                                        ? `experience-${index}-description-error`
                                        : undefined
                                    }
                                    className={fieldClass(
                                      fieldErrors[`experiences.${index}.description`],
                                    )}
                                  />
                                  <FieldError
                                    id={`experience-${index}-description-error`}
                                    message={fieldErrors[`experiences.${index}.description`]}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : null,
                        )}

                        {editIndex === null && (
                          <button
                            type="button"
                            onClick={addExperience}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rule bg-paper px-4 text-sm font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                          >
                            <Plus size={16} aria-hidden="true" />
                            Thêm kinh nghiệm làm việc
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {(editSection === "all" || editSection === "education") && (
                    <div className="md:col-span-2">
                      {editIndex === null && <FormSectionLabel title="Trình độ học vấn" />}
                      <div className="space-y-5">
                        {draft.education.map((education, index) =>
                          editIndex === null || editIndex === index ? (
                            <div
                              key={index}
                              className="border-t border-rule pt-4 first:border-t-0 first:pt-0"
                            >
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-xs font-bold text-accent-deep">
                                  Học vấn {index + 1}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeEducation(index)}
                                  className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-error transition-colors hover:bg-error-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                  Xóa
                                </button>
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                {(
                                  [
                                    ["degree", "Bằng cấp"],
                                    ["school", "Trường / Cơ sở đào tạo"],
                                  ] as const
                                ).map(([field, label]) => (
                                  <div key={field}>
                                    <FieldHeader
                                      htmlFor={`education-${index}-${field}`}
                                      label={label}
                                      required
                                    />
                                    <input
                                      id={`education-${index}-${field}`}
                                      type="text"
                                      maxLength={field === "school" ? 150 : 100}
                                      value={education[field]}
                                      onChange={(event) =>
                                        updateEducation(index, field, event.target.value)
                                      }
                                      aria-required="true"
                                      aria-invalid={Boolean(
                                        fieldErrors[`education.${index}.${field}`],
                                      )}
                                      aria-describedby={
                                        fieldErrors[`education.${index}.${field}`]
                                          ? `education-${index}-${field}-error`
                                          : undefined
                                      }
                                      className={fieldClass(
                                        fieldErrors[`education.${index}.${field}`],
                                      )}
                                    />
                                    <FieldError
                                      id={`education-${index}-${field}-error`}
                                      message={fieldErrors[`education.${index}.${field}`]}
                                    />
                                  </div>
                                ))}
                                <DateRangeFields
                                  from={education.from}
                                  to={education.to}
                                  fromError={fieldErrors[`education.${index}.from`]}
                                  toError={fieldErrors[`education.${index}.to`]}
                                  onChange={(field, value) => updateEducation(index, field, value)}
                                  idPrefix={`education-${index}`}
                                  toHint="Bỏ trống nếu bạn vẫn đang theo học."
                                />
                                <div className="md:col-span-2">
                                  <FieldHeader
                                    htmlFor={`education-${index}-description`}
                                    label="Mô tả học vấn"
                                    counter={`${(education.description || "").length}/1000`}
                                  />
                                  <textarea
                                    id={`education-${index}-description`}
                                    rows={3}
                                    maxLength={1000}
                                    value={education.description || ""}
                                    onChange={(event) =>
                                      updateEducation(index, "description", event.target.value)
                                    }
                                    className={fieldClass(
                                      fieldErrors[`education.${index}.description`],
                                    )}
                                  />
                                  <FieldError
                                    id={`education-${index}-description-error`}
                                    message={fieldErrors[`education.${index}.description`]}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : null,
                        )}
                      </div>
                      {editIndex === null && (
                        <button
                          type="button"
                          onClick={addEducation}
                          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-rule bg-paper px-4 text-sm font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                          <Plus size={16} aria-hidden="true" />
                          Thêm trình độ học vấn
                        </button>
                      )}
                    </div>
                  )}
                </fieldset>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-rule bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p className="text-xs leading-4 text-ink-3"></p>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditForm}
                    className="btn btn--secondary min-h-11 px-4 text-sm"
                  >
                    Hủy
                  </button>
                  <button type="submit" disabled={saving} className="btn min-h-11 px-5 text-sm">
                    {saving ? "Đang lưu…" : "Lưu thay đổi"}
                  </button>
                </div>
              </div>
            </form>
          </FloatingPanel>
        )}

        <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
          <DialogContent hideClose className="max-w-md border-rule bg-paper p-0">
            <DialogHeader className="gap-4 border-b border-rule px-6 pb-5 pt-6 text-left">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint/10 text-mint">
                  <Check size={20} strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-bold text-ink">Đã lưu thay đổi</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-ink-2">
                    {successMessage} Các thông tin còn lại trong hồ sơ được giữ nguyên.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <DialogFooter className="px-6 py-4">
              <button
                type="button"
                onClick={() => setIsSuccessDialogOpen(false)}
                className="btn min-h-10 px-5 text-sm"
              >
                Đóng
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid overflow-hidden rounded-2xl border border-rule bg-paper lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,2fr)]">
          <aside className="border-b border-rule bg-paper-2 px-5 py-6 sm:px-6 lg:border-b-0 lg:border-r lg:px-7 lg:py-8">
            <div>
              <div className="relative w-fit">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Ảnh đại diện"
                    className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-rule sm:h-20 sm:w-20"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent text-2xl font-extrabold text-accent-ink sm:h-20 sm:w-20 sm:text-3xl"
                  >
                    {initial}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper-2 bg-paper text-mint">
                  <BadgeCheck size={18} strokeWidth={2.4} aria-hidden="true" />
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-[-0.03em] text-ink text-pretty [overflow-wrap:anywhere]">
                {profile.fullName}
              </h2>
              <p className="mt-1 text-sm font-semibold leading-5 text-ink-2">
                <span className="text-xs font-medium text-ink-3">Vị trí hiện tại: </span>
                {currentRole}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink-3">
                <MapPin size={14} aria-hidden="true" />
                Việt Nam
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/15 bg-accent-subtle px-2.5 py-1 text-xs font-semibold text-accent-deep">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                Ứng viên đang hoạt động
              </span>
            </div>

            <section className="mt-6 border-t border-rule pt-5" aria-labelledby="contact-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="contact-title" className="text-base font-bold text-ink">
                  Liên hệ
                </h2>
                <EditButton
                  label="Chỉnh sửa thông tin cá nhân"
                  onClick={() => openEditForm("basics")}
                  muted
                />
              </div>
              <div className="mt-1 space-y-3">
                <a
                  href={contactEmail ? `mailto:${contactEmail}` : undefined}
                  className="flex items-start gap-2.5 text-sm text-ink-2 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <Mail size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden="true" />
                  <span className={`min-w-0 break-all ${contactEmail ? "" : "text-ink-3"}`}>
                    {contactEmail || "Chưa cập nhật email."}
                  </span>
                </a>
                <a
                  href={profile.phone ? `tel:${profile.phone}` : undefined}
                  className="flex items-center gap-2.5 text-sm text-ink-2 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <Phone size={16} className="shrink-0 text-ink-3" aria-hidden="true" />
                  <span className={profile.phone ? "" : "text-ink-3"}>
                    {profile.phone || "Chưa cập nhật số điện thoại."}
                  </span>
                </a>
              </div>
            </section>

            <section className="mt-6 border-t border-rule pt-5" aria-labelledby="cv-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="cv-title" className="flex items-center gap-2 text-base font-bold text-ink">
                  <FileText size={16} className="text-accent" aria-hidden="true" />
                  Hồ sơ xin việc
                </h2>
                <span className="rounded-md border border-rule bg-paper px-2 py-0.5 text-xs font-bold tabular-nums text-ink-2">
                  {candidateCvs.length}/{MAX_CV_COUNT}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-ink-2" style={{ overflowWrap: "anywhere" }}>
                {defaultCv ? defaultCv.fileName : "Chưa chọn hồ sơ mặc định."}
              </p>
              {defaultCv ? (
                <p className="mt-1 text-xs text-ink-3">Đang là hồ sơ mặc định.</p>
              ) : null}
              <Link
                to="/can/cvs"
                className="mt-2.5 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Quản lý hồ sơ
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </section>

            <section className="mt-6 border-t border-rule pt-5" aria-labelledby="readiness-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="readiness-title" className="text-base font-bold text-ink">
                  Mức độ hoàn thiện
                </h2>
                <span className="text-xs font-bold tabular-nums text-ink-2">
                  {completedCount}/{readinessItems.length}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-ink-3">
                {completedCount === readinessItems.length
                  ? "Hồ sơ đã có đủ thông tin."
                  : `Còn thiếu: ${missingLabels.join(", ")}.`}
              </p>
            </section>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-rule pt-5">
              <span className="flex items-center gap-2 text-sm font-medium text-ink-2">
                {profile.isPublic ? (
                  <Eye size={16} className="text-ink-3" aria-hidden="true" />
                ) : (
                  <EyeOff size={16} className="text-ink-3" aria-hidden="true" />
                )}
                Hiển thị hồ sơ
              </span>
              <span className="text-base font-bold text-ink">
                {profile.isPublic ? "Đang hiển thị" : "Riêng tư"}
              </span>
            </div>
            <p className="mt-5 text-sm text-ink-3">
              Họ, tên và số điện thoại dùng chung với tài khoản.
            </p>
            <Link
              to="/account"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
            >
              Cài đặt tài khoản và bảo mật
            </Link>
          </aside>

          <div className="min-w-0 divide-y divide-rule">
            <section aria-labelledby="about-title" className="px-5 py-6 sm:px-7 sm:py-7">
              <SectionHeader
                id="about-title"
                title="Giới thiệu bản thân"
                action={
                  <EditButton
                    label="Cập nhật giới thiệu bản thân"
                    onClick={() => openEditForm("about")}
                  />
                }
              />
              <p
                className={`mt-3 max-w-[68ch] text-base leading-7 ${
                  profile.experience ? "text-ink-2" : "text-ink-3"
                }`}
              >
                {profile.experience || "Giới thiệu điểm mạnh và số năm kinh nghiệm của bạn."}
              </p>
            </section>

            <section aria-labelledby="experience-title" className="px-5 py-6 sm:px-7 sm:py-7">
              <SectionHeader
                id="experience-title"
                title="Kinh nghiệm làm việc"
                action={
                  <EditButton
                    label="Chỉnh sửa kinh nghiệm làm việc"
                    onClick={() => openEditForm("experience")}
                  />
                }
              />
              {profile.experiences.length > 0 ? (
                <div className="mt-5 space-y-6">
                  {profile.experiences.map((entry, index) => (
                    <RecordEntry
                      key={`${entry.title}-${entry.from}-${index}`}
                      title={entry.title}
                      meta={entry.company}
                      period={formatPeriod(entry.from, entry.to)}
                      description={entry.description}
                      editLabel={`Chỉnh sửa ${entry.title}`}
                      onEdit={() => openEditForm("experience", index)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  text="Chưa có kinh nghiệm làm việc."
                  actionLabel="Thêm kinh nghiệm"
                  onClick={() => openEditForm("experience")}
                />
              )}
            </section>

            <section aria-labelledby="education-title" className="px-5 py-6 sm:px-7 sm:py-7">
              <SectionHeader
                id="education-title"
                title="Học vấn"
                action={
                  <EditButton label="Chỉnh sửa học vấn" onClick={() => openEditForm("education")} />
                }
              />
              {profile.education.length > 0 ? (
                <div className="mt-5 space-y-6">
                  {profile.education.map((education, index) => (
                    <RecordEntry
                      key={`${education.school}-${education.from}-${index}`}
                      title={education.degree}
                      meta={education.school}
                      period={formatPeriod(education.from, education.to)}
                      editLabel={`Chỉnh sửa ${education.degree || "học vấn"}`}
                      onEdit={() => openEditForm("education", index)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  text="Chưa có thông tin học vấn."
                  actionLabel="Thêm học vấn"
                  onClick={() => openEditForm("education")}
                />
              )}
            </section>

            <section aria-labelledby="skills-title" className="px-5 py-6 sm:px-7 sm:py-7">
              <SectionHeader
                id="skills-title"
                title="Kỹ năng"
                action={
                  <EditButton label="Chỉnh sửa kỹ năng" onClick={() => openEditForm("skills")} />
                }
              />
              {profile.skills.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-md border border-rule bg-paper-2 px-2.5 py-1.5 text-xs font-semibold text-ink-2"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  text="Chưa cập nhật kỹ năng."
                  actionLabel="Cập nhật kỹ năng"
                  onClick={() => openEditForm("skills")}
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function validateDraft(
  draft: CandidateProfileDetails,
  skills: string[],
  section: EditSection,
  editIndex: number | null,
) {
  const errors: Record<string, string> = {};
  const touches = (target: EditSection) => section === "all" || section === target;

  if (touches("basics")) {
    for (const field of ["firstName", "lastName"] as const) {
      if (!draft[field].trim()) errors[field] = "Nhập họ và tên của bạn.";
      else if (draft[field].trim().length > MAX_NAME_LENGTH)
        errors[field] = `Mỗi trường tối đa ${MAX_NAME_LENGTH} ký tự.`;
    }
    if (draft.phone.trim() && !PHONE_PATTERN.test(draft.phone.trim()))
      errors.phone = "Nhập số di động Việt Nam dạng 0… hoặc +84…";
  }

  if (touches("about") && draft.experience.length > MAX_ABOUT_LENGTH) {
    errors.experience = `Phần giới thiệu tối đa ${MAX_ABOUT_LENGTH} ký tự.`;
  }

  if (touches("skills")) {
    if (skills.length > MAX_SKILLS) {
      errors.skills = `Chỉ lưu tối đa ${MAX_SKILLS} kỹ năng. Xóa bớt trước khi lưu.`;
    } else if (skills.some((skill) => skill.length < 1 || skill.length > MAX_SKILL_LENGTH)) {
      errors.skills = `Mỗi kỹ năng phải dài từ 1 đến ${MAX_SKILL_LENGTH} ký tự.`;
    }
  }

  if (touches("experience")) {
    const indices =
      section === "experience" && editIndex !== null
        ? [editIndex]
        : draft.experiences.map((_, index) => index);

    indices.forEach((index) => {
      const entry = draft.experiences[index];
      if (!entry) return;
      if (!entry.title.trim()) errors[`experiences.${index}.title`] = "Nhập chức danh.";
      if (!entry.company.trim()) errors[`experiences.${index}.company`] = "Nhập công ty.";
      if (!entry.from) errors[`experiences.${index}.from`] = "Chọn ngày bắt đầu.";
      if (entry.description.length > 1000) {
        errors[`experiences.${index}.description`] = "Mô tả công việc tối đa 1.000 ký tự.";
      }
      if (entry.from && entry.to && entry.to < entry.from) {
        errors[`experiences.${index}.to`] = "Ngày kết thúc phải sau ngày bắt đầu.";
      }
    });
  }

  if (touches("education")) {
    const indices =
      section === "education" && editIndex !== null
        ? [editIndex]
        : draft.education.map((_, index) => index);

    indices.forEach((index) => {
      const education = draft.education[index];
      if (!education) return;
      if (!education.degree.trim()) errors[`education.${index}.degree`] = "Nhập bằng cấp.";
      if (!education.school.trim()) {
        errors[`education.${index}.school`] = "Nhập trường hoặc cơ sở đào tạo.";
      }
      if (!education.from) errors[`education.${index}.from`] = "Chọn ngày bắt đầu.";
      if (education.description && education.description.length > 1000) {
        errors[`education.${index}.description`] = "Mô tả tối đa 1.000 ký tự.";
      }
      if (education.from && education.to && education.to < education.from) {
        errors[`education.${index}.to`] = "Ngày kết thúc phải sau ngày bắt đầu.";
      }
    });
  }

  return errors;
}

function fieldIdFromError(key: string) {
  switch (key) {
    case "firstName":
      return "profile-firstName";
    case "lastName":
      return "profile-lastName";
    case "email":
      return "profile-email";
    case "phone":
      return "profile-phone";
    case "skills":
      return "profile-skill-input";
    case "experience":
      return "profile-about";
    default: {
      const [group, index, field] = key.split(".");
      return `${group === "experiences" ? "experience" : "education"}-${index}-${field}`;
    }
  }
}

function fieldClass(hasError?: string) {
  return `mt-1.5 min-h-11 w-full rounded-lg border bg-paper px-3.5 py-2.5 text-sm font-normal text-ink outline-none transition-colors placeholder:text-ink-3 focus:ring-2 focus:ring-accent/20 ${
    hasError ? "border-error" : "border-rule focus:border-accent"
  }`;
}

function FieldHeader({
  htmlFor,
  label,
  required = false,
  counter,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  counter?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-2">
        {label}
        {required ? (
          <span className="ml-0.5 text-error" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {counter ? (
        <span className="text-xs font-medium tabular-nums text-ink-3">{counter}</span>
      ) : null}
    </div>
  );
}

function SectionHeader({
  id,
  title,
  action,
}: {
  id: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 id={id} className="text-lg font-bold leading-[1.45] tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {action}
    </div>
  );
}

function EditButton({
  label,
  onClick,
  muted = false,
  className = "",
}: {
  label: string;
  onClick: () => void;
  muted?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
        muted ? "text-ink-3 hover:text-accent" : "text-accent"
      } ${className}`}
    >
      <Pencil size={16} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}

function RecordEntry({
  title,
  meta,
  period,
  description,
  editLabel,
  onEdit,
}: {
  title: string;
  meta: string;
  period: string;
  description?: string;
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <article>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-base font-bold leading-6 text-ink">{title}</h3>
            <span className="text-xs font-semibold tabular-nums text-ink-3">{period}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-ink-2">{meta}</p>
          {description ? (
            <p className="mt-2 max-w-[64ch] text-sm leading-6 text-ink-2">{description}</p>
          ) : null}
        </div>
        <EditButton label={editLabel} onClick={onEdit} muted />
      </div>
    </article>
  );
}

function EmptyState({
  text,
  actionLabel,
  onClick,
}: {
  text: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-dashed border-rule bg-paper-2/60 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-3">{text}</p>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rule bg-paper px-3.5 text-xs font-bold text-accent transition-colors hover:border-accent/40 hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <Plus size={14} aria-hidden="true" />
        {actionLabel}
      </button>
    </div>
  );
}

function FormSectionLabel({ title }: { title: string }) {
  return <h3 className="mb-3 text-base font-bold text-ink">{title}</h3>;
}

function getEditorTitle(section: EditSection) {
  switch (section) {
    case "basics":
      return "Chỉnh sửa thông tin cá nhân";
    case "about":
      return "Chỉnh sửa giới thiệu bản thân";
    case "experience":
      return "Chỉnh sửa kinh nghiệm làm việc";
    case "education":
      return "Chỉnh sửa học vấn";
    case "skills":
      return "Chỉnh sửa kỹ năng";
    default:
      return "Chỉnh sửa thông tin hồ sơ";
  }
}

function getEditorDescription(section: EditSection) {
  switch (section) {
    case "basics":
      return "Cập nhật họ, tên và số điện thoại dùng chung với tài khoản. Email đã đăng ký không thể thay đổi.";
    case "about":
      return "Viết phần giới thiệu ngắn gọn để nhà tuyển dụng hiểu điểm mạnh của bạn.";
    case "experience":
      return "Cập nhật vị trí, công ty, thời gian và mô tả công việc đã làm.";
    case "education":
      return "Bổ sung bằng cấp, cơ sở đào tạo và thời gian học tập của bạn.";
    case "skills":
      return "Thêm hoặc bớt kỹ năng chuyên môn bạn muốn nhà tuyển dụng nhìn thấy.";
    default:
      return "Cập nhật các thông tin được hiển thị nổi bật với nhà tuyển dụng.";
  }
}

function getSuccessMessage(section: EditSection) {
  switch (section) {
    case "basics":
      return "Thông tin cá nhân đã được cập nhật.";
    case "about":
      return "Phần giới thiệu bản thân đã được cập nhật.";
    case "experience":
      return "Kinh nghiệm làm việc đã được cập nhật.";
    case "education":
      return "Học vấn đã được cập nhật.";
    case "skills":
      return "Kỹ năng đã được cập nhật.";
    default:
      return "Thông tin hồ sơ đã được cập nhật.";
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <span id={id} role="alert" className="mt-1 block text-sm font-medium text-error">
      {message}
    </span>
  );
}

function DateRangeFields({
  from,
  to,
  fromError,
  toError,
  onChange,
  idPrefix,
  toHint = "Bỏ trống nếu đang làm việc tại đây.",
}: {
  from: string;
  to: string;
  fromError?: string;
  toError?: string;
  onChange: (field: "from" | "to", value: string) => void;
  idPrefix: string;
  toHint?: string;
}) {
  return (
    <>
      <div>
        <FieldHeader htmlFor={`${idPrefix}-from`} label="Từ ngày" required />
        <input
          id={`${idPrefix}-from`}
          type="month"
          lang="vi"
          value={from}
          onChange={(event) => onChange("from", event.target.value)}
          aria-required="true"
          aria-invalid={Boolean(fromError)}
          aria-describedby={fromError ? `${idPrefix}-from-error` : undefined}
          className={fieldClass(fromError)}
        />
        <FieldError id={`${idPrefix}-from-error`} message={fromError} />
      </div>
      <div>
        <FieldHeader htmlFor={`${idPrefix}-to`} label="Đến ngày" />
        <input
          id={`${idPrefix}-to`}
          type="month"
          lang="vi"
          value={to}
          onChange={(event) => onChange("to", event.target.value)}
          aria-invalid={Boolean(toError)}
          aria-describedby={toError ? `${idPrefix}-to-error` : `${idPrefix}-to-hint`}
          className={fieldClass(toError)}
        />
        <FieldError id={`${idPrefix}-to-error`} message={toError} />
        <span id={`${idPrefix}-to-hint`} className="mt-1 block text-xs font-normal text-ink-3">
          {toHint}
        </span>
      </div>
    </>
  );
}

function formatPeriod(from: string, to: string) {
  const format = (value: string) => {
    if (!value) return "";
    const [year, month] = value.split("-");
    return month ? `${month}/${year}` : year;
  };
  return `${format(from)} – ${to ? format(to) : "Hiện tại"}`;
}
