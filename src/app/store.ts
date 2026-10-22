import { useSyncExternalStore } from 'react';
import { ALL_TYPES, TIMED_TYPES, type ActiveTimer, type AppData, type BabyProfile, type GrowthEntry, type LogDetails, type LogEntry, type VaccineItem } from './types';
import { generateId } from './utils';
import { VACCINE_PRESETS } from './vaccines';

export const STORAGE_KEY = 'nurturetrack:v1';

export const defaultProfile = (): BabyProfile => ({
  name: '',
  sex: 'girl',
  birthDate: null,
  weightUnit: 'kg',
  lengthUnit: 'cm',
  volumeUnit: 'ml'
});

export const defaultVaccines = (): VaccineItem[] =>
  VACCINE_PRESETS.map(preset => ({ id: preset.key, presetKey: preset.key, ageMonths: preset.ageMonths, done: false }));

export const defaultData = (): AppData => ({
  version: 1,
  logs: [],
  activeTimer: null,
  growth: [],
  vaccines: defaultVaccines(),
  checklist: {},
  profile: defaultProfile(),
  onboarded: false
});

const isObject = (value: unknown): value is Record<string, any> => typeof value === 'object' && value !== null && !Array.isArray(value);

// Timestamps outside 2000–2100 are typos or corrupt data; they would break date formatting.
const MIN_TIME = Date.UTC(2000, 0, 1);
const MAX_TIME = Date.UTC(2100, 0, 1);

const toNumber = (value: unknown): number | undefined => {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
};
const toTime = (value: unknown): number | undefined => {
  const time = toNumber(value);
  return time !== undefined && time >= MIN_TIME && time <= MAX_TIME ? time : undefined;
};
const inRange = (value: unknown, min: number, max: number): number | undefined => {
  const number = toNumber(value);
  return number !== undefined && number >= min && number <= max ? number : undefined;
};
const toText = (value: unknown, max = 500): string | undefined =>
  typeof value === 'string' && value.trim() ? value.slice(0, max) : undefined;
const toId = (value: unknown): string | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? String(value) : toText(value, 100);
const oneOf = <T extends string>(value: unknown, options: readonly T[]): T | undefined =>
  options.includes(value as T) ? value as T : undefined;

/** Drop undefined keys so stored objects stay small and comparable. */
const compact = <T extends object>(object: T): T =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined)) as T;

const sanitizeDetails = (raw: unknown): LogDetails => {
  if (!isObject(raw)) return {};
  return compact({
    feedingType: oneOf(raw.feedingType, ['breast', 'bottle'] as const),
    side: oneOf(raw.side, ['left', 'right', 'both'] as const),
    amountMl: inRange(raw.amountMl, 0, 5000),
    diaperState: oneOf(raw.diaperState, ['wet', 'dirty', 'mixed'] as const),
    urineMl: inRange(raw.urineMl, 0, 5000),
    foods: Array.isArray(raw.foods) ? raw.foods.map(food => toText(food, 80)).filter(Boolean).slice(0, 50) as string[] : undefined,
    reaction: toText(raw.reaction),
    notes: toText(raw.notes, 2000)
  });
};

const sanitizeLog = (raw: unknown): LogEntry | null => {
  if (!isObject(raw)) return null;
  const type = oneOf(raw.type, ALL_TYPES);
  const startTime = toTime(raw.startTime);
  if (!type || startTime === undefined) return null;
  const endTime = toTime(raw.endTime);
  const durationSeconds = inRange(raw.durationSeconds, 1, 7 * 24 * 3600);
  return compact({
    // Entries without an id get a stable one, so importing the same file twice adds nothing.
    id: toId(raw.id) ?? `${type}-${startTime}`,
    type,
    startTime,
    endTime: endTime !== undefined && endTime >= startTime ? endTime : undefined,
    durationSeconds: durationSeconds !== undefined ? Math.round(durationSeconds) : undefined,
    details: sanitizeDetails(raw.details)
  });
};

const sanitizeGrowth = (raw: unknown): GrowthEntry | null => {
  if (!isObject(raw)) return null;
  const date = toTime(raw.date);
  if (date === undefined) return null;
  const entry = compact({
    id: toId(raw.id) ?? `growth-${date}`,
    date,
    weight: inRange(raw.weight, 0.01, 200),
    length: inRange(raw.length, 0.1, 250),
    headCircumference: inRange(raw.headCircumference, 0.1, 100),
    notes: toText(raw.notes, 2000)
  });
  return entry.weight === undefined && entry.length === undefined && entry.headCircumference === undefined ? null : entry;
};

const sanitizeVaccine = (raw: unknown): VaccineItem | null => {
  if (!isObject(raw)) return null;
  const id = toId(raw.id);
  const ageMonths = inRange(raw.ageMonths, 0, 240);
  if (!id || ageMonths === undefined) return null;
  return compact({
    id,
    presetKey: toText(raw.presetKey, 100),
    name: toText(raw.name, 120),
    ageMonths,
    done: raw.done === true,
    date: toTime(raw.date)
  });
};

const sanitizeTimer = (raw: unknown): ActiveTimer | null => {
  if (!isObject(raw)) return null;
  const type = oneOf(raw.type, TIMED_TYPES);
  const startTime = toTime(raw.startTime);
  if (!type || startTime === undefined) return null;
  return compact({
    type,
    startTime,
    details: sanitizeDetails(raw.details),
    pauseStartTime: toTime(raw.pauseStartTime),
    snoozeEndTime: toTime(raw.snoozeEndTime),
    ignoredDurationMs: inRange(raw.ignoredDurationMs, 0, 1e10),
    addedDurationMs: inRange(raw.addedDurationMs, 0, 1e10)
  });
};

const sanitizeProfile = (raw: unknown): BabyProfile => {
  const base = defaultProfile();
  if (!isObject(raw)) return base;
  return {
    name: typeof raw.name === 'string' ? raw.name.slice(0, 60) : base.name,
    sex: oneOf(raw.sex, ['boy', 'girl'] as const) ?? base.sex,
    birthDate: toTime(raw.birthDate) ?? null,
    weightUnit: oneOf(raw.weightUnit, ['kg', 'lb'] as const) ?? base.weightUnit,
    lengthUnit: oneOf(raw.lengthUnit, ['cm', 'in'] as const) ?? base.lengthUnit,
    volumeUnit: oneOf(raw.volumeUnit, ['ml', 'oz'] as const) ?? base.volumeUnit
  };
};

const keepValid = <T>(list: unknown, sanitize: (raw: unknown) => T | null): T[] =>
  Array.isArray(list) ? list.map(sanitize).filter((item): item is T => item !== null) : [];

/** Keep the first item for each id. */
const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter(item => (seen.has(item.id) ? false : (seen.add(item.id), true)));
};

/** Fill in anything missing from older or hand-edited data, and drop anything invalid. */
export const normalizeData = (raw: unknown): AppData => {
  const base = defaultData();
  if (!isObject(raw)) return base;
  const vaccines = Array.isArray(raw.vaccines) ? uniqueById(keepValid(raw.vaccines, sanitizeVaccine)) : base.vaccines;
  // Add presets introduced after this data was created.
  const known = new Set(vaccines.map(v => v.id));
  for (const preset of base.vaccines) if (!known.has(preset.id) && !raw.vaccinesCustomized) vaccines.push(preset);
  const checklist: Record<string, number> = {};
  if (isObject(raw.checklist)) {
    for (const [key, value] of Object.entries(raw.checklist)) {
      const time = toTime(value);
      if (time !== undefined && key !== '__proto__') checklist[key] = time;
    }
  }
  return {
    ...base,
    logs: uniqueById(keepValid(raw.logs, sanitizeLog)).sort((a, b) => b.startTime - a.startTime),
    activeTimer: sanitizeTimer(raw.activeTimer),
    growth: uniqueById(keepValid(raw.growth, sanitizeGrowth)).sort((a, b) => a.date - b.date),
    vaccines: vaccines.sort((a, b) => a.ageMonths - b.ageMonths),
    checklist,
    profile: sanitizeProfile(raw.profile),
    onboarded: Boolean(raw.onboarded),
    lastBackupAt: toTime(raw.lastBackupAt),
    vaccinesCustomized: Boolean(raw.vaccinesCustomized),
    backupReminderSnoozedAt: toTime(raw.backupReminderSnoozedAt)
  };
};

const readStorage = (): AppData => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeData(JSON.parse(stored)) : defaultData();
  } catch {
    return defaultData();
  }
};

let state: AppData | null = null;
const listeners = new Set<() => void>();
let persistErrorHandler: ((error: unknown) => void) | null = null;
let saveScheduled = false;

export const onPersistError = (handler: (error: unknown) => void) => { persistErrorHandler = handler; };

const persist = () => {
  if (saveScheduled) return;
  saveScheduled = true;
  // Coalesce several updates in the same tick into one write.
  queueMicrotask(() => {
    saveScheduled = false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      persistErrorHandler?.(error);
    }
  });
};

const emit = () => listeners.forEach(listener => listener());

export const getData = (): AppData => {
  if (!state) state = readStorage();
  return state;
};

export const setData = (updater: (previous: AppData) => AppData) => {
  state = updater(getData());
  persist();
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      state = readStorage();
      emit();
    }
  };
  // A page restored from the back/forward cache missed storage events while it was away.
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      state = readStorage();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('pageshow', onPageShow);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('pageshow', onPageShow);
  };
};

export const useAppData = (): AppData => useSyncExternalStore(subscribe, getData, getData);

const sortLogs = (logs: LogEntry[]) => logs.sort((a, b) => b.startTime - a.startTime);

export const actions = {
  saveLog(log: LogEntry) {
    setData(d => ({ ...d, logs: sortLogs([log, ...d.logs.filter(l => l.id !== log.id)]) }));
  },
  removeLog(id: string): LogEntry | undefined {
    const removed = getData().logs.find(l => l.id === id);
    setData(d => ({ ...d, logs: d.logs.filter(l => l.id !== id) }));
    return removed;
  },
  setTimer(timer: ActiveTimer | null) {
    setData(d => ({ ...d, activeTimer: timer }));
  },
  updateTimer(update: (timer: ActiveTimer) => ActiveTimer) {
    setData(d => (d.activeTimer ? { ...d, activeTimer: update(d.activeTimer) } : d));
  },
  setProfile(profile: BabyProfile) {
    setData(d => ({ ...d, profile }));
  },
  completeOnboarding(profile: BabyProfile) {
    setData(d => ({ ...d, profile, onboarded: true }));
  },
  saveGrowth(entry: GrowthEntry) {
    setData(d => ({ ...d, growth: [...d.growth.filter(g => g.id !== entry.id), entry].sort((a, b) => a.date - b.date) }));
  },
  removeGrowth(id: string) {
    setData(d => ({ ...d, growth: d.growth.filter(g => g.id !== id) }));
  },
  toggleVaccine(id: string) {
    setData(d => ({
      ...d,
      vaccines: d.vaccines.map(v => (v.id === id ? (v.done ? { ...v, done: false, date: undefined } : { ...v, done: true, date: Date.now() }) : v))
    }));
  },
  setVaccineDate(id: string, date: number) {
    setData(d => ({ ...d, vaccines: d.vaccines.map(v => (v.id === id ? { ...v, date } : v)) }));
  },
  addVaccine(name: string, ageMonths: number) {
    const item: VaccineItem = { id: `custom-${generateId()}`, name, ageMonths, done: false };
    setData(d => ({ ...d, vaccines: [...d.vaccines, item].sort((a, b) => a.ageMonths - b.ageMonths) }));
  },
  removeVaccine(id: string) {
    setData(d => ({ ...d, vaccines: d.vaccines.filter(v => v.id !== id), vaccinesCustomized: true }));
  },
  resetVaccines() {
    setData(d => ({ ...d, vaccines: defaultVaccines(), vaccinesCustomized: false }));
  },
  toggleChecklist(id: string) {
    setData(d => {
      const checklist = { ...d.checklist };
      if (checklist[id]) delete checklist[id]; else checklist[id] = Date.now();
      return { ...d, checklist };
    });
  },
  snoozeBackupReminder() {
    setData(d => ({ ...d, backupReminderSnoozedAt: Date.now() }));
  },
  /** Backup file contents; also records the backup time. */
  exportBackup(): string {
    const now = Date.now();
    setData(d => ({ ...d, lastBackupAt: now }));
    const { activeTimer, ...data } = getData();
    return JSON.stringify({ app: 'nurturetrack', format: 1, exportedAt: new Date(now).toISOString(), data }, null, 2);
  },
  /** Merge a backup into the current data. Returns how many new items were added. */
  importBackup(text: string): { logs: number; growth: number } | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return null;
    }
    const incomingRaw = Array.isArray(parsed) ? { logs: parsed } : isObject(parsed) && isObject(parsed.data) ? parsed.data : parsed;
    if (!isObject(incomingRaw) || (!Array.isArray(incomingRaw.logs) && !Array.isArray(incomingRaw.growth))) return null;
    const incoming = normalizeData({ ...incomingRaw, onboarded: true });
    const hasProfile = isObject(incomingRaw.profile);
    const current = getData();
    const logIds = new Set(current.logs.map(l => l.id));
    const newLogs = incoming.logs.filter(l => !logIds.has(l.id));
    const growthIds = new Set(current.growth.map(g => g.id));
    const newGrowth = incoming.growth.filter(g => !growthIds.has(g.id));
    const incomingVaccines = new Map(incoming.vaccines.map(v => [v.id, v]));
    setData(d => {
      // Keep this device's profile once set up; only fill in what is missing.
      const profile = !hasProfile
        ? d.profile
        : d.onboarded
          ? { ...d.profile, name: d.profile.name || incoming.profile.name, birthDate: d.profile.birthDate ?? incoming.profile.birthDate }
          : incoming.profile;
      return {
        ...d,
        logs: sortLogs([...d.logs, ...newLogs]),
        growth: [...d.growth, ...newGrowth].sort((a, b) => a.date - b.date),
        vaccines: [
          ...d.vaccines.map(v => {
            const other = incomingVaccines.get(v.id);
            return other && other.done && !v.done ? { ...v, done: true, date: other.date } : v;
          }),
          ...incoming.vaccines.filter(v => v.id.startsWith('custom-') && !d.vaccines.some(x => x.id === v.id))
        ].sort((a, b) => a.ageMonths - b.ageMonths),
        checklist: { ...incoming.checklist, ...d.checklist },
        profile,
        onboarded: true
      };
    });
    return { logs: newLogs.length, growth: newGrowth.length };
  },
  clearAll() {
    setData(() => ({ ...defaultData(), onboarded: false }));
  }
};
