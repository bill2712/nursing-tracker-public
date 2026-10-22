import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://bill2712.github.io';
export const BASE = '/nursing-tracker-public';

/**
 * Fill in the service worker's cache version and asset list after each build,
 * so a deploy replaces the old offline copy instead of serving it forever.
 */
const serviceWorkerManifest = () => ({
  name: 'service-worker-manifest',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const root = fileURLToPath(dir);
      const files = [];
      const walk = folder => {
        for (const name of readdirSync(folder)) {
          const path = join(folder, name);
          if (statSync(path).isDirectory()) walk(path);
          else files.push(relative(root, path).split('\\').join('/'));
        }
      };
      walk(root);
      const hash = createHash('sha256');
      for (const file of files.sort()) {
        if (file === 'sw.js') continue;
        hash.update(file);
        hash.update(readFileSync(join(root, file)));
      }
      const assets = files.filter(file => file.startsWith('_astro/')).map(file => `${BASE}/${file}`);
      const swPath = join(root, 'sw.js');
      const sw = readFileSync(swPath, 'utf8')
        .replace("const VERSION = 'nt-dev';", `const VERSION = 'nt-${hash.digest('hex').slice(0, 12)}';`)
        .replace('const ASSETS = [];', `const ASSETS = ${JSON.stringify(assets)};`);
      if (!sw.includes("'nt-") || sw.includes("'nt-dev'") || sw.includes('const ASSETS = [];')) throw new Error('Could not fill in sw.js');
      writeFileSync(swPath, sw);
    }
  }
});

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    react(),
    serviceWorkerManifest(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', 'zh-hant': 'zh-Hant', 'zh-hans': 'zh-Hans', ja: 'ja' }
      },
      filter: page => !page.includes('/404')
    })
  ]
});
