import whoData from '../data/who.json';
import type { Sex } from './types';

export interface WhoPoint {
  month: number;
  L: number;
  M: number;
  S: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

export type Indicator = 'weight' | 'length' | 'head';

const KEYS: Record<Indicator, 'weightForAge' | 'lengthForAge' | 'headCircumferenceForAge'> = {
  weight: 'weightForAge',
  length: 'lengthForAge',
  head: 'headCircumferenceForAge'
};

/** WHO Child Growth Standards, birth to 60 months (weekly for the first 13 weeks). */
export const getWhoSeries = (indicator: Indicator, sex: Sex): WhoPoint[] =>
  (whoData as Record<string, Record<string, WhoPoint[]>>)[KEYS[indicator]][sex === 'girl' ? 'girls' : 'boys'];

/** L, M and S interpolated linearly for an age in months, or null when out of range. */
export const getLms = (indicator: Indicator, sex: Sex, ageMonths: number) => {
  const series = getWhoSeries(indicator, sex);
  if (ageMonths < 0 || ageMonths > series[series.length - 1].month) return null;
  let i = 1;
  while (i < series.length - 1 && series[i].month < ageMonths) i++;
  const a = series[i - 1];
  const b = series[i];
  const span = b.month - a.month || 1;
  const f = Math.min(1, Math.max(0, (ageMonths - a.month) / span));
  return { L: a.L + (b.L - a.L) * f, M: a.M + (b.M - a.M) * f, S: a.S + (b.S - a.S) * f };
};

const erf = (x: number): number => {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
};

/** z-score with the WHO LMS formula. */
export const zScore = (value: number, L: number, M: number, S: number): number =>
  Math.abs(L) < 1e-9 ? Math.log(value / M) / S : (Math.pow(value / M, L) - 1) / (L * S);

export const zToPercentile = (z: number): number => ((1 + erf(z / Math.SQRT2)) / 2) * 100;

/** Percentile (0–100) for a measurement, or null when the age is out of range. */
export const getPercentile = (indicator: Indicator, sex: Sex, ageMonths: number, value: number): number | null => {
  if (!value || value <= 0) return null;
  const lms = getLms(indicator, sex, ageMonths);
  if (!lms) return null;
  return zToPercentile(zScore(value, lms.L, lms.M, lms.S));
};

export const formatPercentile = (p: number): string => (p < 1 ? '<1' : p > 99 ? '>99' : p < 10 ? p.toFixed(1) : Math.round(p).toString());
