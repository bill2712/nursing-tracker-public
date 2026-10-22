export const LOCALES = ['en', 'zh-hant', 'zh-hans', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const SITE_URL = 'https://bill2712.github.io';
export const BASE_PATH = '/nursing-tracker-public';
export const SUPPORT_URL = 'https://ko-fi.com/beyond01hk';
export const REPO_URL = 'https://github.com/bill2712/nursing-tracker-public';
export const BRAND = 'NurtureTrack';

export const LOCALE_META: Record<Locale, {
  htmlLang: string;
  hreflang: string;
  ogLocale: string;
  label: string;
  short: string;
}> = {
  en: { htmlLang: 'en', hreflang: 'en', ogLocale: 'en_US', label: 'English', short: 'EN' },
  'zh-hant': { htmlLang: 'zh-Hant', hreflang: 'zh-Hant', ogLocale: 'zh_TW', label: '繁體中文', short: '繁' },
  'zh-hans': { htmlLang: 'zh-Hans', hreflang: 'zh-Hans', ogLocale: 'zh_CN', label: '简体中文', short: '简' },
  ja: { htmlLang: 'ja', hreflang: 'ja', ogLocale: 'ja_JP', label: '日本語', short: '日' }
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

/** URL segment for a locale: English lives at the site root. */
export const langParam = (locale: Locale): string | undefined =>
  locale === DEFAULT_LOCALE ? undefined : locale;

export const localeFromParam = (param: string | undefined): Locale =>
  isLocale(param) ? param : DEFAULT_LOCALE;

/** getStaticPaths entries for a page that exists once per locale. */
export const localeStaticPaths = () =>
  LOCALES.map(locale => ({ params: { lang: langParam(locale) }, props: { locale } }));

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

/**
 * Site-relative URL for a page in a locale, e.g. localePath('ja', '/guides/')
 * → "/nursing-tracker-public/ja/guides/". `page` is the locale-neutral path.
 */
export const localePath = (locale: Locale, page = '/'): string => {
  const parts = [trimSlashes(BASE_PATH), langParam(locale), trimSlashes(page)].filter(Boolean);
  return `/${parts.join('/')}/`.replace(/\/{2,}/g, '/');
};

export const absoluteUrl = (sitePath: string): string => `${SITE_URL}${sitePath}`;

export const assetPath = (file: string): string => `${BASE_PATH}/${trimSlashes(file)}`;
