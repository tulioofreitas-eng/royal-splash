/** Royal RC01: explicit route review; new routes must remain noindex until reviewed. */
export const ROYAL_CANONICAL_ORIGIN = "https://www.royalsplash.com.br";

export const ROYAL_ROUTE_ROBOTS = {
  "/": "index, follow",
  "/sobre": "index, follow",
  "/metodo-royal": "index, follow",
  "/servicos": "index, follow",
  "/corporativo": "index, follow",
  "/projetos": "index, follow",
  // Contact copy still describes the intake as a WhatsApp preparation form.
  "/contato": "noindex, nofollow",
  // Identity-bearing intake utility; its introduction also needs factual repair.
  "/inicie-seu-projeto": "noindex, nofollow",
  // Campaign/legacy processing descriptions need reconciliation with current LPs.
  "/politica-de-privacidade": "noindex, nofollow",
  "/obrigado": "noindex",
  "/lp/corporativo": "noindex, follow",
  "/lp/fibra": "noindex, follow",
  "/lp/lazer": "noindex, follow",
  "/lp/piscinas": "noindex, follow",
  "/lp/reforma": "noindex, follow",
  "/lp/reparo-subaquatico": "noindex, follow",
  "/lp/sauna": "noindex, follow",
  "/lp/vazamento": "noindex, follow",
} as const;

export function royalPublicPath(pathname: string): keyof typeof ROYAL_ROUTE_ROBOTS | undefined {
  const path = pathname === "/" ? pathname : pathname.replace(/\/$/, "");
  return Object.hasOwn(ROYAL_ROUTE_ROBOTS, path)
    ? path as keyof typeof ROYAL_ROUTE_ROBOTS
    : undefined;
}

export function getRoyalRouteRobots(pathname: string): string {
  const path = royalPublicPath(pathname);
  return path ? ROYAL_ROUTE_ROBOTS[path] : "noindex, nofollow";
}

export function getRoyalCanonicalUrl(pathname: string): string | undefined {
  const path = royalPublicPath(pathname);
  return path ? `${ROYAL_CANONICAL_ORIGIN}${path}` : undefined;
}

export function royalSitemapXml(isProduction: boolean): string {
  const urls = isProduction
    ? Object.entries(ROYAL_ROUTE_ROBOTS)
      .filter(([, robots]) => robots === "index, follow")
      .map(([path]) => `  <url><loc>${getRoyalCanonicalUrl(path)}</loc></url>`)
    : [];
  return ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls, '</urlset>', ''].join("\n");
}

export function royalRobotsTxt(isProduction: boolean): string {
  // LPs must be crawlable so search engines can read their noindex directive.
  return isProduction
    ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${ROYAL_CANONICAL_ORIGIN}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
}
