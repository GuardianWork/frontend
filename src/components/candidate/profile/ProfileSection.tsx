import * as React from "react";

import { cn } from "@/lib/utils";
import { Plus, Pencil } from "lucide-react";

export function ProfileSection({
  id,
  title,
  handle,
  action,
  className,
  children,
}: {
  id: string;
  title: string;
  handle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className={cn("px-5 py-6 sm:px-7 sm:py-7", className)}>
      <div className="flex items-start justify-between gap-3">
        <h2
          id={`${id}-title`}
          className="text-lg font-bold leading-[1.45] tracking-[-0.02em] text-ink"
        >
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          {handle}
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ProfileEditButton({
  label,
  onClick,
  muted = false,
  className,
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
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        muted ? "text-ink-3 hover:text-accent" : "text-accent",
        className,
      )}
    >
      <Pencil size={16} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}

export function ProfileRecordEntry({
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
        <ProfileEditButton label={editLabel} onClick={onEdit} muted />
      </div>
    </article>
  );
}

export function ProfileEmptyState({
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
