import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const LegalReferenceIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function LegalReferenceIcon({ size = 15, width, height, title, children, ...props }, ref) {
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
        <path d="M2.5 3.5c2-.9 3.6-.7 5 0 1.4-.7 3-.9 5 0v9c-2-.9-3.6-.7-5 0-1.4-.7-3-.9-5 0zM7.5 3.5v9M4 6h2M9 6h2" />
        {children}
      </svg>
    );
  },
);
