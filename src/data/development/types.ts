export interface DevItem {
  /** Stable across languages, used for the tracker's checklist. */
  id: string;
  title: string;
  text: string;
}

export interface DevMonth {
  month: number;
  summary: string;
  /** Skills to look for (checkable in the tracker). */
  abilities: DevItem[];
  /** Normal but hard phases, e.g. growth spurts and sleep regressions. */
  challenges: DevItem[];
  /** Play and interaction ideas (checkable). */
  exercises: DevItem[];
  /** Care tips (checkable). */
  care: DevItem[];
  /** Signs to discuss with a doctor or health visitor. */
  redFlags: string[];
}

export const DEV_MONTHS = [0, 1, 2, 3, 4, 6, 9, 12, 18, 24] as const;
