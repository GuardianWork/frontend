import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Icon } from "@/components/AdminShell";
import { FloatingPanel } from "@/components/FloatingPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCandidate,
  type CandidateEducation,
  type CandidateExperience,
} from "@/context/CandidateContext";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  BriefcaseBusiness,
  Cake,
  Check,
  Pencil,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

type ExperienceEntry = CandidateExperience;
type EducationEntry = CandidateEducation;
type EditSection = "all" | "basics" | "about" | "experience" | "education" | "skills";

export const Route = createFileRoute("/candidate/profile")({
  head: () => ({
    meta: [
      { title: "My Talent Profile & Safeguards — GuardianWork" },
      {
        name: "description",
        content:
          "Manage your verified developer profile, salary floor, skills, and statutory protections.",
      },
    ],
  }),
  component: CandidateProfilePage,
});

function CandidateProfilePage() {
  const user = useAuthUser();
  const { profileDetails: profile, setProfileDetails } = useCandidate();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [skillsInput, setSkillsInput] = useState(profile.skills.join(", "));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [editSection, setEditSection] = useState<EditSection>("all");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const currentRole = profile.experiences[0]?.title || "Chưa cập nhật chức danh";

  useEffect(() => {
    if (isEditing) return;
    setDraft(profile);
    setSkillsInput(profile.skills.join(", "));
  }, [isEditing, profile]);

  const openEditForm = (section: EditSection = "all", index: number | null = null) => {
    setDraft(profile);
    setSkillsInput(profile.skills.join(", "));
    setFieldErrors({});
    setSuccessMessage("");
    setIsSuccessDialogOpen(false);
    setEditSection(section);
    setEditIndex(index);
    setIsEditing((open) => (open && editSection === section && editIndex === index ? false : true));
  };

  const closeEditForm = () => setIsEditing(false);

  const updateDraft = (field: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: string) => {
    setDraft((current) => ({
      ...current,
      experiences: current.experiences.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`experiences.${index}.${field}`];
      return next;
    });
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setDraft((current) => ({
      ...current,
      education: current.education.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`education.${index}.${field}`];
      return next;
    });
  };

  const addExperience = () => {
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
      education: [...current.education, { degree: "", school: "", from: "", to: "" }],
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

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const skills = skillsInput
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const errors: typeof fieldErrors = {};
    if (!draft.fullName.trim() || draft.fullName.trim().length > 150)
      errors.fullName = "Họ tên không được để trống và tối đa 150 ký tự.";
    if (draft.phone && !/^0\d{9}$/.test(draft.phone)) {
      errors.phone = "Nhập đúng 10 chữ số, bắt đầu bằng 0.";
    }
    if (skills.length > 20 || skills.some((skill) => skill.length < 1 || skill.length > 30)) {
      errors.skills = "Tối đa 20 kỹ năng, mỗi kỹ năng dài từ 1 đến 30 ký tự.";
    }
    draft.experiences.forEach((entry, index) => {
      if (!entry.title.trim()) errors[`experiences.${index}.title`] = "Nhập chức danh.";
      if (!entry.company.trim()) errors[`experiences.${index}.company`] = "Nhập công ty.";
      (["title", "company", "from", "to", "description"] as const).forEach((field) => {
        const maxLength =
          field === "description" ? 1000 : field === "company" || field === "title" ? 100 : 256;
        if (entry[field].length > maxLength) {
          errors[`experiences.${index}.${field}`] =
            `Nội dung không được vượt quá ${maxLength} ký tự.`;
        }
      });
      if (!entry.from) errors[`experiences.${index}.from`] = "Chọn ngày bắt đầu.";
      if (entry.to && entry.from && entry.to < entry.from) {
        errors[`experiences.${index}.to`] = "Ngày kết thúc phải sau ngày bắt đầu.";
      }
    });
    draft.education.forEach((education, index) => {
      const hasEducation = Object.values(education).some((value) => value.trim());
      if (hasEducation) {
        (["degree", "school", "from", "to"] as const).forEach((field) => {
          const maxLength = field === "school" ? 150 : field === "degree" ? 100 : 256;
          if (education[field].length > maxLength) {
            errors[`education.${index}.${field}`] =
              `Nội dung không được vượt quá ${maxLength} ký tự.`;
          }
        });
        if (!education.degree.trim()) errors[`education.${index}.degree`] = "Nhập bằng cấp.";
        if (!education.school.trim())
          errors[`education.${index}.school`] = "Nhập trường hoặc cơ sở đào tạo.";
        if (!education.from) errors[`education.${index}.from`] = "Chọn ngày bắt đầu.";
        if (education.to && education.from && education.to < education.from) {
          errors[`education.${index}.to`] = "Ngày kết thúc phải sau ngày bắt đầu.";
        }
      }
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSuccessMessage("");
      return;
    }

    const nextProfile = {
      ...draft,
      fullName: draft.fullName.trim(),
      phone: draft.phone.trim(),
      skills,
      experience: editSection === "about" ? draft.experience.trim() : profile.experience,
      experiences: draft.experiences.map((entry) => ({
        ...entry,
        title: entry.title.trim(),
        company: entry.company.trim(),
        description: entry.description.trim(),
      })),
      education: draft.education,
    };
    nextProfile.education = draft.education.map((education) => ({
      ...education,
      degree: education.degree.trim(),
      school: education.school.trim(),
    }));
    setProfileDetails(nextProfile);
    setDraft(nextProfile);
    setFieldErrors({});
    setSuccessMessage(getSuccessMessage(editSection));
    setIsSuccessDialogOpen(true);
    setIsEditing(false);
  };

  return (
    <AdminShell title="My Talent Profile" role="candidate">
      <div className="mx-auto max-w-6xl rounded-lg bg-surface p-1 sm:p-3 lg:p-5">
        <header className="mb-4 flex items-center justify-between gap-4 px-3 py-2 sm:px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
              Hồ sơ ứng viên
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-ink md:text-3xl">
              Hồ sơ năng lực & quyền lợi bảo vệ
            </h1>
          </div>
        </header>

        <section
          aria-labelledby="profile-summary-title"
          className="mb-5 overflow-hidden rounded-[16px] border border-rule bg-paper"
        >
          <div className="p-4 sm:p-6">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-avatar-bg text-2xl font-extrabold text-ink ring-4 ring-avatar-ring">
                {user?.firstName?.slice(0, 1) || profile.fullName.slice(0, 1) || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2
                      id="profile-summary-title"
                      className="truncate text-[25px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-3xl"
                    >
                      {profile.fullName}
                    </h2>
                    <p className="mt-1 text-[15px] font-bold text-ink-2">{currentRole}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditForm("basics")}
                    aria-label="Chỉnh sửa thông tin cá nhân"
                    className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <Pencil size={17} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-rule pt-4 text-sm sm:grid-cols-2">
              <ContactItem icon={<Mail size={18} />} value={profile.email || user?.email || "—"} />
              <ContactItem icon={<Phone size={18} />} value={profile.phone || "—"} />
              <ContactItem icon={<Cake size={18} />} value="Hồ sơ đã xác minh" />
              <ContactItem icon={<UserRound size={18} />} value="Ứng viên đang hoạt động" />
              <ContactItem icon={<MapPin size={18} />} value="Việt Nam" className="sm:col-span-2" />
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-[16px] border border-rule bg-paper px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-ink">
                Giới thiệu bản thân
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openEditForm("about")}
              aria-label="Cập nhật giới thiệu bản thân"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <Pencil size={17} strokeWidth={2.2} />
            </button>
          </div>
          <p className="mt-2 text-sm text-ink-3">
            {profile.experience || "Giới thiệu điểm mạnh và số năm kinh nghiệm của bạn"}
          </p>
        </section>

        {isEditing && (
          <FloatingPanel isOpen={true} onClose={closeEditForm}>
            <form
              onSubmit={handleSave}
              noValidate
              aria-labelledby="edit-profile-title"
              className="mb-5 rounded-[16px] border border-rule bg-paper p-5 md:p-6"
            >
              <div className="mb-4">
                <h2 id="edit-profile-title" className="text-base font-bold text-ink">
                  {editSection === "all"
                    ? "Chỉnh sửa thông tin hồ sơ"
                    : editSection === "about"
                      ? "Chỉnh sửa giới thiệu bản thân"
                      : editSection === "experience"
                        ? "Chỉnh sửa kinh nghiệm làm việc"
                        : editSection === "education"
                          ? "Chỉnh sửa học vấn"
                          : editSection === "skills"
                            ? "Chỉnh sửa kỹ năng"
                            : "Chỉnh sửa thông tin cá nhân"}
                </h2>
                <p className="mt-1 text-sm text-ink-2">{getEditorDescription(editSection)}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {editSection === "about" && (
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink-3 md:col-span-2">
                    Giới thiệu bản thân
                    <textarea
                      rows={5}
                      value={draft.experience}
                      onChange={(event) => updateDraft("experience", event.target.value)}
                      className="mt-2 w-full resize-y rounded-md border border-rule bg-paper px-3 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                )}
                {(editSection === "all" || editSection === "basics") && (
                  <>
                    <label className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                      Họ tên
                      <input
                        maxLength={150}
                        type="text"
                        value={draft.fullName}
                        onChange={(event) => updateDraft("fullName", event.target.value)}
                        aria-invalid={Boolean(fieldErrors.fullName)}
                        aria-describedby={fieldErrors.fullName ? "full-name-error" : undefined}
                        className={`mt-2 w-full rounded-md border bg-paper px-3 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:ring-2 focus:ring-accent/20 ${
                          fieldErrors.fullName ? "border-error" : "border-rule focus:border-accent"
                        }`}
                      />
                      <FieldError id="full-name-error" message={fieldErrors.fullName} />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                      Số điện thoại
                      <input
                        inputMode="numeric"
                        maxLength={10}
                        type="tel"
                        value={draft.phone}
                        onChange={(event) => updateDraft("phone", event.target.value)}
                        aria-invalid={Boolean(fieldErrors.phone)}
                        aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                        className={`mt-2 w-full rounded-md border bg-paper px-3 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:ring-2 focus:ring-accent/20 ${
                          fieldErrors.phone ? "border-error" : "border-rule focus:border-accent"
                        }`}
                      />
                      <FieldError id="phone-error" message={fieldErrors.phone} />
                    </label>
                  </>
                )}
                {(editSection === "all" || editSection === "skills") && (
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink-3 md:col-span-2">
                    Kỹ năng chuyên môn
                    <input
                      type="text"
                      value={skillsInput}
                      onChange={(event) => setSkillsInput(event.target.value)}
                      placeholder="Phân tách bằng dấu phẩy"
                      aria-invalid={Boolean(fieldErrors.skills)}
                      aria-describedby={fieldErrors.skills ? "skills-error" : undefined}
                      className={`mt-2 w-full rounded-md border bg-paper px-3 py-2.5 text-sm font-normal text-ink outline-none transition-colors placeholder:text-ink-3 focus:ring-2 focus:ring-accent/20 ${
                        fieldErrors.skills ? "border-error" : "border-rule focus:border-accent"
                      }`}
                    />
                    <span className="mt-1 block text-[11px] font-normal normal-case text-ink-3">
                      Tối đa 20 kỹ năng, mỗi kỹ năng từ 1 đến 30 ký tự.
                    </span>
                    <FieldError id="skills-error" message={fieldErrors.skills} />
                  </label>
                )}
                {(editSection === "all" || editSection === "experience") && (
                  <div className="md:col-span-2">
                    <FormSectionLabel title="Kinh nghiệm làm việc" />
                    <div className="space-y-4">
                      {draft.experiences.map((entry, index) =>
                        editIndex === null || editIndex === index ? (
                          <div key={index} className="rounded-lg border border-rule bg-paper-2 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-xs font-bold uppercase tracking-wide text-accent">
                                Kinh nghiệm {index + 1}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeExperience(index)}
                                className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-error transition-colors hover:bg-error-container"
                              >
                                <Icon name="delete" className="!text-base" />
                                Xóa
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              {(
                                [
                                  ["title", "Chức danh"],
                                  ["company", "Công ty / Địa điểm"],
                                ] as const
                              ).map(([field, label]) => (
                                <label
                                  key={field}
                                  className="text-xs font-semibold uppercase tracking-wide text-ink-3"
                                >
                                  {label}
                                  <input
                                    type="text"
                                    value={entry[field]}
                                    onChange={(event) =>
                                      updateExperience(index, field, event.target.value)
                                    }
                                    aria-invalid={Boolean(
                                      fieldErrors[`experiences.${index}.${field}`],
                                    )}
                                    className={`mt-2 w-full rounded-md border bg-paper px-3 py-2.5 text-sm font-normal text-ink outline-none focus:ring-2 focus:ring-accent/20 ${
                                      fieldErrors[`experiences.${index}.${field}`]
                                        ? "border-error"
                                        : "border-rule focus:border-accent"
                                    }`}
                                  />
                                  <FieldError
                                    id={`experience-${index}-${field}-error`}
                                    message={fieldErrors[`experiences.${index}.${field}`]}
                                  />
                                </label>
                              ))}
                              <DateRangeFields
                                from={entry.from}
                                to={entry.to}
                                fromError={fieldErrors[`experiences.${index}.from`]}
                                toError={fieldErrors[`experiences.${index}.to`]}
                                onChange={(field, value) => updateExperience(index, field, value)}
                              />
                              <label className="text-xs font-semibold uppercase tracking-wide text-ink-3 md:col-span-2">
                                Mô tả công việc
                                <textarea
                                  rows={3}
                                  value={entry.description}
                                  onChange={(event) =>
                                    updateExperience(index, "description", event.target.value)
                                  }
                                  className={`mt-2 w-full resize-y rounded-md border bg-paper px-3 py-2.5 text-sm font-normal text-ink outline-none focus:ring-2 focus:ring-accent/20 ${
                                    fieldErrors[`experiences.${index}.description`]
                                      ? "border-error"
                                      : "border-rule focus:border-accent"
                                  }`}
                                />
                                <FieldError
                                  id={`experience-${index}-description-error`}
                                  message={fieldErrors[`experiences.${index}.description`]}
                                />
                              </label>
                            </div>
                          </div>
                        ) : null,
                      )}

                      {editIndex === null && (
                        <button
                          type="button"
                          onClick={addExperience}
                          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-accent/30 bg-accent-subtle px-4 text-sm font-semibold text-accent transition-colors hover:border-accent"
                        >
                          <Icon name="add" className="!text-base" />
                          Thêm kinh nghiệm làm việc
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {(editSection === "all" || editSection === "education") && (
                  <div className="md:col-span-2">
                    <FormSectionLabel title="Trình độ học vấn" />
                    <div className="rounded-lg border border-rule bg-paper-2 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        {draft.education.map((education, index) =>
                          editIndex === null || editIndex === index ? (
                            <div key={index} className="contents">
                              <div className="flex items-center justify-between gap-3 md:col-span-2">
                                <p className="text-xs font-bold uppercase tracking-wide text-accent">
                                  Học vấn {index + 1}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeEducation(index)}
                                  className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-error transition-colors hover:bg-error-container"
                                >
                                  <Icon name="delete" className="!text-base" />
                                  Xóa
                                </button>
                              </div>
                              {(
                                [
                                  ["degree", "Bằng cấp"],
                                  ["school", "Trường / Cơ sở đào tạo"],
                                ] as const
                              ).map(([field, label]) => (
                                <label
                                  key={field}
                                  className="text-xs font-semibold uppercase tracking-wide text-ink-3"
                                >
                                  {label}
                                  <input
                                    type="text"
                                    value={education[field]}
                                    onChange={(event) =>
                                      updateEducation(index, field, event.target.value)
                                    }
                                    aria-invalid={Boolean(
                                      fieldErrors[`education.${index}.${field}`],
                                    )}
                                    className={`mt-2 w-full rounded-md border bg-paper px-3 py-2.5 text-sm font-normal text-ink outline-none focus:ring-2 focus:ring-accent/20 ${
                                      fieldErrors[`education.${index}.${field}`]
                                        ? "border-error"
                                        : "border-rule focus:border-accent"
                                    }`}
                                  />
                                  <FieldError
                                    id={`education-${index}-${field}-error`}
                                    message={fieldErrors[`education.${index}.${field}`]}
                                  />
                                </label>
                              ))}
                              <DateRangeFields
                                from={education.from}
                                to={education.to}
                                fromError={fieldErrors[`education.${index}.from`]}
                                toError={fieldErrors[`education.${index}.to`]}
                                onChange={(field, value) => updateEducation(index, field, value)}
                              />
                            </div>
                          ) : null,
                        )}
                      </div>
                    </div>
                    {editIndex === null && (
                      <button
                        type="button"
                        onClick={addEducation}
                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-accent/30 bg-accent-subtle px-4 text-sm font-semibold text-accent transition-colors hover:border-accent"
                      >
                        <Icon name="add" className="!text-base" />
                        Thêm trình độ học vấn
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditForm}
                  className="min-h-10 rounded-md border border-rule px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper-3"
                >
                  Hủy
                </button>
                <button type="submit" className="btn min-h-10 px-5 text-sm">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </FloatingPanel>
        )}

        <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
          <DialogContent className="max-w-md border-rule bg-paper p-0">
            <DialogHeader className="gap-4 border-b border-rule px-6 pb-5 pt-6 text-left">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-mint">
                  <Check size={20} strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-bold text-ink">Đã lưu thay đổi</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-ink-2">
                    {successMessage}
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

        <main className="grid min-w-0 gap-5 lg:grid-cols-2">
          <section
            aria-labelledby="education-title"
            className="rounded-[16px] border border-rule bg-paper px-4 py-5 sm:px-6 lg:col-span-2"
          >
            <SectionTitle
              icon={<GraduationCap size={23} />}
              title="Học vấn"
              id="education-title"
              action={
                <button
                  type="button"
                  onClick={() => openEditForm("education")}
                  aria-label="Chỉnh sửa học vấn"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <Pencil size={17} strokeWidth={2.2} />
                </button>
              }
            />
            <div className="mt-4 border-t border-rule">
              {profile.education.map((education, index) => (
                <ResumeEntry
                  key={`${education.school}-${education.from}-${index}`}
                  title={education.school}
                  meta={education.degree}
                  period={formatPeriod(education.from, education.to)}
                  onEdit={() => openEditForm("education", index)}
                  showDivider={index < profile.education.length - 1}
                />
              ))}
            </div>
          </section>

          <section
            aria-labelledby="experience-title"
            className="rounded-[16px] border border-rule bg-paper px-4 py-5 sm:px-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2
                  id="experience-title"
                  className="text-[22px] font-extrabold tracking-[-0.03em] text-ink"
                >
                  Kinh nghiệm làm việc
                </h2>
              </div>
              <button
                type="button"
                onClick={() => openEditForm("experience")}
                aria-label="Chỉnh sửa kinh nghiệm làm việc"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <Pencil size={17} strokeWidth={2.2} />
              </button>
            </div>
            <p className="mt-2 text-sm text-ink-3">
              Thể hiện những thông tin chi tiết về quá trình làm việc
            </p>
            <div className="mt-4 space-y-5 border-t border-rule pt-1">
              {profile.experiences.map((entry, index) => (
                <Experience
                  key={`${entry.title}-${entry.from}`}
                  {...entry}
                  onEdit={() => openEditForm("experience", index)}
                />
              ))}
            </div>
          </section>

          <section
            aria-labelledby="skills-title"
            className="rounded-[16px] border border-rule bg-paper px-4 py-5 sm:px-6"
          >
            <SectionTitle
              icon={<Sparkles size={22} />}
              title="Kỹ năng"
              id="skills-title"
              action={
                <button
                  type="button"
                  onClick={() => openEditForm("skills")}
                  aria-label="Chỉnh sửa kỹ năng"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <Pencil size={17} strokeWidth={2.2} />
                </button>
              }
            />
            <div className="mt-4 border-t border-rule pt-4">
              <div className="mb-4 flex items-center gap-2 rounded-md bg-accent-subtle px-4 py-3 text-sm text-ink-2">
                <Check size={18} className="shrink-0 text-accent" />
                <span>
                  <strong className="text-accent">Cập nhật nhanh</strong> số năm kinh nghiệm cho kỹ
                  năng
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-paper-3 px-3 py-1.5 text-xs font-semibold text-ink-2"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section
            aria-labelledby="contact-title"
            className="rounded-[16px] border border-rule bg-paper px-4 py-5 sm:px-6"
          >
            <SectionTitle
              icon={<BriefcaseBusiness size={22} />}
              title="Thông tin thêm"
              id="contact-title"
            />
            <dl className="mt-4 divide-y divide-rule border-t border-rule">
              <Detail label="Email" value={profile.email || user?.email || "—"} />
              <Detail label="Điện thoại" value={profile.phone || "—"} />
              <Detail label="Trạng thái" value={profile.isPublic ? "Đang hiển thị" : "Riêng tư"} />
            </dl>
          </section>
        </main>
      </div>
    </AdminShell>
  );
}

function ContactItem({
  icon,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 text-ink-2 ${className}`}>
      <span className="shrink-0 text-ink-3">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  id,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  id: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 id={id} className="text-[22px] font-extrabold tracking-[-0.03em] text-ink">
          {title}
        </h2>
        <span className="hidden text-ink-3 sm:inline-flex">{icon}</span>
      </div>
      {action}
    </div>
  );
}

function FormSectionLabel({ title }: { title: string }) {
  return <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>;
}

function getEditorDescription(section: EditSection) {
  switch (section) {
    case "basics":
      return "Cập nhật tên hiển thị và số điện thoại trên hồ sơ của bạn.";
    case "about":
      return "Viết phần giới thiệu ngắn gọn để nhà tuyển dụng hiểu điểm mạnh của bạn.";
    case "experience":
      return "Cập nhật các vị trí, công ty và mốc thời gian trong hành trình làm việc.";
    case "education":
      return "Bổ sung bằng cấp, cơ sở đào tạo và thời gian học tập của bạn.";
    case "skills":
      return "Liệt kê những kỹ năng chuyên môn bạn muốn nhà tuyển dụng nhìn thấy.";
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
    <span id={id} role="alert" className="mt-1 block text-xs font-medium text-error">
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
}: {
  from: string;
  to: string;
  fromError?: string;
  toError?: string;
  onChange: (field: "from" | "to", value: string) => void;
}) {
  return (
    <>
      <label className="text-xs font-semibold uppercase tracking-wide text-ink-3">
        Từ ngày
        <input
          type="month"
          value={from}
          onChange={(event) => onChange("from", event.target.value)}
          aria-invalid={Boolean(fromError)}
          className={`mt-2 w-full rounded-md border bg-paper px-3 py-2.5 text-sm font-normal text-ink outline-none focus:ring-2 focus:ring-accent/20 ${
            fromError ? "border-error" : "border-rule focus:border-accent"
          }`}
        />
        <FieldError id="from-date-error" message={fromError} />
      </label>
      <label className="text-xs font-semibold uppercase tracking-wide text-ink-3">
        Đến ngày
        <input
          type="month"
          value={to}
          onChange={(event) => onChange("to", event.target.value)}
          aria-invalid={Boolean(toError)}
          placeholder="Để trống nếu đang tiếp tục"
          className={`mt-2 w-full rounded-md border bg-paper px-3 py-2.5 text-sm font-normal text-ink outline-none focus:ring-2 focus:ring-accent/20 ${
            toError ? "border-error" : "border-rule focus:border-accent"
          }`}
        />
        <FieldError id="to-date-error" message={toError} />
        <span className="mt-1 block text-[11px] font-normal normal-case text-ink-3">
          Để trống nếu đang tiếp tục
        </span>
      </label>
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

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-3">{label}</dt>
      <dd
        className={`max-w-[62%] text-right text-sm font-medium text-ink ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function ResumeEntry({
  title,
  meta,
  period,
  detail,
  onEdit,
  showDivider = true,
}: {
  title: string;
  meta: string;
  period: string;
  detail?: string;
  onEdit: () => void;
  showDivider?: boolean;
}) {
  return (
    <article
      className={`group relative py-5 first:pt-5 last:pb-1 ${
        showDivider ? "border-b border-rule" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold leading-6 text-ink">{title}</h3>
          <p className="mt-1 text-sm font-medium text-ink">{meta}</p>
          <p className="mt-1 text-sm font-medium uppercase tracking-[0.04em] text-ink-2">
            {period}
          </p>
          {detail && <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-2">{detail}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity md:opacity-60 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Chỉnh sửa ${title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Pencil size={17} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            disabled
            aria-label={`Xóa ${title}`}
            title="Tính năng xóa sẽ được bổ sung"
            className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full text-ink-3 opacity-70"
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Experience({
  title,
  company,
  from,
  to,
  description,
  onEdit,
}: {
  title: string;
  company: string;
  from: string;
  to: string;
  description: string;
  onEdit: () => void;
}) {
  return (
    <article className="relative">
      <span
        aria-hidden="true"
        className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-accent ring-1 ring-accent/40 md:-left-[31px]"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-ink">{title}</h3>
          <p className="mt-1 text-xs font-medium text-ink-2">{company}</p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <span className="pt-2 text-xs font-semibold text-ink-2">{formatPeriod(from, to)}</span>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Chỉnh sửa ${title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Pencil size={17} strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-2">{description}</p>
    </article>
  );
}
