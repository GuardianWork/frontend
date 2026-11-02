import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import type { Announcements, UniqueIdentifier } from "@dnd-kit/core";

import type { CandidateProfileDetails } from "@/context/CandidateContext";
import { useLanguage } from "@/context/LanguageContext";
import { candidateWorkspaceCopy } from "@/lib/candidateWorkspace";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";

import { ProfileAboutSection } from "./ProfileAboutSection";
import { ProfileEducationSection } from "./ProfileEducationSection";
import { ProfileExperienceSection } from "./ProfileExperienceSection";
import { ProfileSkillsSection } from "./ProfileSkillsSection";
import {
  PROFILE_SECTION_IDS,
  readProfileSectionOrder,
  writeProfileSectionOrder,
  type ProfileSectionId,
} from "./sectionOrder";

export type ProfileSectionName = ProfileSectionId;

function SectionHandle({ title }: { title: string }) {
  const { locale } = useLanguage();
  const copy = candidateWorkspaceCopy[locale].profile.sortable;

  return (
    <SortableItemHandle
      aria-label={copy.handle(title)}
      title={copy.tooltip}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-accent-subtle hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <GripVertical size={16} aria-hidden="true" />
    </SortableItemHandle>
  );
}

function SectionDragPreview({ title }: { title: string }) {
  return (
    <div className="flex w-[min(46rem,calc(100vw-2rem))] items-center gap-2 rounded-xl border border-rule bg-paper px-5 py-4 shadow-[0_24px_48px_-24px_rgba(45,45,45,0.45)]">
      <GripVertical size={16} className="shrink-0 text-ink-3" aria-hidden="true" />
      <span className="text-lg font-bold leading-[1.45] tracking-[-0.02em] text-ink">{title}</span>
    </div>
  );
}

export function ProfileSections({
  profile,
  onEditSection,
}: {
  profile: CandidateProfileDetails;
  onEditSection: (section: ProfileSectionName, index?: number) => void;
}) {
  const { locale } = useLanguage();
  const copy = candidateWorkspaceCopy[locale].profile;

  const sectionTitles = useMemo<Record<ProfileSectionId, string>>(
    () => ({
      about: copy.sections.aboutTitle,
      experience: copy.sections.experienceTitle,
      education: copy.sections.educationTitle,
      skills: copy.sections.skillsTitle,
    }),
    [copy],
  );

  // Render the canonical order on the server, then restore the saved order on the client.
  const [order, setOrder] = useState<ProfileSectionId[]>(() => [...PROFILE_SECTION_IDS]);

  useEffect(() => {
    setOrder(readProfileSectionOrder());
  }, []);

  const handleOrderChange = (nextOrder: ProfileSectionId[]) => {
    setOrder(nextOrder);
    writeProfileSectionOrder(nextOrder);
  };

  const accessibility = useMemo(() => {
    const label = (value: UniqueIdentifier) =>
      sectionTitles[value as ProfileSectionId] ?? String(value);
    const text = copy.sortable;
    const total = order.length;

    const announcements: Announcements = {
      onDragStart({ active }) {
        const position = (active.data.current?.sortable.index ?? 0) + 1;
        return text.grabbed(label(active.id), position, total);
      },
      onDragOver({ active, over }) {
        if (!over) return text.noDrop;
        const activeIndex = active.data.current?.sortable.index ?? 0;
        const overIndex = over.data.current?.sortable.index ?? 0;
        if (overIndex === activeIndex)
          return text.atPosition(label(active.id), activeIndex + 1, total);
        const direction = overIndex > activeIndex ? text.directionDown : text.directionUp;
        return text.moved(label(active.id), direction, overIndex + 1, total);
      },
      onDragMove({ active, over }) {
        if (!over) return text.noDrop;
        const activeIndex = active.data.current?.sortable.index ?? 0;
        const overIndex = over.data.current?.sortable.index ?? 0;
        if (overIndex === activeIndex)
          return text.atPosition(label(active.id), activeIndex + 1, total);
        const direction = overIndex > activeIndex ? text.directionDown : text.directionUp;
        return text.moving(label(active.id), direction, overIndex + 1, total);
      },
      onDragEnd({ active, over }) {
        if (!over) return text.droppedNoChange(label(active.id));
        const overIndex = over.data.current?.sortable.index ?? 0;
        return text.dropped(label(active.id), overIndex + 1, total);
      },
      onDragCancel({ active }) {
        const activeIndex = active.data.current?.sortable.index ?? 0;
        return text.cancelled(label(active.id), activeIndex + 1);
      },
    };

    return {
      announcements,
      screenReaderInstructions: { draggable: text.instructions },
    };
  }, [copy, order.length, sectionTitles]);

  const sectionContent: Record<ProfileSectionId, ReactNode> = {
    about: (
      <ProfileAboutSection
        about={profile.experience}
        onEdit={() => onEditSection("about")}
        handle={<SectionHandle title={sectionTitles.about} />}
      />
    ),
    experience: (
      <ProfileExperienceSection
        experiences={profile.experiences}
        onEdit={(index) => onEditSection("experience", index)}
        handle={<SectionHandle title={sectionTitles.experience} />}
      />
    ),
    education: (
      <ProfileEducationSection
        education={profile.education}
        onEdit={(index) => onEditSection("education", index)}
        handle={<SectionHandle title={sectionTitles.education} />}
      />
    ),
    skills: (
      <ProfileSkillsSection
        skills={profile.skills}
        onEdit={() => onEditSection("skills")}
        handle={<SectionHandle title={sectionTitles.skills} />}
      />
    ),
  };

  return (
    <Sortable
      value={order}
      onValueChange={handleOrderChange}
      getItemValue={(id: ProfileSectionId) => id}
      getItemLabel={(value) => sectionTitles[value as ProfileSectionId] ?? String(value)}
      accessibility={accessibility}
    >
      <SortableContent className="min-w-0 divide-y divide-rule">
        {order.map((id) => (
          <SortableItem key={id} value={id} className="bg-paper">
            {sectionContent[id]}
          </SortableItem>
        ))}
      </SortableContent>
      <SortableOverlay>
        {({ value }) => {
          const id = value as ProfileSectionId;
          return <SectionDragPreview title={sectionTitles[id] ?? ""} />;
        }}
      </SortableOverlay>
    </Sortable>
  );
}
