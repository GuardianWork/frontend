import type { ReactNode } from "react";

import { useLanguage } from "@/context/LanguageContext";
import { candidateWorkspaceCopy } from "@/lib/candidateWorkspace";

import { ProfileEditButton, ProfileEmptyState, ProfileSection } from "./ProfileSection";

export function ProfileSkillsSection({
  skills,
  onEdit,
  handle,
}: {
  skills: string[];
  onEdit: () => void;
  handle?: ReactNode;
}) {
  const { locale } = useLanguage();
  const copy = candidateWorkspaceCopy[locale].profile.sections;

  return (
    <ProfileSection
      id="skills"
      title={copy.skillsTitle}
      handle={handle}
      action={<ProfileEditButton label={copy.skillsEdit} onClick={onEdit} />}
    >
      {skills.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li
              key={skill}
              className="rounded-md border border-rule bg-paper-2 px-2.5 py-1.5 text-xs font-semibold text-ink-2"
            >
              {skill}
            </li>
          ))}
        </ul>
      ) : (
        <ProfileEmptyState text={copy.skillsEmpty} actionLabel={copy.skillsAdd} onClick={onEdit} />
      )}
    </ProfileSection>
  );
}
