import type { APIRoute } from 'astro';

// Note: crawlers read robots.txt from the domain root. On a GitHub Pages
// project site this file lives under the base path, so the sitemap should
// also be submitted in Google Search Console / Bing Webmaster Tools.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', `${site?.origin}${import.meta.env.BASE_URL}`).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
