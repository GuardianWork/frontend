import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { AuthUser } from "@/services/auth";

export function RecruiterEntryLink({
  user,
  className,
  children,
}: {
  user: AuthUser | null | undefined;
  className: string;
  children: ReactNode;
}) {
  return (
    <Link
      className={className}
      to={user ? "/rec" : "/register"}
      search={user ? undefined : { role: "recruiter" }}
      disabled={user === undefined}
    >
      {children}
    </Link>
  );
}
