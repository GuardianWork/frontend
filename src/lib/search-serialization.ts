import { defaultStringifySearch } from "@tanstack/react-router";

/**
 * Job-search query parameters. Every route reading one of these keys either coerces
 * it with `Number()` or normalizes it back to its string form (`parseJobSearch`), so
 * sending the value as a number is invisible to the application.
 */
const NUMERIC_PARAM_KEYS = [
  "job",
  "jobId",
  "fromJobId",
  "page",
  "salaryMin",
  "salaryMax",
  "q",
  "location",
  "industry",
] as const;

/** Integer strings only: "007" would change meaning when read back as a number. */
const INTEGER = /^(?:0|[1-9]\d*)$/;

/**
 * The router's default serializer JSON-quotes any value that starts with a digit, so a
 * numeric job id would surface in the address bar as `?job="112"`. Numeric values travel
 * as numbers instead, which keeps the URL readable without changing any search state the
 * application reads. Everything else keeps the stock serialization.
 */
export function stringifySearchParams(search: Record<string, unknown>): string {
  const normalized: Record<string, unknown> = { ...search };
  for (const key of NUMERIC_PARAM_KEYS) {
    const value = normalized[key];
    if (typeof value === "string" && INTEGER.test(value)) normalized[key] = Number(value);
  }
  return defaultStringifySearch(normalized);
}
