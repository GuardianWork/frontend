import type * as React from "react";
/** width/height override size individually; default size is 15. */
export type GuardianIconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  title?: string;
};
