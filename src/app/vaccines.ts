/**
 * A generic starting list of common infant vaccines. Schedules differ by
 * country, so the tracker lets parents edit, remove and add entries.
 * Names are translated in the app messages under `vaccines.presets`.
 */
export const VACCINE_PRESETS: { key: string; ageMonths: number }[] = [
  { key: 'hepb-1', ageMonths: 0 },
  { key: 'bcg', ageMonths: 0 },
  { key: 'combo-1', ageMonths: 2 },
  { key: 'pcv-1', ageMonths: 2 },
  { key: 'rota-1', ageMonths: 2 },
  { key: 'combo-2', ageMonths: 4 },
  { key: 'pcv-2', ageMonths: 4 },
  { key: 'rota-2', ageMonths: 4 },
  { key: 'combo-3', ageMonths: 6 },
  { key: 'flu', ageMonths: 6 },
  { key: 'mmr-1', ageMonths: 12 },
  { key: 'pcv-3', ageMonths: 12 },
  { key: 'varicella-1', ageMonths: 12 },
  { key: 'men', ageMonths: 12 },
  { key: 'dtap-booster', ageMonths: 18 },
  { key: 'mmr-2', ageMonths: 18 }
];
