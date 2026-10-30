import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const InvitationIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function InvitationIcon({ size = 15, width, height, title, children, ...props }, ref) {
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
        <rect x="1.7" y="4" width="9" height="7" rx="1" />
        <path d="m2 4.5 4.2 3.4 4.2-3.4M12.4 5.8v4.5M10.2 8h4.4" />
        {children}
      </svg>
    );
  },
);
