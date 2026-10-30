import * as React from "react";
import type { GuardianIconProps } from "./types";
/** GuardianWork custom domain glyph, 15x15 coordinate system. */
export const CompanyIcon = React.forwardRef<SVGSVGElement, GuardianIconProps>(function CompanyIcon(
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
      <path d="M2.5 13V3h6v10M8.5 6h4V13M1.5 13h12M4.5 5h2M4.5 7.5h2M4.5 10h2M10 8.5h1" />
      {children}
    </svg>
  );
});
