import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

/**
 * Company links follow the surface that renders them: a candidate working inside
 * `/can` stays in the Candidate workspace, while public discovery stays public.
 */
function useCompanyWorkspacePath() {
  return useRouterState({ select: (state) => state.location.pathname.startsWith("/can/") });
}

export function CompanyDetailLink({
  companyId,
  className,
  children,
  onClick,
  ariaLabel,
}: {
  companyId: number;
  className?: string;
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  ariaLabel?: string;
}) {
  const inWorkspace = useCompanyWorkspacePath();
  const params = { companyId: String(companyId) };
  return inWorkspace ? (
    <Link
      to="/can/companies/$companyId"
      params={params}
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  ) : (
    <Link
      to="/companies/$companyId"
      params={params}
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

/** The directory link paired with the surface that renders the company page. */
export function CompanyIndexLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const inWorkspace = useCompanyWorkspacePath();
  return inWorkspace ? (
    <Link to="/can/companies" className={className}>
      {children}
    </Link>
  ) : (
    <Link to="/companies" className={className}>
      {children}
    </Link>
  );
}
