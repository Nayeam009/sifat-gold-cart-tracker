/** Public site origin for canonical URLs, sitemap and structured data. Set VITE_SITE_URL once a domain is live. */
export const SITE_URL = (
  (import.meta.env["VITE_SITE_URL"] as string | undefined) ||
  "https://id-preview--90c952f8-0b27-4ec8-ae62-4bb3a50c0b88.lovable.app"
).replace(/\/$/, "");
export const absUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

type Opts = {
  path?: string;
  image?: string | null;
  type?: "website" | "product";
  noindex?: boolean;
};

export const seo = (title: string, description: string, opts: Opts = {}) => {
  const full = `${title} | SifatMart`;
  const desc = description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
  const img = opts.image && /^https:\/\//.test(opts.image) ? opts.image : null;
  return {
    meta: [
      { title: full },
      { name: "description", content: desc },
      { property: "og:title", content: full },
      { property: "og:description", content: desc },
      { property: "og:type", content: opts.type ?? "website" },
      { property: "og:site_name", content: "SifatMart" },
      ...(opts.path ? [{ property: "og:url", content: absUrl(opts.path) }] : []),
      { name: "twitter:card", content: img ? "summary_large_image" : "summary" },
      { name: "twitter:title", content: full },
      { name: "twitter:description", content: desc },
      ...(img
        ? [
            { property: "og:image", content: img },
            { name: "twitter:image", content: img },
          ]
        : []),
      ...(opts.noindex ? [{ name: "robots", content: "noindex" }] : []),
    ],
    links: opts.path && !opts.noindex ? [{ rel: "canonical", href: absUrl(opts.path) }] : [],
  };
};

export const jsonLd = (data: unknown) => ({
  type: "application/ld+json",
  children: JSON.stringify(data).replace(/</g, "\\u003c"),
});

export const breadcrumbLd = (items: { name: string; path: string }[]) =>
  jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  });
