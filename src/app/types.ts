export type ActivityType =
  | 'feeding'
  | 'sleep'
  | 'bath'
  | 'pumping'
  | 'diaper'
  | 'solids'
  | 'clear_snot'
  | 'clean_mouth';

export type TimedType = 'feeding' | 'sleep' | 'pumping' | 'bath';
export const TIMED_TYPES: TimedType[] = ['feeding', 'sleep', 'pumping', 'bath'];
export const ALL_TYPES: ActivityType[] = ['feeding', 'sleep', 'bath', 'pumping', 'diaper', 'solids', 'clear_snot', 'clean_mouth'];
export const isTimedType = (type: ActivityType): type is TimedType => (TIMED_TYPES as ActivityType[]).includes(type);

export type FeedingMethod = 'breast' | 'bottle';
export type Side = 'left' | 'right' | 'both';
export type DiaperState = 'wet' | 'dirty' | 'mixed';

export interface LogDetails {
  feedingType?: FeedingMethod;
  side?: Side;
  amountMl?: number;
  diaperState?: DiaperState;
  urineMl?: number;
  foods?: string[];
  reaction?: string;
  notes?: string;
}

export interface LogEntry {
  id: string;
  type: ActivityType;
  startTime: number;
  /** Set for timed activities. */
  endTime?: number;
  durationSeconds?: number;
  details: LogDetails;
}

export interface ActiveTimer {
  type: TimedType;
  startTime: number;
  details: LogDetails;
  /** Set while paused: when the pause started. */
  pauseStartTime?: number;
  /** Set while snoozed: when the timer resumes by itself. */
  snoozeEndTime?: number;
  /** Paused time to leave out of the duration. */
  ignoredDurationMs?: number;
  /** Minutes added by hand (e.g. the timer was started late). */
  addedDurationMs?: number;
}

export interface GrowthEntry {
  id: string;
  date: number;
  /** Always stored in kg. */
  weight?: number;
  /** Always stored in cm. */
  length?: number;
  /** Always stored in cm. */
  headCircumference?: number;
  notes?: string;
}

export type Sex = 'boy' | 'girl';

export interface BabyProfile {
  name: string;
  sex: Sex;
  /** Local midnight of the birth date, or null when not set yet. */
  birthDate: number | null;
  weightUnit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
  volumeUnit: 'ml' | 'oz';
}

export interface VaccineItem {
  id: string;
  /** Key into the translated preset list, or undefined for custom entries. */
  presetKey?: string;
  /** Custom name typed by the user. */
  name?: string;
  ageMonths: number;
  done: boolean;
  date?: number;
}

export interface AppData {
  version: 1;
  logs: LogEntry[];
  activeTimer: ActiveTimer | null;
  growth: GrowthEntry[];
  vaccines: VaccineItem[];
  /** Development checklist item id → timestamp when ticked. */
  checklist: Record<string, number>;
  profile: BabyProfile;
  onboarded: boolean;
  lastBackupAt?: number;
  /** True once the user removed a preset vaccine, so presets are not re-added. */
  vaccinesCustomized?: boolean;
  backupReminderSnoozedAt?: number;
}
