import type { Locale } from './locales';

/** English ordinal suffix: 1st, 2nd, 3rd, 11th, 21st; decimals get "th". */
const ordinal = (value: string) => {
  if (value.includes('.')) return `${value}th`;
  const n = Number(value);
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${value}th`;
  return `${value}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
};

/**
 * Text for a percentile from formatPercentile(), which returns e.g. "42", "3.4", "<1" or ">99".
 */
export const percentileLabel: Record<Locale, (p: string) => string> = {
  en: p => (p.startsWith('<') ? 'below the 1st percentile' : p.startsWith('>') ? 'above the 99th percentile' : `${ordinal(p)} percentile`),
  'zh-hant': p => (p.startsWith('<') ? '低於第 1 百分位' : p.startsWith('>') ? '高於第 99 百分位' : `第 ${p} 百分位`),
  'zh-hans': p => (p.startsWith('<') ? '低于第 1 百分位' : p.startsWith('>') ? '高于第 99 百分位' : `第 ${p} 百分位`),
  ja: p => (p.startsWith('<') ? '1 パーセンタイル未満' : p.startsWith('>') ? '99 パーセンタイル超' : `${p} パーセンタイル`)
};
