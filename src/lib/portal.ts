/** Build each portal independently; browser sessions stay scoped to its origin. */
export const IS_STAFF_PORTAL = ["staff", "staff-mock"].includes(import.meta.env.MODE);

export function staffPortalHref(path = "/login") {
  return new URL(path, import.meta.env.VITE_STAFF_PORTAL_URL || "http://localhost:5138").href;
}

export function publicPortalHref(path = "/vn") {
  return new URL(path, import.meta.env.VITE_PUBLIC_PORTAL_URL || "http://localhost:5137").href;
}
