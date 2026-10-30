import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const VerificationDossierIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function VerificationDossierIcon({ size = 15, width, height, title, children, ...props }, ref) {
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
        <path d="M3 2h6l3 3v8H3zM9 2v3h3M5 7h5" />
        <path d="m5.3 10 1.4 1.3 2.9-2.9" />
        {children}
      </svg>
    );
  },
);
