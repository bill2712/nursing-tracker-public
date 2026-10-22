import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/locales';

export type Guide = CollectionEntry<'guides'> & { slug: string; locale: Locale };

const toGuide = (entry: CollectionEntry<'guides'>): Guide => {
  const [locale, slug] = entry.id.split('/');
  return Object.assign(entry, { locale: locale as Locale, slug });
};

export const getGuides = async (locale: Locale): Promise<Guide[]> =>
  (await getCollection('guides'))
    .map(toGuide)
    .filter(guide => guide.locale === locale)
    .sort((a, b) => a.data.order - b.data.order);

/** Rough reading time: ~230 words/min for English, ~300 characters/min for CJK. */
export const readingMinutes = (body: string, locale: Locale): number => {
  const text = body.replace(/[#>*_`|\-\[\]()]/g, ' ');
  const units = locale === 'en' ? text.split(/\s+/).filter(Boolean).length / 200 : text.replace(/\s+/g, '').length / 300;
  return Math.max(2, Math.round(units));
};
