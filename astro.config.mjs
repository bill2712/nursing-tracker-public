import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export const SITE = 'https://bill2712.github.io';
export const BASE = '/nursing-tracker-public';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', 'zh-hant': 'zh-Hant', 'zh-hans': 'zh-Hans', ja: 'ja' }
      },
      filter: page => !page.includes('/404')
    })
  ]
});
