import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { IS_STAFF_PORTAL } from "@/lib/portal";
const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(import.meta.env.VITE_PUBLIC_PORTAL_URL || request.url).origin;
        const entries = [
          { path: "/vn", priority: "1.0" },
          { path: "/jobs", priority: "0.9" },
        ];
        const urls = (IS_STAFF_PORTAL ? [] : entries).map(
          (e) =>
            `  <url><loc>${escapeXml(origin + e.path)}</loc><changefreq>weekly</changefreq><priority>${e.priority}</priority></url>`,
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
