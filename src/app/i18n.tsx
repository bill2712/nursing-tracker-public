import React, { createContext, useContext, useMemo } from 'react';
import type { AppMessages } from '../i18n/app/en';
import { LOCALE_META, type Locale } from '../i18n/locales';
import type { BabyProfile } from './types';
import { mlToOz, normalizeMl, ozToMl } from './utils';

export const loadMessages = async (locale: Locale): Promise<AppMessages> => {
  switch (locale) {
    case 'zh-hant': return (await import('../i18n/app/zh-hant')).default;
    case 'zh-hans': return (await import('../i18n/app/zh-hans')).default;
    case 'ja': return (await import('../i18n/app/ja')).default;
    default: return (await import('../i18n/app/en')).default;
  }
};

interface I18nValue {
  m: AppMessages;
  locale: Locale;
  intl: string;
}

const I18nContext = createContext<I18nValue | null>(null);

export const I18nProvider: React.FC<{ messages: AppMessages; locale: Locale; children: React.ReactNode }> = ({ messages, locale, children }) => {
  const value = useMemo(() => ({ m: messages, locale, intl: LOCALE_META[locale].htmlLang }), [messages, locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nValue => {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
};

/** Locale-aware date, time and duration formatting. */
export const useFormat = () => {
  const { m, intl } = useI18n();
  return useMemo(() => {
    const timeFmt = new Intl.DateTimeFormat(intl, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const dayFmt = new Intl.DateTimeFormat(intl, { month: 'long', day: 'numeric', weekday: 'long' });
    const shortFmt = new Intl.DateTimeFormat(intl, { month: 'numeric', day: 'numeric' });
    const dateFmt = new Intl.DateTimeFormat(intl, { year: 'numeric', month: 'short', day: 'numeric' });
    const dateTimeFmt = new Intl.DateTimeFormat(intl, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    return {
      time: (ts: number) => timeFmt.format(ts),
      day: (ts: number) => dayFmt.format(ts),
      short: (ts: number) => shortFmt.format(ts),
      date: (ts: number) => dateFmt.format(ts),
      dateTime: (ts: number) => dateTimeFmt.format(ts),
      ago: (ts: number, now: number = Date.now()) => {
        const mins = Math.max(0, Math.floor((now - ts) / 60000));
        if (mins < 1) return m.time.justNow;
        if (mins < 60) return m.time.minutesAgo(mins);
        const hours = Math.floor(mins / 60);
        if (hours < 48) return m.time.hoursAgo(hours, mins % 60);
        return m.time.daysAgo(Math.floor(hours / 24));
      },
      duration: (seconds: number) => {
        const safe = Math.max(0, Math.round(seconds));
        return m.time.duration(Math.floor(safe / 3600), Math.floor((safe % 3600) / 60));
      },
      durationLong: (seconds: number) => {
        const safe = Math.max(0, Math.round(seconds));
        return m.time.durationLong(Math.floor(safe / 3600), Math.floor((safe % 3600) / 60), safe % 60);
      }
    };
  }, [m, intl]);
};

/** Volume helpers in the parent's preferred unit. Values are always stored in ml. */
export const useVolume = (profile: BabyProfile) =>
  useMemo(() => {
    const oz = profile.volumeUnit === 'oz';
    return {
      unit: oz ? 'oz' : 'ml',
      /** "120 ml" or "4.1 oz" */
      format: (ml: number) => (oz ? `${Math.round(mlToOz(ml) * 10) / 10} oz` : `${Math.round(ml)} ml`),
      /** Number in the display unit, for inputs. */
      toInput: (ml: number | undefined) => (ml === undefined || ml === null ? '' : oz ? String(Math.round(mlToOz(ml) * 10) / 10) : String(Math.round(ml))),
      /** Parse user input in the display unit into ml (1–2000), or null. */
      parse: (value: string) => {
        const num = Number(value);
        if (!value.trim() || !Number.isFinite(num)) return null;
        return normalizeMl(oz ? ozToMl(num) : num);
      },
      presets: oz ? [2, 3, 4, 5, 6, 7] : [60, 90, 120, 150, 180, 210],
      presetToMl: (value: number) => Math.round((oz ? ozToMl(value) : value) * 10) / 10,
      presetLabel: (value: number) => (oz ? `${value} oz` : `${value} ml`),
      step: oz ? '0.5' : '5'
    };
  }, [profile.volumeUnit]);
