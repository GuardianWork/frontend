import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const ApplicationIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(
  function ApplicationIcon({ size = 15, width, height, title, children, ...props }, ref) {
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
        <path d="M3 1.8h6l3 3v8.3H3zM9 1.8v3h3M5 7h4M5 9h2" />
        <path d="m8.2 10.8 1.3 1.3 2.5-2.6" />
        {children}
      </svg>
    );
  },
);
