import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const RecruitmentOverviewIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function RecruitmentOverviewIcon({ size = 15, width, height, title, children, ...props }, ref) {
    const titleId = React.useId();
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={width ?? size}
        height={height ?? size}
        viewBox="0 0 15 15"
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
        <rect x="2" y="2" width="4.5" height="4.5" rx=".5" />
        <rect x="8.5" y="2" width="4.5" height="4.5" rx=".5" />
        <rect x="2" y="8.5" width="4.5" height="4.5" rx=".5" />
        <rect x="8.5" y="8.5" width="4.5" height="4.5" rx=".5" />
        {children}
      </svg>
    );
  },
);
