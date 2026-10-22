import { beforeEach, describe, expect, it } from 'vitest';

// Minimal browser stubs for the store.
const memory = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k)
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};

const { actions, getData, normalizeData, STORAGE_KEY } = await import('./store');

// A realistic base time; the store rejects dates before 2000.
const T = Date.UTC(2026, 0, 1);

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('store', () => {
  beforeEach(() => actions.clearAll());

  it('saves logs newest first and persists them', async () => {
    actions.saveLog({ id: 'a', type: 'diaper', startTime: T + 1000, details: { diaperState: 'wet' } });
    actions.saveLog({ id: 'b', type: 'feeding', startTime: T + 2000, details: {} });
    expect(getData().logs.map(l => l.id)).toEqual(['b', 'a']);
    await flush();
    expect(JSON.parse(memory.get(STORAGE_KEY)!).logs).toHaveLength(2);
  });

  it('returns the removed log so it can be restored', () => {
    actions.saveLog({ id: 'a', type: 'diaper', startTime: T + 1000, details: {} });
    const removed = actions.removeLog('a');
    expect(getData().logs).toHaveLength(0);
    actions.saveLog(removed!);
    expect(getData().logs).toHaveLength(1);
  });

  it('exports a backup and merges it without duplicates', () => {
    actions.saveLog({ id: 'a', type: 'diaper', startTime: T + 1000, details: {} });
    actions.saveGrowth({ id: 'g1', date: T + 5000, weight: 4.2 });
    const backup = actions.exportBackup();
    expect(getData().lastBackupAt).toBeTypeOf('number');

    actions.clearAll();
    actions.saveLog({ id: 'z', type: 'sleep', startTime: T + 3000, details: {} });
    expect(actions.importBackup(backup)).toEqual({ logs: 1, growth: 1 });
    expect(actions.importBackup(backup)).toEqual({ logs: 0, growth: 0 });
    expect(getData().logs.map(l => l.id)).toEqual(['z', 'a']);
    expect(getData().onboarded).toBe(true);
  });

  it('accepts a plain array of logs and rejects invalid files', () => {
    expect(actions.importBackup(JSON.stringify([{ id: 1, type: 'feeding', startTime: T + 10, details: {} }, { type: 'unknown', startTime: T + 5 }]))).toEqual({ logs: 1, growth: 0 });
    expect(getData().logs[0].id).toBe('1');
    expect(actions.importBackup('not json')).toBeNull();
    expect(actions.importBackup('{"hello":1}')).toBeNull();
  });

  it('fills in defaults for old or partial data', () => {
    const data = normalizeData({ logs: [{ id: 'x', type: 'bath', startTime: T + 1, details: {} }], profile: { name: 'Mia' } });
    expect(data.profile).toMatchObject({ name: 'Mia', sex: 'girl', volumeUnit: 'ml' });
    expect(data.vaccines.length).toBeGreaterThan(10);
  });

  it('does not bring back removed preset vaccines', () => {
    const first = getData().vaccines[0].id;
    actions.removeVaccine(first);
    const reloaded = normalizeData(JSON.parse(JSON.stringify(getData())));
    expect(reloaded.vaccines.some(v => v.id === first)).toBe(false);
  });

  it('drops entries with impossible dates or broken fields instead of crashing', () => {
    const result = actions.importBackup(JSON.stringify({
      logs: [
        { id: 'big', type: 'feeding', startTime: 1e17 },
        { id: 'null', type: 'feeding', startTime: null },
        { id: 'ok', type: 'feeding', startTime: T, details: { amountMl: '90', notes: { bad: true }, side: 'middle' } }
      ],
      growth: [{ id: 'g', date: 'nope', weight: 4 }, { id: 'g2', date: T, weight: '4.2' }],
      vaccines: [{ ageMonths: 2, done: true }]
    }));
    expect(result).toEqual({ logs: 1, growth: 1 });
    const log = getData().logs[0];
    expect(log.details).toEqual({ amountMl: 90 });
    expect(getData().growth[0].weight).toBe(4.2);
    expect(getData().vaccines.every(v => typeof v.id === 'string')).toBe(true);
  });

  it('does not duplicate entries without an id when the same file is imported twice', () => {
    const file = JSON.stringify([{ type: 'diaper', startTime: T }, { type: 'diaper', startTime: T }]);
    expect(actions.importBackup(file)).toEqual({ logs: 1, growth: 0 });
    expect(actions.importBackup(file)).toEqual({ logs: 0, growth: 0 });
  });

  it('keeps this device\'s profile when the backup has none', () => {
    actions.completeOnboarding({ name: 'Leo', sex: 'boy', birthDate: null, weightUnit: 'lb', lengthUnit: 'in', volumeUnit: 'oz' });
    actions.importBackup(JSON.stringify([{ id: 'x', type: 'diaper', startTime: T }]));
    expect(getData().profile).toMatchObject({ name: 'Leo', sex: 'boy', volumeUnit: 'oz' });
  });

  it('fills a missing birth date from the backup but keeps the rest of the profile', () => {
    actions.completeOnboarding({ name: 'Leo', sex: 'boy', birthDate: null, weightUnit: 'lb', lengthUnit: 'in', volumeUnit: 'oz' });
    actions.importBackup(JSON.stringify({ data: { logs: [], profile: { name: 'Other', sex: 'girl', birthDate: T } } }));
    expect(getData().profile).toMatchObject({ name: 'Leo', sex: 'boy', birthDate: T });
  });
});
