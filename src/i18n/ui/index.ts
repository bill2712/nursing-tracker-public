import type { Locale } from '../locales';
import en, { type UiStrings } from './en';
import zhHant from './zh-hant';
import zhHans from './zh-hans';
import ja from './ja';

const UI: Record<Locale, UiStrings> = { en, 'zh-hant': zhHant, 'zh-hans': zhHans, ja };

export const useUi = (locale: Locale): UiStrings => UI[locale];
export type { UiStrings };
