import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const CvIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(function CvIcon(
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
      <path d="M3 1.7h6l3 3v8.6H3zM9 1.7v3h3M5 7h5M5 9h5M5 11h3" />
      {children}
    </svg>
  );
});
