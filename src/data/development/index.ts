import type { Locale } from '../../i18n/locales';
import type { DevMonth } from './types';

/** Load one language's development content (code-split per locale). */
export const loadDevelopment = async (locale: Locale): Promise<DevMonth[]> => {
  switch (locale) {
    case 'zh-hant': return (await import('./zh-hant')).default;
    case 'zh-hans': return (await import('./zh-hans')).default;
    case 'ja': return (await import('./ja')).default;
    default: return (await import('./en')).default;
  }
};

/** The development month that best matches an age (the latest stage reached). */
export const monthForAge = (ageMonths: number | null, months: readonly number[]): number => {
  if (ageMonths === null || ageMonths < 0) return months[0];
  let pick = months[0];
  for (const month of months) if (ageMonths + 0.25 >= month) pick = month;
  return pick;
};

export type { DevMonth, DevItem } from './types';
export { DEV_MONTHS } from './types';
