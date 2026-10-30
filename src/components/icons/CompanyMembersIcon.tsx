import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const CompanyMembersIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function CompanyMembersIcon({ size = 15, width, height, title, children, ...props }, ref) {
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
        <circle cx="5" cy="5" r="2" />
        <path d="M1.8 12v-1.1c0-1.6 1.3-2.6 3.2-2.6s3.2 1 3.2 2.6V12z" />
        <circle cx="10.7" cy="5.4" r="1.5" />
        <path d="M9.5 9c2.2-.5 3.7.6 3.7 2.4v.6H10" />
        {children}
      </svg>
    );
  },
);
