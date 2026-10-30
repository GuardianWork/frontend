import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const SavedJobsIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function SavedJobsIcon({ size = 15, width, height, title, children, ...props }, ref) {
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
        <path d="M4 2h7v11l-3.5-2.4L4 13z" />
        <path d="M5.8 5.5h3.4M7.5 3.8v3.4" />
        {children}
      </svg>
    );
  },
);
