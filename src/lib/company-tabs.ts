export const COMPANY_TAB_IDS = ["gioi-thieu", "viec-lam", "danh-gia"] as const;

export type CompanyTabId = (typeof COMPANY_TAB_IDS)[number];

export const DEFAULT_COMPANY_TAB: CompanyTabId = "gioi-thieu";

/** Tabs that can actually be opened today. Reviews are listed but disabled. */
export type CompanyTabSelection = Exclude<CompanyTabId, "danh-gia">;

export function companyTabFromSearch(
  search: Record<string, unknown>,
): CompanyTabSelection | undefined {
  const value = search.tab;
  if (value === "gioi-thieu" || value === "viec-lam") return value;
  return undefined;
}

export function parseCompanyTabSearch(search: Record<string, unknown>): {
  tab?: CompanyTabSelection;
} {
  const tab = companyTabFromSearch(search);
  return tab ? { tab } : {};
}
