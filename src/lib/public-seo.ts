/** Only emit absolute public metadata when a deployment origin was configured. */
export function publicSeo(path: string) {
  const configured = import.meta.env.VITE_PUBLIC_PORTAL_URL;
  if (!configured) return { links: [], meta: [] };
  try {
    const origin = new URL(configured);
    if (!["http:", "https:"].includes(origin.protocol)) return { links: [], meta: [] };
    const url = new URL(path, origin.origin).href;
    const image = new URL("/images/illustrations/08-multi-industry-careers.png", origin.origin)
      .href;
    return {
      links: [{ rel: "canonical", href: url }],
      meta: [
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:image", content: image },
      ],
    };
  } catch {
    return { links: [], meta: [] };
  }
}
