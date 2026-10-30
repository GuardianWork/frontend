import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const TalentSearchIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function TalentSearchIcon({ size = 15, width, height, title, children, ...props }, ref) {
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
        <circle cx="6" cy="5" r="2" />
        <path d="M2.5 11c0-2 1.4-3 3.5-3 1.1 0 2 .3 2.6 1M9.5 9.5l3.3 3.3M10 10a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z" />
        {children}
      </svg>
    );
  },
);
