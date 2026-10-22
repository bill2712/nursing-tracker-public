# NurtureTrack — free, private baby tracker

**Live site:** https://bill2712.github.io/nursing-tracker-public/

NurtureTrack is a free baby tracker for feeding, sleep, diapers, pumping, solids, growth (WHO charts), vaccines and development — plus a library of baby-care guides and calculators. It works in English, 繁體中文, 简体中文 and 日本語.

- **No account, no database.** All tracker data is saved in the browser's `localStorage` on the user's own device. Nothing is uploaded.
- **Backups.** Users can download a JSON backup and import it on another device (records are merged, duplicates skipped), or export CSV.
- **Works offline** and can be installed to the home screen (PWA).
- **Support link:** the "Support us" buttons point to Ko-fi.

## Project layout

| Path | What it is |
| --- | --- |
| `src/pages/[...lang]/` | Every page, generated once per language (`/`, `/zh-hant/`, `/zh-hans/`, `/ja/`) |
| `src/app/` | The tracker (React). `store.ts` is the localStorage store, `who.ts` the WHO percentile maths |
| `src/content/guides/<lang>/` | Guide articles in Markdown |
| `src/data/development/` | Month-by-month development content |
| `src/i18n/ui/` | Website text for each language |
| `src/i18n/app/` | Tracker text for each language |
| `src/data/who.json` | WHO Child Growth Standards (LMS tables, boys and girls, 0–60 months) |
| `src/tools/` | Formula and growth percentile calculators |

## Common changes

- **Ko-fi / support link:** `SUPPORT_URL` in `src/i18n/locales.ts`.
- **Text:** edit the files in `src/i18n/ui/` (website) and `src/i18n/app/` (tracker). TypeScript fails the build if a language is missing a string.
- **Add a guide:** add a Markdown file with the same file name in each `src/content/guides/<lang>/` folder (every page must exist in all four languages so the `hreflang` links are valid).
- **Simplified Chinese** is generated from Traditional Chinese, then reviewed:
  ```sh
  pip install opencc-python-reimplemented
  python3 scripts/hant-to-hans.py src/content/guides/zh-hant/x.md src/content/guides/zh-hans/x.md
  python3 scripts/fix-cjk-bold.py src/content/guides/*/*.md
  ```

## Develop

```sh
npm install
npm run dev     # http://localhost:4321/nursing-tracker-public/
npm test        # unit tests (store, WHO percentiles, summaries)
npm run build   # static site in dist/
```

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes `dist/` to the `gh-pages` branch.

## SEO

Each page has a canonical URL, `hreflang` links for all four languages plus `x-default`, Open Graph/Twitter cards (one share image per language), and JSON-LD (`WebSite`, `WebApplication`, `Article`, `FAQPage`, `BreadcrumbList`). A sitemap with language alternates is generated at `/nursing-tracker-public/sitemap-index.xml`.

Because this is a GitHub Pages project site, search engines do not read `robots.txt` from the sub-folder. Submit the sitemap in [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters) to get indexed faster.

## Medical content

Guides summarise public guidance from the WHO, NHS, CDC and AAP for general information. They are not medical advice. Please keep sources in each guide's front matter up to date.

---

## 中文簡介

NurtureTrack 是免費、重視私隱的寶寶照顧紀錄網站：餵奶、睡眠、換片、擠奶、副食品、WHO 成長曲線、疫苗及發展清單，並附四種語言的育兒指南及計算工具。沒有帳戶、沒有資料庫 —— 所有紀錄只存在用戶自己瀏覽器的 localStorage；可下載備份檔在另一部裝置匯入。修改 Ko-fi 連結請改 `src/i18n/locales.ts` 的 `SUPPORT_URL`。
