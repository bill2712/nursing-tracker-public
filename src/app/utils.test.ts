import { describe, expect, it } from 'vitest';
import { getDailyTrends, getFinishedTimerTimes, getMilkGuideMl, getTimerElapsedSeconds, getTrackerSummary, normalizeMl, toCsv } from './utils';
import type { LogEntry } from './types';

const at = (d: number, h: number, min = 0) => new Date(2026, 7, d, h, min).getTime();

describe('normalizeMl', () => {
  it('accepts and rounds sensible amounts', () => {
    expect(normalizeMl('42.6')).toBe(43);
    expect(normalizeMl(120)).toBe(120);
  });
  it('rejects empty, negative and excessive amounts', () => {
    expect(normalizeMl('')).toBeNull();
    expect(normalizeMl(-1)).toBeNull();
    expect(normalizeMl(2001)).toBeNull();
  });
});

describe('getTrackerSummary', () => {
  it('summarises today and finds the latest of each activity', () => {
    const now = at(26, 12); // Wednesday; week starts Monday the 24th
    const logs: LogEntry[] = [
      { id: 'f1', type: 'feeding', startTime: at(26, 8), endTime: at(26, 8, 15), details: { feedingType: 'bottle', amountMl: 120 } },
      { id: 'f0', type: 'feeding', startTime: at(25, 22), details: { amountMl: 150 } },
      { id: 's1', type: 'solids', startTime: at(26, 9), details: { amountMl: 40 } },
      { id: 'd1', type: 'diaper', startTime: at(26, 10), details: { diaperState: 'mixed', urineMl: 30 } },
      { id: 'd2', type: 'diaper', startTime: at(26, 11), details: { diaperState: 'wet' } },
      { id: 'z1', type: 'sleep', startTime: at(26, 6), endTime: at(26, 7, 30), durationSeconds: 5400, details: {} },
      { id: 'b1', type: 'bath', startTime: at(24, 19), details: {} },
      { id: 'b0', type: 'bath', startTime: at(23, 19), details: {} },
      { id: 'p1', type: 'pumping', startTime: at(26, 5), details: { amountMl: 90 } },
      { id: 'n1', type: 'clear_snot', startTime: at(26, 7), details: {} }
    ];
    const s = getTrackerSummary(logs, now);
    expect(s.last.feeding?.id).toBe('f1');
    expect(s.weekBaths).toBe(1);
    expect(s.today).toMatchObject({ feeds: 1, feedingMl: 120, solidsMl: 40, totalMl: 160, pumpedMl: 90, sleepSeconds: 5400, urineMl: 30, snot: 1, mouth: 0 });
    expect(s.today.diapers).toEqual({ wet: 2, dirty: 1, total: 2 });
  });
});

describe('timers', () => {
  const minute = 60_000;
  const start = at(26, 10);
  it('shows and saves the same duration, including added minutes', () => {
    const timer = { startTime: start, addedDurationMs: 10 * minute, ignoredDurationMs: 0 };
    const now = start + 5 * minute;
    expect(getTimerElapsedSeconds({ ...timer, type: 'feeding', details: {} }, now)).toBe(15 * 60);
    const saved = getFinishedTimerTimes(timer, now);
    expect(saved.durationSeconds).toBe(15 * 60);
    expect(saved.startTime).toBe(start - 10 * minute);
    expect(saved.endTime).toBe(now);
  });
  it('leaves out paused time and ends at the pause', () => {
    const pauseStartTime = start + 20 * minute;
    const saved = getFinishedTimerTimes({ startTime: start, ignoredDurationMs: 4 * minute, pauseStartTime }, start + 60 * minute);
    expect(saved.endTime).toBe(pauseStartTime);
    expect(saved.durationSeconds).toBe(16 * 60);
  });
});

describe('getDailyTrends', () => {
  it('buckets logs into local days, oldest first', () => {
    const now = at(26, 12);
    const logs: LogEntry[] = [
      { id: 'a', type: 'feeding', startTime: at(26, 1), details: { amountMl: 100 } },
      { id: 'b', type: 'feeding', startTime: at(25, 23, 59), details: { amountMl: 80 } },
      { id: 'c', type: 'diaper', startTime: at(25, 9), details: { diaperState: 'dirty' } }
    ];
    const days = getDailyTrends(logs, 3, now);
    expect(days).toHaveLength(3);
    expect(days[2]).toMatchObject({ feedingMl: 100, feedingCount: 1, hasFood: true });
    expect(days[1]).toMatchObject({ feedingMl: 80, dirty: 1, wet: 0 });
    expect(days[0].hasFood).toBe(false);
  });
});

describe('getMilkGuideMl', () => {
  it('uses ~150 ml/kg/day under 6 months, capped at 1000 ml', () => {
    expect(getMilkGuideMl(4, 1)).toEqual({ target: 600, low: 480, high: 720 });
    expect(getMilkGuideMl(8, 5)?.target).toBe(1000);
  });
  it('uses a fixed range from 6 months and nothing after a year', () => {
    expect(getMilkGuideMl(8, 7)).toEqual({ target: 600, low: 500, high: 700 });
    expect(getMilkGuideMl(10, 13)).toBeNull();
    expect(getMilkGuideMl(undefined, 2)).toBeNull();
  });
});

describe('toCsv', () => {
  it('escapes commas, quotes and new lines', () => {
    expect(toCsv(['a', 'b'], [['x,y', 'say "hi"\nok']])).toBe('﻿a,b\r\n"x,y","say ""hi""\nok"');
  });
});
