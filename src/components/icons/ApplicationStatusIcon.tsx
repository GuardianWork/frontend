import * as React from "react";
import type { GuardianIconProps } from "./types";

const VIEWBOX = "0 0 15 15";

const StatusGlyph = React.forwardRef<
  SVGSVGElement,
  GuardianIconProps & { children: React.ReactNode }
>(function StatusGlyph({ size = 15, width, height, title, children, ...props }, ref) {
  const titleId = React.useId();
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size}
      height={height ?? size}
      viewBox={VIEWBOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.15}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    >
      {title && <title id={titleId}>{title}</title>}
      {children}
    </svg>
  );
});

export const SubmittedStatusIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function SubmittedStatusIcon(props, ref) {
    return (
      <StatusGlyph ref={ref} {...props}>
        <path d="M2.5 8.5 12 3.5 8 12 6.8 8.3Z" />
        <path d="M6.8 8.3 12 3.5" />
      </StatusGlyph>
    );
  },
);

export const ViewedStatusIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function ViewedStatusIcon(props, ref) {
    return (
      <StatusGlyph ref={ref} {...props}>
        <path d="M1.8 7.5c1.7-2.6 3.8-3.8 5.7-3.8s4 1.2 5.7 3.8c-1.7 2.6-3.8 3.8-5.7 3.8S3.5 10.1 1.8 7.5Z" />
        <circle cx="7.5" cy="7.5" r="2.1" />
        <circle cx="7.5" cy="7.5" r="0.85" fill="currentColor" stroke="none" />
      </StatusGlyph>
    );
  },
);

export const ReviewStatusIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function ReviewStatusIcon(props, ref) {
    return (
      <StatusGlyph ref={ref} {...props}>
        <circle cx="6.2" cy="6.2" r="3.4" />
        <path d="m8.8 8.8 3.2 3.2" />
      </StatusGlyph>
    );
  },
);

export const ShortlistedStatusIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function ShortlistedStatusIcon(props, ref) {
    return (
      <StatusGlyph ref={ref} {...props}>
        <path d="M2.4 4.2h4.6M2.4 7.5h4.6M2.4 10.8h4.6" />
        <path d="m8.3 7.6 1.7 1.7 2.7-3.4" />
      </StatusGlyph>
    );
  },
);

export const RejectedStatusIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function RejectedStatusIcon(props, ref) {
    return (
      <StatusGlyph ref={ref} {...props}>
        <circle cx="7.5" cy="7.5" r="5.1" />
        <path d="M5.2 5.2 9.8 9.8M9.8 5.2 5.2 9.8" />
      </StatusGlyph>
    );
  },
);

export const WithdrawnStatusIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function WithdrawnStatusIcon(props, ref) {
    return (
      <StatusGlyph ref={ref} {...props}>
        <path d="M11.5 7.5H4.2M4.2 7.5 6.6 5.1M4.2 7.5 6.6 9.9" />
      </StatusGlyph>
    );
  },
);

const STATUS_ICONS: Record<string, React.ComponentType<GuardianIconProps>> = {
  SUBMITTED: SubmittedStatusIcon,
  VIEWED: ViewedStatusIcon,
  UNDER_REVIEW: ReviewStatusIcon,
  SHORTLISTED: ShortlistedStatusIcon,
  REJECTED: RejectedStatusIcon,
  WITHDRAWN: WithdrawnStatusIcon,
};

export interface ApplicationStatusIconProps extends GuardianIconProps {
  status: string;
}

export const ApplicationStatusIcon = React.forwardRef<SVGSVGElement, ApplicationStatusIconProps>(
  function ApplicationStatusIcon({ status, ...props }, ref) {
    const Icon = STATUS_ICONS[status.trim().toUpperCase()] ?? WithdrawnStatusIcon;
    return <Icon {...props} />;
  },
);

export default ApplicationStatusIcon;
