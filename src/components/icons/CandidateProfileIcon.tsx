import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const CandidateProfileIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function CandidateProfileIcon({ size = 15, width, height, title, children, ...props }, ref) {
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
        <circle cx="7.5" cy="4.8" r="2.4" />
        <path d="M2.7 13v-1.2c0-2.1 1.9-3.5 4.8-3.5s4.8 1.4 4.8 3.5V13z" />
        {children}
      </svg>
    );
  },
);
