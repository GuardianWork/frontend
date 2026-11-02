import type { ReactNode } from "react";

import type { CandidateEducation } from "@/context/CandidateContext";
import { useLanguage } from "@/context/LanguageContext";
import { candidateWorkspaceCopy } from "@/lib/candidateWorkspace";

import {
  ProfileEditButton,
  ProfileEmptyState,
  ProfileRecordEntry,
  ProfileSection,
} from "./ProfileSection";
import { formatPeriod } from "./profileFormat";

export function ProfileEducationSection({
  education,
  onEdit,
  handle,
}: {
  education: CandidateEducation[];
  onEdit: (index?: number) => void;
  handle?: ReactNode;
}) {
  const { locale } = useLanguage();
  const { sections, periodPresent } = candidateWorkspaceCopy[locale].profile;

  return (
    <ProfileSection
      id="education"
      title={sections.educationTitle}
      handle={handle}
      action={<ProfileEditButton label={sections.educationEdit} onClick={() => onEdit()} />}
    >
      {education.length > 0 ? (
        <div className="mt-5 space-y-6">
          {education.map((entry, index) => (
            <ProfileRecordEntry
              key={`${entry.school}-${entry.from}-${index}`}
              title={entry.degree}
              meta={entry.school}
              period={formatPeriod(entry.from, entry.to, periodPresent)}
              editLabel={sections.educationEntryEdit(entry.degree)}
              onEdit={() => onEdit(index)}
            />
          ))}
        </div>
      ) : (
        <ProfileEmptyState
          text={sections.educationEmpty}
          actionLabel={sections.educationAdd}
          onClick={() => onEdit()}
        />
      )}
    </ProfileSection>
  );
}
