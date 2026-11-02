import type { ReactNode } from "react";

import type { CandidateExperience } from "@/context/CandidateContext";
import { useLanguage } from "@/context/LanguageContext";
import { candidateWorkspaceCopy } from "@/lib/candidateWorkspace";

import {
  ProfileEditButton,
  ProfileEmptyState,
  ProfileRecordEntry,
  ProfileSection,
} from "./ProfileSection";
import { formatPeriod } from "./profileFormat";

export function ProfileExperienceSection({
  experiences,
  onEdit,
  handle,
}: {
  experiences: CandidateExperience[];
  onEdit: (index?: number) => void;
  handle?: ReactNode;
}) {
  const { locale } = useLanguage();
  const { sections, periodPresent } = candidateWorkspaceCopy[locale].profile;

  return (
    <ProfileSection
      id="experience"
      title={sections.experienceTitle}
      handle={handle}
      action={<ProfileEditButton label={sections.experienceEdit} onClick={() => onEdit()} />}
    >
      {experiences.length > 0 ? (
        <div className="mt-5 space-y-6">
          {experiences.map((entry, index) => (
            <ProfileRecordEntry
              key={`${entry.title}-${entry.from}-${index}`}
              title={entry.title}
              meta={entry.company}
              period={formatPeriod(entry.from, entry.to, periodPresent)}
              description={entry.description}
              editLabel={sections.experienceEntryEdit(entry.title)}
              onEdit={() => onEdit(index)}
            />
          ))}
        </div>
      ) : (
        <ProfileEmptyState
          text={sections.experienceEmpty}
          actionLabel={sections.experienceAdd}
          onClick={() => onEdit()}
        />
      )}
    </ProfileSection>
  );
}
