import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const JobIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(function JobIcon(
  { size = 15, width, height, title, children, ...props },
  ref,
) {
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
      <rect x="2" y="4.5" width="11" height="8" rx="1" />
      <path d="M5.5 4.5V3.3c0-.6.5-1 1-1h2c.6 0 1 .4 1 1v1.2M2 8h11M6.5 8v1h2V8" />
      {children}
    </svg>
  );
});
