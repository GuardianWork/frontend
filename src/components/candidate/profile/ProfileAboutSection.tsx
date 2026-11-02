import type { ReactNode } from "react";

import { useLanguage } from "@/context/LanguageContext";
import { candidateWorkspaceCopy } from "@/lib/candidateWorkspace";

import { ProfileEditButton, ProfileSection } from "./ProfileSection";

export function ProfileAboutSection({
  about,
  onEdit,
  handle,
}: {
  about: string;
  onEdit: () => void;
  handle?: ReactNode;
}) {
  const { locale } = useLanguage();
  const copy = candidateWorkspaceCopy[locale].profile.sections;

  return (
    <ProfileSection
      id="about"
      title={copy.aboutTitle}
      handle={handle}
      action={<ProfileEditButton label={copy.aboutEdit} onClick={onEdit} />}
    >
      <p
        className={`mt-3 max-w-[68ch] text-[15px] leading-7 ${about ? "text-ink-2" : "text-ink-3"}`}
      >
        {about || copy.aboutPlaceholder}
      </p>
    </ProfileSection>
  );
}
