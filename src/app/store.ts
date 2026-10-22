import { useSyncExternalStore } from 'react';
import { ALL_TYPES, type ActivityType, type ActiveTimer, type AppData, type BabyProfile, type GrowthEntry, type LogEntry, type VaccineItem } from './types';
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

const sanitizeLog = (raw: any): LogEntry | null => {
  if (!isObject(raw) || !ALL_TYPES.includes(raw.type as ActivityType) || !Number.isFinite(Number(raw.startTime))) return null;
  const log: LogEntry = {
    id: String(raw.id ?? generateId()),
    type: raw.type as ActivityType,
    startTime: Number(raw.startTime),
    details: isObject(raw.details) ? { ...raw.details } : {}
  };
  if (Number.isFinite(Number(raw.endTime)) && raw.endTime) log.endTime = Number(raw.endTime);
  if (Number.isFinite(Number(raw.durationSeconds)) && raw.durationSeconds) log.durationSeconds = Number(raw.durationSeconds);
  return log;
};

/** Fill in anything missing from older or hand-edited data. */
export const normalizeData = (raw: unknown): AppData => {
  const base = defaultData();
  if (!isObject(raw)) return base;
  const logs = Array.isArray(raw.logs) ? raw.logs.map(sanitizeLog).filter(Boolean) as LogEntry[] : [];
  const vaccines: VaccineItem[] = Array.isArray(raw.vaccines) ? raw.vaccines.filter(isObject) as VaccineItem[] : base.vaccines;
  // Add presets introduced after this data was created.
  const known = new Set(vaccines.map(v => v.id));
  for (const preset of base.vaccines) if (!known.has(preset.id) && !raw.vaccinesCustomized) vaccines.push(preset);
  return {
    ...base,
    logs: logs.sort((a, b) => b.startTime - a.startTime),
    activeTimer: isObject(raw.activeTimer) ? raw.activeTimer as ActiveTimer : null,
    growth: Array.isArray(raw.growth) ? raw.growth.filter(isObject) as GrowthEntry[] : [],
    vaccines: vaccines.sort((a, b) => a.ageMonths - b.ageMonths),
    checklist: isObject(raw.checklist) ? raw.checklist as Record<string, number> : {},
    profile: { ...base.profile, ...(isObject(raw.profile) ? raw.profile : {}) },
    onboarded: Boolean(raw.onboarded),
    lastBackupAt: typeof raw.lastBackupAt === 'number' ? raw.lastBackupAt : undefined,
    vaccinesCustomized: Boolean(raw.vaccinesCustomized),
    backupReminderSnoozedAt: typeof raw.backupReminderSnoozedAt === 'number' ? raw.backupReminderSnoozedAt : undefined
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
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
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
    const current = getData();
    const logIds = new Set(current.logs.map(l => l.id));
    const newLogs = incoming.logs.filter(l => !logIds.has(l.id));
    const growthIds = new Set(current.growth.map(g => g.id));
    const newGrowth = incoming.growth.filter(g => !growthIds.has(g.id));
    const incomingVaccines = new Map(incoming.vaccines.map(v => [v.id, v]));
    setData(d => ({
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
      profile: d.onboarded && d.profile.birthDate ? d.profile : incoming.profile,
      onboarded: true
    }));
    return { logs: newLogs.length, growth: newGrowth.length };
  },
  clearAll() {
    setData(() => ({ ...defaultData(), onboarded: false }));
  }
};
