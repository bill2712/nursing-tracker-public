import { startOfDay, startOfWeek } from 'date-fns';
import type { ActiveTimer, LogEntry } from './types';

export const generateId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  } catch {
    // Fall through to the simple generator.
  }
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
};

export const ML_PER_OZ = 29.5735;
export const mlToOz = (ml: number) => ml / ML_PER_OZ;
export const ozToMl = (oz: number) => oz * ML_PER_OZ;
export const kgToLb = (kg: number) => kg * 2.20462;
export const lbToKg = (lb: number) => lb / 2.20462;
export const cmToIn = (cm: number) => cm / 2.54;
export const inToCm = (inches: number) => inches * 2.54;

/** A sensible millilitre amount (up to 2000), to 0.1 ml so oz amounts round-trip, or null. */
export const normalizeMl = (value: unknown, max = 2000): number | null => {
  const amount = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > max) return null;
  return Math.round(amount * 10) / 10;
};

export const formatTimer = (totalSeconds: number): string => {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600).toString().padStart(2, '0');
  const m = Math.floor((safe % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

/** Local "YYYY-MM-DDTHH:mm" for datetime-local inputs. */
export const toLocalInput = (timestamp: number): string => {
  const d = new Date(timestamp);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/** Local "YYYY-MM-DD" for date inputs. */
export const toLocalDateInput = (timestamp: number): string => toLocalInput(timestamp).slice(0, 10);

export const fromLocalDateInput = (value: string): number | null => {
  if (!value) return null;
  const ts = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(ts) ? ts : null;
};

export const dayKey = (timestamp: number): string => toLocalDateInput(timestamp);

/** Elapsed seconds shown on a running timer. */
/** A snooze that has already ended counts as resumed at its end time, even if the app was closed. */
export const resolveSnooze = <T extends Pick<ActiveTimer, 'pauseStartTime' | 'snoozeEndTime' | 'ignoredDurationMs'>>(timer: T, now: number = Date.now()): T => {
  if (!timer.snoozeEndTime || !timer.pauseStartTime || timer.snoozeEndTime > now) return timer;
  const { pauseStartTime, snoozeEndTime, ...running } = timer;
  return { ...running, ignoredDurationMs: (timer.ignoredDurationMs || 0) + Math.max(0, snoozeEndTime - pauseStartTime) } as T;
};

export const getTimerElapsedSeconds = (timer: ActiveTimer, now: number = Date.now()): number => {
  const current = resolveSnooze(timer, now);
  const end = current.pauseStartTime || now;
  return Math.floor((end - current.startTime - (current.ignoredDurationMs || 0) + (current.addedDurationMs || 0)) / 1000);
};

/**
 * Times to save when a timer is finished. Matches what the timer shows:
 * paused time is left out and manually added minutes are counted. Added time
 * moves the start earlier so the saved start/end span shows it too.
 */
export const getFinishedTimerTimes = (
  timer: Pick<ActiveTimer, 'startTime' | 'pauseStartTime' | 'snoozeEndTime' | 'ignoredDurationMs' | 'addedDurationMs'>,
  now: number = Date.now()
) => {
  const current = resolveSnooze(timer, now);
  const endTime = current.pauseStartTime || now;
  const addedMs = Math.max(0, current.addedDurationMs || 0);
  const startTime = current.startTime - addedMs;
  const durationSeconds = Math.floor((endTime - startTime - (current.ignoredDurationMs || 0)) / 1000);
  return { startTime, endTime, durationSeconds };
};

export const getFoodIntakeTotals = (logs: LogEntry[]) => {
  const totals = logs.reduce((result, log) => {
    const amountMl = normalizeMl(log.details?.amountMl) || 0;
    if (log.type === 'feeding') result.feedingMl += amountMl;
    if (log.type === 'solids') result.solidsMl += amountMl;
    return result;
  }, { feedingMl: 0, solidsMl: 0 });
  return { ...totals, totalMl: totals.feedingMl + totals.solidsMl };
};

type LastKind = 'feeding' | 'sleep' | 'bath' | 'pumping' | 'diaper' | 'solids';

export interface TrackerSummary {
  last: Partial<Record<LastKind, LogEntry>>;
  today: {
    feeds: number;
    feedingMl: number;
    solidsMl: number;
    totalMl: number;
    pumpedMl: number;
    sleepSeconds: number;
    diapers: { wet: number; dirty: number; total: number };
    urineMl: number;
    snot: number;
    mouth: number;
  };
  weekBaths: number;
}

/** Everything the home screen shows, computed in a single pass over the logs. */
export const getTrackerSummary = (logs: LogEntry[], now: number = Date.now()): TrackerSummary => {
  const dayStart = startOfDay(now).getTime();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const summary: TrackerSummary = {
    last: {},
    today: {
      feeds: 0, feedingMl: 0, solidsMl: 0, totalMl: 0, pumpedMl: 0, sleepSeconds: 0,
      diapers: { wet: 0, dirty: 0, total: 0 }, urineMl: 0, snot: 0, mouth: 0
    },
    weekBaths: 0
  };
  const t = summary.today;

  for (const log of logs) {
    // A future time is usually a typo; it should not show up as the latest entry.
    if (log.type in { feeding: 1, sleep: 1, bath: 1, pumping: 1, diaper: 1, solids: 1 } && log.startTime <= now) {
      const kind = log.type as LastKind;
      const previous = summary.last[kind];
      if (!previous || log.startTime > previous.startTime) summary.last[kind] = log;
    }
    if (log.type === 'bath' && log.startTime >= weekStart) summary.weekBaths++;
    if (log.startTime < dayStart || log.startTime > now) continue;

    const details = log.details || {};
    switch (log.type) {
      case 'feeding':
        t.feeds++;
        t.feedingMl += normalizeMl(details.amountMl) || 0;
        break;
      case 'solids':
        t.solidsMl += normalizeMl(details.amountMl) || 0;
        break;
      case 'pumping':
        t.pumpedMl += normalizeMl(details.amountMl) || 0;
        break;
      case 'sleep':
        t.sleepSeconds += Math.max(0, log.durationSeconds || 0);
        break;
      case 'diaper':
        t.diapers.total++;
        if (details.diaperState === 'wet' || details.diaperState === 'mixed') t.diapers.wet++;
        if (details.diaperState === 'dirty' || details.diaperState === 'mixed') t.diapers.dirty++;
        t.urineMl += normalizeMl(details.urineMl) || 0;
        break;
      case 'clear_snot':
        t.snot++;
        break;
      case 'clean_mouth':
        t.mouth++;
        break;
    }
  }

  t.totalMl = t.feedingMl + t.solidsMl;
  return summary;
};

export interface DayTrend {
  key: string;
  date: number;
  feedingMl: number;
  feedingCount: number;
  solidsMl: number;
  totalMl: number;
  urineMl: number;
  wet: number;
  dirty: number;
  sleepHours: number;
  pumpedMl: number;
  hasFood: boolean;
}

/** Per-day totals for the last `days` days, oldest first. */
export const getDailyTrends = (logs: LogEntry[], days: number, now: number = Date.now()): DayTrend[] => {
  const today = startOfDay(now);
  const result: DayTrend[] = [];
  const byKey = new Map<string, DayTrend>();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const entry: DayTrend = {
      key: dayKey(date.getTime()), date: date.getTime(), feedingMl: 0, feedingCount: 0, solidsMl: 0, totalMl: 0,
      urineMl: 0, wet: 0, dirty: 0, sleepHours: 0, pumpedMl: 0, hasFood: false
    };
    result.push(entry);
    byKey.set(entry.key, entry);
  }
  const first = result[0].date;
  for (const log of logs) {
    if (log.startTime < first || log.startTime > now) continue;
    const day = byKey.get(dayKey(log.startTime));
    if (!day) continue;
    const details = log.details || {};
    if (log.type === 'feeding') {
      day.feedingCount++;
      day.feedingMl += normalizeMl(details.amountMl) || 0;
      day.hasFood = true;
    } else if (log.type === 'solids') {
      day.solidsMl += normalizeMl(details.amountMl) || 0;
      day.hasFood = true;
    } else if (log.type === 'diaper') {
      if (details.diaperState === 'wet' || details.diaperState === 'mixed') day.wet++;
      if (details.diaperState === 'dirty' || details.diaperState === 'mixed') day.dirty++;
      day.urineMl += normalizeMl(details.urineMl) || 0;
    } else if (log.type === 'sleep') {
      day.sleepHours += Math.max(0, log.durationSeconds || 0) / 3600;
    } else if (log.type === 'pumping') {
      day.pumpedMl += normalizeMl(details.amountMl) || 0;
    }
  }
  for (const day of result) {
    day.totalMl = day.feedingMl + day.solidsMl;
    day.sleepHours = Math.round(day.sleepHours * 10) / 10;
  }
  return result;
};

/** Typical daily milk guide for formula-fed babies: ~150 ml/kg/day, capped at 1000 ml. */
export const getMilkGuideMl = (weightKg: number | undefined, ageMonths: number | null) => {
  if (!weightKg || weightKg <= 0) return null;
  if (ageMonths !== null && ageMonths >= 12) return null;
  // From about 6 months solids replace some milk; ~500–700 ml a day is typical.
  if (ageMonths !== null && ageMonths >= 6) return { target: 600, low: 500, high: 700 };
  const cap = 1000;
  const target = Math.min(cap, Math.round(weightKg * 150));
  return { target, low: Math.min(cap, Math.round(weightKg * 120)), high: Math.min(cap, Math.round(weightKg * 180)) };
};

export const getAgeInMonths = (birthDate: number, targetDate: number = Date.now()): number =>
  (targetDate - birthDate) / (1000 * 60 * 60 * 24) / 30.4375;

export const getGrowthViewMaxAge = (maxUserAge: number): 6 | 12 | 24 | 36 | 60 => {
  if (maxUserAge > 30) return 60;
  if (maxUserAge > 20) return 36;
  if (maxUserAge > 10) return 24;
  if (maxUserAge > 4) return 12;
  return 6;
};

export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const toCsv = (header: string[], rows: string[][]): string => {
  const escape = (raw: string) => {
    // A leading = + - @ makes spreadsheet apps run the cell as a formula.
    const value = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  };
  return `﻿${[header, ...rows].map(row => row.map(escape).join(',')).join('\r\n')}`;
};
